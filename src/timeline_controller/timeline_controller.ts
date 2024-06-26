import { PlaybackModes, SuspendPlaybackState } from './constants';

import {
  ChangeCurrentTimeEvent,
  ITimelineChartController,
  ITimelineController,
  RestorePlayback,
  SourceId
} from './types';

import * as date_time from '../utilities/date_time';
import * as duration from '../utilities/duration';

/**
 * The timeline controller synchronizes the video and chart controllers so that video shown is in
 * synchronization with the chart's current time/time offset represents the same instance.
 *
 * @remarks
 *   When users interact with the video controller's play/pause/rewind/forward, then this timeline
 *   controller shall synchronize the the chart controller to the time offset relative to that of
 *   the video controller.
 *
 *   Likewise, when users interact with the chart controller's navigation and zoom capabilities,
 *   then this timeline controller shall synchronize video controller to that time offset relative
 *   to that of the chart controller.
 *
 * @todo Define a common interface for controlling video and chart navigation.
 *   Implement a source controller interface providing properties and methods so that behavior can
 *   be consistent for a video & chart controller. Such that the timeline controller can have many
 *   controllers in which need to be synchronized to a specific time offset/point-in-time.
 *
 *   Where only one active controller is the playback source feeding the timeline controller and
 *   the timeline controller is responsible to revise/set the other controllers to that moment.
 *
 *   This is practical when adding more different kinds of charts such as ECG
 *   (electro-cardiogram graph) or supplemental video sources such as the patient's surrounding.
 *
 * @todo On live-feed the time range should be the latest available time.
 *   In the case of a live-feed we are using the current time. This isn't technically correct.
 *   Rather, it's the latest point-in-time uploaded by the VEEGix8 app.
 *
 *   The reason is the the chart view represent a point-in-time that is beyond what the sampling
 *   values that have been uploaded.
 *
 *   Therefore, this timeline controller needs to be notified whenever there are changes to the
 *   latest point-in-time that is available to be loaded into the chart view. Here we might just
 *   poll the recording session's record about the latest available point-in-time.
 */
export class TimelineController implements ITimelineController
{
  private readonly startTime: date_time.TimePoint;
  private finishTime?: date_time.TimePoint;
  private _currentTimeOffset: duration.Duration = 0;

  private currentSourceId?: SourceId;
  private video?: HTMLVideoElement;
  private chart?: ITimelineChartController;

  private playbackMode: PlaybackModes = PlaybackModes.None;
  private playbackSynchronizationTimer?: NodeJS.Timer;
  private synchronizationInterval: number = 100;
  private onRestorePlayback?: RestorePlayback;

  constructor(startTime: date_time.TimePoint,
              finishTime: date_time.TimePoint | undefined,
              referenceTime: date_time.TimePoint) {
    this.startTime = startTime;
    this.finishTime = finishTime;

    const timeRange = this.timeRange;
    const currentTime = (referenceTime < timeRange.min) ? timeRange.min
                      : (referenceTime > timeRange.max) ? timeRange.max
                      : referenceTime;

    this._currentTimeOffset = currentTime - this.startTime;
  }

  /**
   * ITimelineController interface
   */
  get timeRange(): date_time.TimePointRange {
    return {
              min: this.startTime,
              max: this.finishTime ?? Date.now()
           };
  }

  get currentTime(): date_time.TimePoint {
    return this.startTime + this.currentTimeOffset;
  }

  /**
   * Set the timeline controller's current time.
   *
   * @param timePoint - A point-in-time.
   *
   * @remarks
   *   Pause playback prior to setting the timeline controller's current time, as not to
   *   introduce a synchronization conflict between the video and chart controllers. Restore the
   *   playback state after that the specified point-in-time has been applied to both these
   *   controllers.
   */
  set currentTime(timePoint: date_time.TimePoint) {
    const onRestorePlayback = this.pause();

    this._currentTimeOffset = timePoint - this.startTime;
    this.setChartCurrentTime();
    this.setVideoCurrentTime();

    onRestorePlayback();
  }

  get currentTimeOffset(): duration.Duration {
    return this._currentTimeOffset;
  }

  set currentTimeOffset(timeOffset: duration.Duration) {
    this._currentTimeOffset = timeOffset;
  }

  addChart(chart: ITimelineChartController): void {
    chart.sourceId = 1;
    this.chart = chart;
  }

  removeChart(chart: ITimelineChartController): void {
    if (this.chart && chart.sourceId === this.chart.sourceId) {
      this.chart = undefined;
    }
  }

  addVideo(video: HTMLVideoElement): void {
    this.video = video;

    this.setVideoCurrentTime();
    this.playbackMode = PlaybackModes.Video;
    this.currentSourceId = 0;
    this.resume();
  }

  removeVideo(video: HTMLVideoElement): void {
    if (this.video && video.src === this.video.src) {
      this.video = undefined;
    }
  }

  /**
   * User is about to manually start navigating the timeline.
   *
   * @remarks
   *   This can be in the form of the user is:
   *     o interacting with the chart view as to drag the chart view's visible range
   *     o interacting with the chart view to select a given point-in-time within the chart.
   *
   *   Once that the navigation is done invoke the provided restoration callback to restore the
   *   timeline controller's state to what it was prior to starting the navigation using the
   *   chart.
   *
   * @todo
   *   Conceptually, it would be possible to provide a controller widget allowing users to
   *   jump to a point in time other than the video or chart view. Such as a entering a
   *   the point-in-time from a calendar or clock controls.
   */
  public startTimelineNavigation(sourceId: SourceId): RestorePlayback {
    const restorePlayback = this.pause();
    this.currentSourceId = sourceId;
    return restorePlayback;
  }

  public onChangeCurrentTime(event: ChangeCurrentTimeEvent) {
    if (!this.isVideoPlaying()) {
      this._currentTimeOffset = event.timeOffset;
      this.setVideoCurrentTime();
    }
  }

  /**
   * Set the timeline controller's to the chart's start time.
   */
  public gotoStartTime(): void {
    this.currentTime = this.startTime;
  }

  /**
   * Set the timeline controller's to the chart's finish time.
   */
  public gotoFinishTime(): void {
    this.currentTime = this.finishTime ?? Date.now();
  }

  /**
   * Indicate if timeline controller is playing.
   *
   * @todo
   *   When support of the playback mode is for the chart then add a condition
   *   to determine if the chart controller is playing or paused state.
   */
  public isPlaying(): boolean {
    return ((this.playbackMode & PlaybackModes.Video) !== 0)
        && this.isVideoPlaying();
  }

  /**
   * Pause the timeline controller.
   *
   * @param state: Playback state to set upon invoking the restore playback function.
   *
   * @returns A function to invoke to restore the timeline controller back to its current state.
   *
   * @remarks
   *   The restore function is meant to put the timeline controller back to its state just prior to
   *   pausing it.
   *
   *   Used in situations the timeline controller is playing and its source feed is the video
   *   controller, when the user interacts with the chart controller to navigate to a different
   *   point-in-time the expectation is for the video controller to be set to that revised
   *   point-in-time & playback to be resume from that revised point-in-time.
   *
   *   If the video was paused when the user navigates using the chart, then the video controller
   *   shall be set to that revised point-in-time & playback remains paused.
   *
   * @todo
   *   The interval timer might is likely creating a conflict on this timeline controller as to
   *   cause a jitter effect.
   *
   *   Introducing a state machine that defines which controller of the video or chart is managing
   *   this timeline controller should address this conflict and jittering.
   *
   *   When pausing the playback of video, then the chart controller is managing this timeline
   *   controller. Such that the change events that chart emits to this time controller shall
   *   result in synchronization of the video controller to that of the chart's current time.
   */
  public pause(state: SuspendPlaybackState = SuspendPlaybackState.On): RestorePlayback {
    const isPlaying = this.isPlaying();
    const restoreSourceId = this.currentSourceId;

    if (!isPlaying) {
      return () => {
        this.currentSourceId = restoreSourceId;
        this.playbackMode ^= this.playbackMode & state;
      }
    }

    this.playbackMode |= state;
    this.pauseVideo();

    return () => {
             this.currentSourceId = restoreSourceId;
             this.resume();
             this.playbackMode ^= this.playbackMode & state;
           };
  }

  /**
   * Resume playback of the timeline controller.
   *
   * @remarks
   *   If the video controller is the source feed then playback is relative to the video's
   *   controller current time (ie. current time).
   */
  public resume(): void {
    if (this.playbackMode !== PlaybackModes.None) {
      this.startPlaybackSynchronization();
    }

    if (this.playbackMode & PlaybackModes.Video) {
      this.resumeVideo();
    }
  }

  private startPlaybackSynchronization(): void {
    if (this.playbackSynchronizationTimer) {
      return;
    }

    this.playbackSynchronizationTimer =
      setInterval(() => this.onSynchronizePlayback(), this.synchronizationInterval);
  }

  private onSynchronizePlayback(): void {
    if (this.playbackMode & PlaybackModes.Suspended) {
      return;
    }

    switch (this.playbackMode) {
      case PlaybackModes.Video:
        this._currentTimeOffset = duration.secondsToDuration(this.video?.currentTime ?? 0);
        this.setChartCurrentTime();
        break;

      case PlaybackModes.Chart:
        this.chart?.shiftCurrentTime(this.synchronizationInterval);
        break;
    }
  }

  /**
   * Synchronizes the video view's current time with that of the timeline controller.
   *
   * @remarks
   *   The has the effect of seeking to that time offset within the video stream such that as the
   *   user navigates using the chart's timeline they'll be able to some of the individual video
   *   frames while they are navigating. This effect is desirable since it allows users to observe
   *   the patient where they might choose to resume from that moment or skip it.
   */
  private setVideoCurrentTime(): void {
    if (this.video) {
      this.video.currentTime = duration.durationToSeconds(this.currentTimeOffset);
    }
  }

  /**
   * Synchronizes the chart controller's current time with that of the timeline controller.
   *
   * @remarks
   *   Should the chart's indicates that it isn't ready for playback, then pause playback without
   *   suspending playback.
   *
   *   This occurs when the data for that point-in-time is still pending to be loaded into the
   *   chart. Playback resumes once that this data is loaded into the chart or when the user
   *   selects a different point-in-time in which that data is loaded into the chart.
   *
   *   A live feed is one such instance in which playback is paused until the incoming data has
   *   been uploaded to the cloud platform and then loaded into the chart.
   *
   *   While waiting for the video source feed to become accessible, the playback state remains in
   *   playing state so that if users were to navigate to another moment (i.e. earlier moment) in
   *   which that feed is accessible, then playback resume from that chosen moment.
   */
  private setChartCurrentTime(): void {
    if (this.chart) {
      this.chart.currentTime = this.currentTime;
    }

    if (this.chart?.isReadyForPlayback) {
      this.onRestorePlayback?.();
      this.onRestorePlayback = undefined;
    }
    else {
      const onRestorePlayback = this.pause(SuspendPlaybackState.Off);
      this.onRestorePlayback ??= onRestorePlayback;
    }
  }

  /**
   * Determine if the video controller is in a paused state.
   *
   * @return true when in the video controller is in a paused state.
   *
   * @remarks
   *   If the video controller is the source feed then playback is relative to the video's
   *   controller current time (ie. current time).
   */
  // private isVideoPaused(): boolean {
  //   return this.video?.paused ?? true;
  // }

  /**
   * Determine if the video controller is in a playing state.
   *
   * @return true when in the video controller is in a playing state.
   *
   * @remarks
   *   This is more than verifying the video's paused state. Instead, it's based upon these
   *   conditions (see below). This is important, since otherwise it can result in conflicts
   *   when issuing a pause request and a play request at the same time.
   *
   *   The reason being is that invoking video.play() is an asynchronous operation that takes a
   *   moment for the video playback to transition to a playing state. Whereas invoking
   *   video.pause() transitions the video's playback to a paused state.
  */
  private isVideoPlaying(): boolean
  {
    return (this.video !== undefined &&
            this.video.currentTime > 0 &&
            !this.video.paused &&
            !this.video.ended &&
            this.video.readyState > 2); // HAVE_CURRENT_DATA = 2, HAVE_FUTURE_DATA = 3, HAVE_ENOUGH_DATA = 4
  }

  /**
   * Pause the video controller's playback.
   *
   * @remarks
   *   When timeline controller's current playback feed is the chart controller or when the video
   *   controller's playback is in a paused state, then nothing occurs.
   */
  private pauseVideo(): void {
    if (this.isVideoPlaying()) {
      this.video?.pause();
    }
  }

  /**
   * Resume the video controller's playback.
   *
   * @remarks
   *   When timeline controller's current playback feed is the chart controller or when the video
   *   controller's playback is in a playing state, then nothing occurs.
   */
  private resumeVideo(): void
  {
    if (!this.isVideoPlaying()) {
      this.video?.play();
    }
  }
}

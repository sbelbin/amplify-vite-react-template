import { PlaybackModes, SuspendPlaybackState } from './constants';

import {
  ChangeCurrentTimeEvent,
  ITimelineChartController,
  ITimelineController,
  OnChangeCurrentTimeEvent,
  RestorePlayback
} from './types';

/**
 * The timeline controller synchronizes the video and chart controllers so that video shown is in
 * synchronization with the chart's current point-in-time/time offset represents the same instance.
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
 * @todo
 *   Implement a source controller interface providing properties and methods so that behavior can
 *   be consistent for a video & chart controller. Such that the timeline controller can have many
 *   controllers in which need to be synchronized to a specific time offset/point-in-time.
 *
 *   Where only one active controller is the playback source feeding the timeline controller and
 *   the timeline controller is responsible to revise/set the other controllers to that moment.
 *
 *   This is practical when adding more different kinds of charts such as ECG
 *   (electro-cardiogram graph) or supplemental video sources such as the patient's surrounding.
 */
export class TimelineController implements ITimelineController
{
  private video: HTMLVideoElement;
  private chart: ITimelineChartController;

  private playbackMode: PlaybackModes = PlaybackModes.None;
  private playbackSynchronizationTimer: NodeJS.Timer | undefined;
  private synchronizationInterval: number = 100;
  private chartTimelineChangesSubscription: OnChangeCurrentTimeEvent;
  private onRestorePlayback: RestorePlayback | undefined;

  constructor(video: HTMLVideoElement, chart: ITimelineChartController) {
    this.video = video;
    this.chart = chart;

    this.chart.bindTimelineController(this);

    this.chartTimelineChangesSubscription = (event: ChangeCurrentTimeEvent) => {
      if (!this.isVideoPlaying()) {
        this.setVideoCurrentTimeOffset(event.timeOffset);
      }
    };

    this.subscribeToChartTimelineChanges();

    this.setVideoCurrentTimeOffset(this.chart.currentTimeOffset);

    if (this.video) {
      this.playbackMode = PlaybackModes.Video;
    }

    this.resume();
  }

  /**
   * User is interacting with the chart and is about to start navigating the timeline by using
   * the chart.
   *
   * @remarks
   *   Once that the navigation is done invoke the provided restoration callback to restore the
   *   timeline controller's state to what it was prior to starting the navigation using the
   *   chart.
   */
  public startChartTimelineNavigation(): RestorePlayback {
    return this.pause();
  }

  /**
   * Subscribe to receive notifications about changes to the chart controller's current
   * time offset/point-in-time.
   */
  public subscribeToChartTimelineChanges(): void {
    this.chart.subscribeToTimelineChanges(this.chartTimelineChangesSubscription);
  }

  /**
   * Unsubscribe from receiving notifications about changes to the chart controller's current
   * time offset/point-in-time.
   */
  public unsubscribeFromChartTimelineChanges(): void {
    this.chart.unsubscribeToTimelineChanges(this.chartTimelineChangesSubscription);
  }

  /**
   * Set the timeline controller's current point-in-time.
   *
   * @param timePoint - A point-in-time (i.e timestamp).
   *
   * @remarks
   *   Pause playback prior to setting the timeline controller's current point-in-time, as not to
   *   introduce a synchronization conflict between the video and chart controllers. Restore the
   *   playback state after that the specified point-in-time has been applied to both these
   *   controllers.
   */
  public setCurrentTimePoint(timePoint: number): void {
    const onRestorePlayback = this.pause();

    this.chart.currentTimePoint = timePoint;

    onRestorePlayback();
  }

  /**
   * Set the timeline controller's to the chart's starting point-in-time.
   *
   * @remarks
   *   See setCurrentTimePoint.
   *
   * @todo:
   *   Possibly convert this to this.setCurrentTimeOffset(0 | Start).
   */
  public gotoStartTimePoint(): void {
    this.setCurrentTimePoint(this.chart.startTimePoint);
  }

  /**
   * Set the timeline controller's to the chart's finishing point-in-time.
   *
   * @remarks
   *   See setCurrentTimePoint.
   *
   * @todo:
   *   Possibly convert this to this.setCurrentTimeOffset(0 | Finish).
   */
  public gotoFinishTimePoint(): void {
    this.setCurrentTimePoint(this.chart.finishTimePoint);
  }

  /**
   * Indicate if timeline controller is playing.
   *
   * @todo
   *   When support of the playback mode is for the chart then add a condition
   *   to determine if the chart controller is playing or paused state.
   */
  public isPlaying(): boolean {
    return ((this.playbackMode & PlaybackModes.Video) !== 0) && this.isVideoPlaying();
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

    if (!isPlaying) {
      return () => {
        this.playbackMode ^= this.playbackMode & state;
      }
    }

    this.playbackMode |= state;
    this.pauseVideo();

    return () => {
             this.resume();
             this.playbackMode ^= this.playbackMode & state;
           };
  }

  /**
   * Resume playback of the timeline controller.
   *
   * @remarks
   *   If the video controller is the source feed then playback is relative to the video's
   *   controller current point-in-time (ie. current time).
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
        this.setChartCurrentTimeOffset(this.video.currentTime * 1000);
        break;

      case PlaybackModes.Chart:
        this.chart.shiftCurrentTimePoint(this.synchronizationInterval);
        break;
    }
  }

  /**
   * Synchronizes the video controller's current time offset with that of the timeline controller.
   *
   * @param timeOffset - Time offset.
   *
   * @remarks
   *   The has the effect of seeking to that time offset within the video stream such that as the
   *   user navigates using the chart's timeline they'll be able to some of the individual video
   *   frames while they are navigating. This effect is desirable since it allows users to observe
   *   the patient where they might choose to resume from that moment or skip it.
   */
  private setVideoCurrentTimeOffset(timeOffset: number): void {
    if (this.video) {
      this.video.currentTime = timeOffset / 1000;
    }
  }

  /**
   * Synchronizes the chart controller's current time offset with that of the timeline controller.
   *
   * @param timeOffset - Time offset.
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
  private setChartCurrentTimeOffset(timeOffset: number): void {
    this.chart.currentTimeOffset = timeOffset;

    if (this.chart.isReadyForPlayback) {
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
   *   controller current point-in-time (ie. current time).
   */
  private isVideoPaused(): boolean {
    return this.video?.paused ?? true;
  }

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
    return (this.video &&
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

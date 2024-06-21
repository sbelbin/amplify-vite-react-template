import * as date_time from '../utilities/date_time';
import * as duration from '../utilities/duration';

export type SourceId = number;

export type RestorePlayback = () => void;

export interface ChangeCurrentTime {
  timeOffset: duration.Duration;
  timePoint: date_time.TimePoint;
}

/**
 * Event indicating a change to the chart's current time-offset and point-in-time.
 */
export interface ChangeCurrentTimeEvent extends ChangeCurrentTime {
  sourceId: SourceId;
}

export interface ITimelineController {
  get timeRange(): date_time.TimePointRange;

  get currentTime(): date_time.TimePoint;
  set currentTime(timePoint: date_time.TimePoint);

  get currentTimeOffset(): duration.Duration;
  set currentTimeOffset(timeOffset: duration.Duration);

  addChart(chart: ITimelineChartController): void;
  removeChart(chart: ITimelineChartController): void;

  addVideo(video: HTMLVideoElement): void;
  removeVideo(video: HTMLVideoElement): void;

  startTimelineNavigation(sourceId: SourceId): RestorePlayback;

  /**
   * Callback that instances of the ITimelineSourceFeed shall invoke so that the
   * timeline-controller is aware that its current time has changed.
   *
   * @param event - Details of the feed's current point-in-time/time-offset.
   *
   * @remarks
   *   When the feed is the timeline=controller's current source, then the
   *   timeline-controller synchronizes the other feeds to reflect that same
   *   point-in-time.
   */
  onChangeCurrentTime(event: ChangeCurrentTimeEvent): void;
}

export interface ITimelineChartController {
  sourceId?: SourceId;

  get currentTime(): date_time.TimePoint;
  set currentTime(timePoint: date_time.TimePoint);

  get currentTimeOffset(): duration.Duration;
  set currentTimeOffset(timeOffset: duration.Duration);

  get remainingTimeOffset(): duration.Duration;

  get startTime(): date_time.TimePoint;
  get finishTime(): date_time.TimePoint;

  get isReadyForPlayback(): boolean;

  shiftCurrentTime(shiftAmount: duration.Duration): ChangeCurrentTime;
}

/**
 * @todo
 *   Proposed interface of different means to feed the timeline controller.
 *
 *   The concept being is that a timeline controller is bound to several of these feeds in which
 *   the timeline controller maintains these feeds in synch so that they reflect the same
 *   point-in-time.
 *
 *   The crux is that only a single feed is the source for the timeline controller to use as
 *   the reference point-in-time amongst the various feeds.
 */
  export interface ITimelineSourceFeed {
    sourceId?: SourceId;

    get currentTime(): date_time.TimePoint;
    set currentTime(timePoint: date_time.TimePoint);

    get currentTimeOffset(): duration.Duration;
    set currentTimeOffset(timeOffset: duration.Duration);

    get remainingTimeOffset(): duration.Duration;

    get startTime(): date_time.TimePoint;
    get finishTime(): date_time.TimePoint;

    get isReadyForPlayback(): boolean;

    shiftCurrentTime(shiftAmount: duration.Duration): ChangeCurrentTime;
}

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
  set currentTimeOffset(timeOffset: duration.Duration);

  startTimelineNavigation(sourceId: SourceId): RestorePlayback;

  onChangeCurrentTime(event: ChangeCurrentTimeEvent): void;
}

export interface ITimelineChartController {
  readonly sourceId: SourceId;

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

//
// @todo
//   This is a proposed interface which can be applied to different kinds of feeds to the
//   timeline controller.
//
//   The concept being is that a timeline controller is bound to several of these feeds in which
//   the timeline controller shall maintains synchronization amongst these feeds so that they all
//   reflect the same moment in time (time offset/poin-in-time).
//
//   The idea being is that a single feed is the source and it's current moment is used as the
//   reference point.
//
// export interface ITimelineFeedController {
//   get currentTimeOffset(): number;
//   set currentTimeOffset(timeOffset: number);
//
//   get startTimeOffset(): number;
//   get finishTimeOffset(): number;
//
//   get isReadyForPlayback(): boolean;
//
//   bindTimelineController(timeLineController: ITimelineController): void;
//
//   subscribeToTimelineChanges(callback: OnChangeCurrentTimeEvent): void;
//   unsubscribeToTimelineChanges(callback: OnChangeCurrentTimeEvent): void;
//
//   shiftCurrentTimeOffset(shiftAmount: number): number;
// }

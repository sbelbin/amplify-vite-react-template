export type RestorePlayback = () => void;

/**
 * Event indicating a change to the chart's current time-offset and point-in-time.
 */
export interface ChangeCurrentTimeEvent {
  timeOffset: number;
  timePoint: number;
}

export type OnChangeCurrentTimeEvent = (event: ChangeCurrentTimeEvent) => void;

export interface ITimelineController {
  startChartTimelineNavigation(): RestorePlayback;
}

export interface ITimelineChartController {
  get currentTimePoint(): number;
  set currentTimePoint(timePoint: number);

  get currentTimeOffset(): number;
  set currentTimeOffset(timeOffset: number);

  get startTimePoint(): number;
  get finishTimePoint(): number;

  get isReadyForPlayback(): boolean;

  bindTimelineController(timeLineController: ITimelineController): void;

  subscribeToTimelineChanges(callback: OnChangeCurrentTimeEvent): void;
  unsubscribeToTimelineChanges(callback: OnChangeCurrentTimeEvent): void;

  shiftCurrentTimePoint(shiftAmount: number): void;
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

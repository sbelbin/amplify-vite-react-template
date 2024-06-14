export enum RestoreTimelineNavigationBehavior {
  Immediate,
  Deferred
}

export interface IChartViewTimelineNavigation {
  startTimelineNavigation(): void;
  stopTimelineNavigation(restoreBehavior: RestoreTimelineNavigationBehavior): void;
}

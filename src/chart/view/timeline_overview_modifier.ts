import {
  IChartViewTimelineNavigation,
  RestoreTimelineNavigationBehavior
} from './types';

import {
  OverviewRangeSelectionModifier,
  ModifierMouseArgs
} from 'scichart';

export class TimelineOverviewModifier extends OverviewRangeSelectionModifier {
  private readonly timelineNavigation: IChartViewTimelineNavigation;
  private readonly restoreTimelineNavigationBehavior = RestoreTimelineNavigationBehavior.Deferred;

  constructor(timelineNavigation: IChartViewTimelineNavigation) {
    super();
    this.receiveHandledEvents = true;
    this.timelineNavigation = timelineNavigation;
  }

  modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    this.timelineNavigation.startTimelineNavigation();
  }

  modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
    this.timelineNavigation.stopTimelineNavigation(this.restoreTimelineNavigationBehavior);
  }

  modifierMouseWheel(args: ModifierMouseArgs): void {
    this.scopedChartTimelineNavigation(
      args,
      (args: ModifierMouseArgs) => super.modifierMouseWheel(args)
    );
  }

  modifierDoubleClick(args: ModifierMouseArgs) {
    this.scopedChartTimelineNavigation(
      args,
      (args: ModifierMouseArgs) => super.modifierDoubleClick(args)
    );
  }

  scopedChartTimelineNavigation(args: ModifierMouseArgs,
                                action: (args: ModifierMouseArgs) => void) {
    this.timelineNavigation.startTimelineNavigation();
    action(args);
    this.timelineNavigation.stopTimelineNavigation(this.restoreTimelineNavigationBehavior);
  }
}

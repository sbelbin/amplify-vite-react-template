import {
  IChartViewTimelineNavigation,
  RestoreTimelineNavigationBehavior
} from './types';

import {
  ChartModifierBase2D,
  ModifierMouseArgs
} from 'scichart';

export declare abstract class TimelineChartNavigator extends ChartModifierBase2D {
  readonly type = 'TimelineChartNavigator';

  private readonly restoreTimelineNavigationBehavior = RestoreTimelineNavigationBehavior.Deferred;
  private readonly timelineNavigation: IChartViewTimelineNavigation;

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

  private scopedChartTimelineNavigation(args: ModifierMouseArgs,
                                        action: (args: ModifierMouseArgs) => void) {
    this.timelineNavigation.startTimelineNavigation();
    action(args);
    this.timelineNavigation.stopTimelineNavigation(this.restoreTimelineNavigationBehavior);
  }
}

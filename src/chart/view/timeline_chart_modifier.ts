import {
  IChartViewTimelineNavigation,
  RestoreTimelineNavigationBehavior
} from './types';

import {
  ChartModifierBase2D,
  ModifierMouseArgs
} from 'scichart';

export class TimelineChartModifier extends ChartModifierBase2D {
  readonly type = 'TimelineChartModifier';

  private readonly restoreTimelineNavigationBehavior = RestoreTimelineNavigationBehavior.Immediate;
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

  scopedChartTimelineNavigation(args: ModifierMouseArgs,
                                action: (args: ModifierMouseArgs) => void) {
    this.timelineNavigation.startTimelineNavigation();
    action(args);
    this.timelineNavigation.stopTimelineNavigation(this.restoreTimelineNavigationBehavior);
  }
}

import * as timeline_controller from '../../timeline_controller';

import {
  OverviewRangeSelectionModifier,
  ModifierMouseArgs
} from 'scichart';

export class TimelineOverviewModifier extends OverviewRangeSelectionModifier {
  private readonly timelineController: timeline_controller.ITimelineController;
  private onRestorePlayback: timeline_controller.RestorePlayback | undefined;

  constructor(timelineController: timeline_controller.ITimelineController) {
    super();
    this.receiveHandledEvents = true;
    this.timelineController = timelineController;
  }

  modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    this.onRestorePlayback = this.timelineController.startChartTimelineNavigation();
  }

  modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
    this.onRestorePlayback?.();
    this.onRestorePlayback = undefined;
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
    const onRestorePlayback = this.timelineController?.startChartTimelineNavigation();
    action(args);
    onRestorePlayback();
  }
}

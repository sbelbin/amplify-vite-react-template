import { IChartViewTimelineNavigation } from './types';
import { RestorePlayback } from '../../timeline_controller';

import {
  OverviewRangeSelectionModifier,
  ModifierMouseArgs
} from 'scichart';

export class TimelineOverviewModifier extends OverviewRangeSelectionModifier {
  private readonly timelineNavigation: IChartViewTimelineNavigation;
  private onRestorePlayback?: RestorePlayback;

  constructor(timelineNavigation: IChartViewTimelineNavigation) {
    super();
    this.receiveHandledEvents = true;
    this.timelineNavigation = timelineNavigation;
  }

  modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    this.onRestorePlayback = this.timelineNavigation.startTimelineNavigation();
  }

  modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
    this.timelineNavigation.stopTimelineNavigation(this.onRestorePlayback);
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

  private scopedChartTimelineNavigation(args: ModifierMouseArgs,
                                        action: (args: ModifierMouseArgs) => void) {
    const onRestorePlayback = this.timelineNavigation.startTimelineNavigation();
    action(args);
    this.timelineNavigation.stopTimelineNavigation(onRestorePlayback);
  }
}

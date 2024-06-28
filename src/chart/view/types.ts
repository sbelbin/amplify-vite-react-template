import { RestorePlayback } from '../../timeline_controller';

export interface IChartViewTimelineNavigation {
  startTimelineNavigation(): RestorePlayback;
  stopTimelineNavigation(restorePlayback?: RestorePlayback): void;
}

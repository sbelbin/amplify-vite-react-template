import { TimePointRange } from '../../utilities/date_time';

export interface Annotation {
  timeRange: TimePointRange;
  notes: Array<string>
}

export type Annotations = Array<Annotation>;

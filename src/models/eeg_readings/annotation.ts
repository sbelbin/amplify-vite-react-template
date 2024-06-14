import * as date_time from '../../utilities/date_time';

export interface Annotation {
  timePointRange: date_time.TimePointRange;
  notes: Array<string>
}

export type Annotations = Array<Annotation>;

import * as generics from '../generics';

export type TimePoint = number;

export type DateTimeRange = generics.Range<Date>;
export type DateTimeUnboundedRange = generics.UnboundedRange<Date>;

export type TimePointRange = generics.Range<TimePoint>;
export type TimePointRangeUnbounded = generics.UnboundedRange<TimePoint>;

import { TimeUnits } from './constants';
import { Duration } from './types';

import { DateTimeRange } from '../date_time/types';

export function secondsToDuration(value: number): Duration {
  return value * TimeUnits.Second;
}

export function durationToSeconds(duration: Duration): number {
  return duration / TimeUnits.Second;
}

export function millisecondsToDuration(value: number): Duration {
  return value * TimeUnits.Millisecond;
}

export function minutesToDuration(value: number): Duration {
  return value * TimeUnits.Minute;
}

export function dateRangeToDuration(range: DateTimeRange): Duration {
  return (range.max.getTime() - range.min.getTime()) as Duration;
}

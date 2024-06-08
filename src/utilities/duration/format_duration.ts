import { TimeUnits } from './constants';
import { dateRangeToDuration } from './duration_conversions';
import { Duration } from './types';

import { formatMinutes, formatSeconds } from '../date_time/format_time';
import { DateTimeRange } from '../date_time/types';

/**
 * Returns a textual representation of a duration.
 *
 * @param duration - A duration of time in milliseconds.
 * @returns A textual representation.
 *
 * @remarks
 *   When the duration is more than a day, such as 36 hours, 30 minutes and 12 seconds then the output is `36:30:12`.
 *   Otherwise,  the duration is in minutes, then seconds is padded.
 *   When the duration is in seconds, then seconds are displayed.
 */
export function formatDuration(duration: Duration): string {
  let remainder = duration;

  const hours = Math.floor(remainder / TimeUnits.Hour);
  remainder -= hours * TimeUnits.Hour;

  const minutes = Math.floor(remainder / TimeUnits.Minute);
  remainder -= minutes * TimeUnits.Minute;

  const seconds = Math.floor(remainder / TimeUnits.Second);

  return `${hours}:${formatMinutes(minutes)}:${formatSeconds(seconds)}`;
}

/**
 * Returns a textual representation for a range of two dates.
 *
 * @param from - The starting point-in-time.
 * @param until - The finishing point-in-time.
 * @returns A textual representation.
 *
 * @remarks
 *   See formatDuration.
 */
export function formatDateRangeDuration(range: DateTimeRange): string {
  return formatDuration(dateRangeToDuration(range));
}

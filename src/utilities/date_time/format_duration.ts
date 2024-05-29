import { formatMinutes, formatSeconds } from "./format_time";

/**
 * Returns a textual representation of a duration that covers days/hours/minutes/seconds.
 *
 * @param from - The starting point-in-time.
 * @param until - The finishing point-in-time. When it's unknown then assume now.
 * @returns A textual representation.
 *
 * @remarks
 * When the duration is more than a day, such as 36 hours, 30 minutes and 12 seconds then the output is `36:30:12`.
 * Otherwise,  the duration is in minutes, then seconds is padded.
 * When the duration is in seconds, then seconds are displayed.
 */
function formatDuration(from: Date, until: Date): string {
  let remainder = until.getTime() - from.getTime();

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;

  const hours = Math.floor(remainder / HOUR);
  remainder -= hours * HOUR;

  const minutes = Math.floor(remainder / MINUTE);
  remainder -= minutes * MINUTE;

  const seconds = Math.floor(remainder / SECOND);

  return `${hours}:${formatMinutes(minutes)}:${formatSeconds(seconds)}`;
}

export default formatDuration;

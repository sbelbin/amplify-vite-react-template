/**
 * Formats a value with two digits.
 *
 * @param value - A number value.
 * @returns A textual representation.
 * @remarks A value of 9 will appear as '09', whereas a value of 10 will appear as '10'.
 */
export function formatDigit(value: number): string {
  return `${value.toString().padStart(2, '0')}`;
}

/**
 * Formats minutes with two digits.
 *
 * @param minutes - Minutes as a number value.
 * @returns A textual representation.
 * @remarks See formatDigit() function.
 */
export function formatMinutes(minutes: number): string {
  return formatDigit(minutes);
}

/**
 * Formats seconds with two digits.
 *
 * @param seconds - Minutes as a number value.
 * @returns A textual representation.
 * @remarks See formatDigit() function.
 */
export function formatSeconds(seconds: number): string {
  return formatDigit(seconds);
}

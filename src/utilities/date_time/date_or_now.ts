/**
 * Provides the given date or a Date of now when it's undefined or null.
 *
 * @param date: Minutes as a number value.
 * @returns A Date type.
 * @remarks This is useful in situations in which the a undefined/null indicates that the
 *          activity, such as a recording session, is still in effect.
 */
function dateOrNow(date: Date | null | undefined): Date {
  return (date !== undefined && date !== null) ? date
       : new Date(Date.now());
}

export default dateOrNow;
/**
 * Represents the conversion matrix for a timestamp unit (i.e. Date.getTime()) which is in
 * milliseconds to another unit of time.
 */
export enum TimeUnits {
  Base        = 1,
  Millisecond = Base,
  Second      = Millisecond * 1000,
  Minute      = Second      * 60,
  Hour        = Minute      * 60,
  Day         = Hour        * 24
}

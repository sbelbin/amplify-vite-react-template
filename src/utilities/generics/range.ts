export interface Range<T> {
  min: T;
  max: T;
}

/**
 * An unbounded range is one in which one of the limits are undefined.
 *
 * @remarks
 *   Useful to represent recording session that is a live-feed because the finishing time hasn't
 *   been determined.
 */
export interface UnboundedRange<T> {
  min?: T;
  max?: T;
}

export function diff<T extends number>(range: Range<T>): number {
  return range.max - range.min;
}

export function dateRangeDiff<T extends Date>(range: Range<T>): number {
  return range.max.getTime() - range.min.getTime();
}

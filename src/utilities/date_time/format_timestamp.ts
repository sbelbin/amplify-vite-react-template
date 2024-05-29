import hasValue from "../optional/has_value";

/**
 * Formats a timestamp in a manner that is consistent for all users.
 *
 * @param timestamp - A timestamp.
 * @returns A textual representation.
 */
export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('sv-SE');
}

export function formatOptionalTimestamp(timestamp: Date | null | undefined): string | undefined {
  return hasValue(timestamp)
       ? formatTimestamp(timestamp!)
       : undefined;
}

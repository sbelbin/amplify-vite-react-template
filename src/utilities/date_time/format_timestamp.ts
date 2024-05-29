/**
 * Formats a timestamp in a manner that is consistent for all users.
 *
 * @param timestamp - A timestamp.
 * @returns A textual representation.
 */
export default function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('sv-SE');
}

import { Recording } from './recording';
import { RecordingId } from './types';

import hasValue from '../../utilities/optional/has_value';
import { parseDate, parseOptionalDate } from '../../utilities/date_time/parse_date';

import type { Schema } from '../../../amplify/data/resource';

import { generateClient } from 'aws-amplify/api';

/**
 * Fetches a recording session from the underlying cloud storage.
 *
 * @param recordingId - Recording session identifier.
 * @returns Recording or null when not found.
 *
 * @remarks Fetches only the recording sessions to which the current authenticated context, such
 *          as a logged-in user, has read-access permissions to.
 */
export async function fetchRecordingById(recordingId: RecordingId) : Promise<Recording | null> {
  const client = generateClient<Schema>();

  const { data: recording, errors } = await client.models.recordings.get({ id: recordingId });

  if (errors) {
    throw new Error(errors.map((error) => error.message).join(', '));
  }

  return (recording === null)
       ? null
       : {
           id: recording.id,
           instituteId: recording.instituteId,
           sessionId: recording.sessionId,
           patientId: recording.patientId,
           startTime: parseDate(recording.startTimestamp),
           finishTime: parseOptionalDate(recording.finishTimestamp),
           localTimeZone: recording.localTimeZone,
           isLiveFeed: !hasValue(recording.finishTimestamp)
         };
}

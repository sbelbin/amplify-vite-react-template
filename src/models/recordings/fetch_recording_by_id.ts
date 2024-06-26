import { Recording } from './recording';
import { toRecording } from './transform';
import { RecordingId } from './types';

import type { Schema } from '../../../amplify/data/resource';

import { generateClient } from 'aws-amplify/api';

/**
 * Fetches a recording session by it's identifier.
 *
 * @param recordingId: Recording session identifier.
 * @returns Recording or undefined when not found.
 *
 * @remarks Fetches only the recording sessions to which the current authenticated context, such
 *          as a logged-in user, has read-access permissions to.
 */
export async function fetchRecordingById(recordingId: RecordingId) : Promise<Recording | undefined> {
  const client = generateClient<Schema>();

  const { data: recording, errors } = await client.models.recordings.get({ id: recordingId });

  if (errors) {
    throw new Error(errors.map((error) => error.message).join(', '));
  }

  return recording ? toRecording(recording) : undefined;
}

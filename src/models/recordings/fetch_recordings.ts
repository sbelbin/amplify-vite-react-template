import { Recording } from './recording';
import { toRecording } from './transform';

import type { Schema } from '../../../amplify/data/resource';

import { generateClient } from 'aws-amplify/api';

/**
 * Fetches the recording sessions from the underlying cloud storage.
 *
 * @returns Recording[].
 *
 * @remarks Fetches only the recording sessions to which the current authenticated context, such
 *          as a logged-in user, has read-access permissions to.
 */
export async function fetchRecordings() : Promise<Recording[]> {
  const client = generateClient<Schema>();

  const { data: recordings, errors } = await client.models.recordings.list();

  if (errors) {
    throw new Error(errors.map((error) => error.message).join(', '));
  }

  return recordings.map((recording) => toRecording(recording));
}

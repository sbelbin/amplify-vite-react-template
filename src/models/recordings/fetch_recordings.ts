import Recording from './recording';

import type { Schema } from '../../../amplify/data/resource';

import { generateClient } from 'aws-amplify/api';
import hasValue from '../../utilities/optional/has_value';
import { parseDate, parseOptionalDate } from '../../utilities/date_time/parse_date';

/**
 * Fetches the recording sessions from the underlying cloud storage.
 *
 * @returns Recording[].
 *
 * @remarks Fetches only the recording sessions to which the current authenticated context, such
 *          as a logged-in user, has read-access permissions to.
 */
async function fetchRecordings() : Promise<Recording[]> {
  const client = generateClient<Schema>();

  const { data: items, errors } = await client.models.recordings.list();

  if (errors) {
    throw new Error(errors.map((error) => error.message).join(', '));
  }

  return items.map((recording) => ({
    id: recording.id,
    instituteId: recording.instituteId,
    sessionId: recording.sessionId,
    patientId: recording.patientId,
    startTimestamp: parseDate(recording.startTimestamp),
    finishTimestamp: parseOptionalDate(recording.finishTimestamp),
    localTimeZone: recording.localTimeZone,
    isLiveFeed: !hasValue(recording.finishTimestamp)
  }));
}

export default fetchRecordings;

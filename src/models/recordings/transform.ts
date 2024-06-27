import { Data, Recording, Video } from './recording';

import * as storage from '../../storage';

import hasValue from '../../utilities/optional/has_value';
import { parseDate, parseOptionalDate } from '../../utilities/date_time/parse_date';

import type { Schema } from '../../../amplify/data/resource';

export namespace database {
  export type Recording = Schema["recordings"]["type"];
  export type Data = Recording["data"];
  export type Video = Recording["video"];

  export type StoragePath = string;
}

/**
 * Transforms a database representation of a recording session
 * into a representation that is more convenient to use in application code.
 *
 * @param recording: Recording session.
 * @returns An application representation of the recording session.
 */
export function toRecording(recording: database.Recording): Recording  {
  return {
           id: recording.id,
           instituteId: recording.instituteId,
           sessionId: recording.sessionId,
           patientId: recording.patientId,
           startTime: parseDate(recording.startTimestamp),
           finishTime: parseOptionalDate(recording.finishTimestamp),
           localTimeZone: recording.localTimeZone,
           isLiveFeed: !hasValue(recording.finishTimestamp),
           data: toData(recording.data),
           video: toVideo(recording.video)
         };
}

/**
 * Transforms a database representation of a recording session's data field
 * into a representation that is more convenient to use in application code.
 *
 * @param data: Recording session's data field.
 * @returns An application representation of the recording session's data field.
 */
export function toData(data: database.Data): Data | undefined {
  return (data)
       ? {
           folder: toStoragePath(data.folder!)
         }
       : undefined;
}

/**
 * Transforms a database representation of a recording session's video field
 * into a representation that is more convenient to use in application code.
 *
 * @param video: Recording session's video field.
 * @returns An application representation of the recording session's video field.
 */
export function toVideo(video: database.Video): Video | undefined {
  return (video)
       ? {
           channelARN: toOptionalString(video.channelARN),
           channelName: toOptionalString(video.channelName),
           folder: toOptionalStoragePath(video.folder),
           playbackURL: toOptionalURL(video.playbackURL),
           streamId: toOptionalString(video.streamId),
           streamSessionId: toOptionalString(video.streamSessionId)
         }
       : undefined;
}

function toOptionalString(value?: string | null): string | undefined {
  return hasValue(value)
       ? value!
       : undefined;
}

function toStoragePath(path: database.StoragePath): storage.Path {
    return {
             kind: storage.KindPath.AWS_S3,
             region: 'us-east-1',
             url: new URL(path)
           }
}

function toOptionalStoragePath(path?: database.StoragePath | null): storage.Path | undefined {
  return (path)
       ? toStoragePath(path)
       : undefined;
}

function toOptionalURL(url?: string | null): URL | undefined {
  return hasValue(url)
       ? new URL(url!)
       : undefined;
}

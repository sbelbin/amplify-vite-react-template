import { Data, Recording, Video } from './recording';

import * as storage from '../../storage';

import hasValue from '../../utilities/optional/has_value';
import { parseDate, parseOptionalDate } from '../../utilities/date_time/parse_date';

import type { Schema } from '../../../amplify/data/resource';

export type DBRecording = Schema["recordings"]["type"];
export type DBRecordingData = DBRecording["data"];
export type DBRecordingVideo = DBRecording["video"];

/**
 * Transforms a database representation of a recording session
 * into a representation that is more convenient to use in application code.
 *
 * @param recording: Recording session.
 * @returns An application representation of the recording session.
 */
export function toRecording(recording: DBRecording): Recording  {
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
export function toData(data: DBRecordingData): Data | undefined {
  return (data)
       ? {
           folder: toOptionalStoragePath(data.folder)
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
export function toVideo(video: DBRecordingVideo): Video | undefined {
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
  return (value !== undefined && value !== null)
       ? value
       : undefined;
}

function toOptionalStoragePath(path?: string | null): storage.Path | undefined {
  return (path)
       ? {
           kind: storage.KindPaths.AWS_S3,
           region: 'us-east-1',
           url: new URL(path)
         }
       : undefined;
}

function toOptionalURL(url?: string | null): URL | undefined {
  return (url)
       ? new URL(url)
       : undefined;
}
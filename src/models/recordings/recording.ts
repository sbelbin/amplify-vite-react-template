import {
  InstituteId,
  PatientId,
  RecordingId,
  SessionId,
  TimeZone
} from './types';

import * as storage from '../../storage';

export interface Data {
  folder: storage.Path;
}

export interface Video {
  channelARN?: string;
  channelName?: string;
  folder?: storage.Path;
  playbackURL?: URL;
  streamId?: string;
  streamSessionId?: string;
}

export interface Recording {
  id: RecordingId;
  instituteId: InstituteId;
  patientId: PatientId;
  sessionId: SessionId;
  startTime: Date;
  finishTime?: Date;
  localTimeZone: TimeZone;
  isLiveFeed: boolean;
  data?: Data;
  video?: Video;
}

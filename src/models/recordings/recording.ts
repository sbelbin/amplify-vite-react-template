import {
  InstituteId,
  PatientId,
  RecordingId,
  SessionId,
  TimeZone
} from './types';

export interface Data {
  folder: URL;
}

export interface Video {
  channelARN?: string;
  channelName?: string;
  folder?: URL;
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

export interface Data {
  folder: URL;
};

export interface Video {
  channelARN?: string;
  channelName?: string;
  folder?: URL;
  playbackURL?: URL;
  streamId?: string;
  streamSessionId?: string;
};

interface Recording {
  id: string;
  instituteId: string;
  patientId: string;
  sessionId: string;
  startTime: Date;
  finishTime?: Date;
  localTimeZone: string;
  isLiveFeed: boolean;
  data?: Data;
  video?: Video;
};

export default Recording;

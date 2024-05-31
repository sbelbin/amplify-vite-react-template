import { AwsCredentialIdentity } from '@aws-sdk/types';

export const enum LoadSequence {
  Earliest = 'earliest',
  Latest = 'latest'
}

/**
 * Callback to invoke whenever the ChartLoader has fetched a raw data dataPayload that
 * represents a segment of the EEG readings from the storage server.
 *
 * @param dataPayload: The raw data payload.
 */
export type OnDataPayloadReady = (dataPayload: ArrayBuffer) => void;

export const enum KindEventMessage {
  Initialize = 'initialize',
  Start = 'start',
  Stop = 'stop',
  Terminate = 'terminate'
}

export interface InitializeEventMessage {
  kind: KindEventMessage.Initialize;
  storageRegion: string;
  storageCredentials?: AwsCredentialIdentity;
  bucket: string;
  folder: string;
  filesLoaded: string[];
  loadSequence: LoadSequence;
}

export interface StartEventMessage {
  kind: KindEventMessage.Start;
  interval: number;
}

export interface StopEventMessage {
  kind: KindEventMessage.Stop;
}

export interface TerminateEventMessage {
  kind: KindEventMessage.Terminate;
}

export type EventMessage = InitializeEventMessage | StartEventMessage | StopEventMessage | TerminateEventMessage;

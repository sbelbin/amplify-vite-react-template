import { AwsCredentialIdentity } from '@aws-sdk/types';

export const enum LoadSequence {
  Earliest = 'earliest',
  Latest = 'latest'
}

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

/**
 * A response from the chart loader to indicate that a data payload has fetched from the storage
 * server.
 */
export interface DataPayloadReady {
  filePath: string,
  dataPayload: ArrayBuffer
}

/**
 * Different kinds of response messages emitted by the chart loader, such as indicating when a
 * data payload is ready to be loaded into the chart.
 */
export const enum KindResponseMessage {
  DataPayloadReady = 'data_payload_ready'
}

/**
 * An event response message representing a DataPayloadReady response.
 */
export interface DataPayloadReadyMessage extends DataPayloadReady{
  kind: KindResponseMessage.DataPayloadReady
}

export type ResponseMessage = DataPayloadReadyMessage;

/**
 * Callback function for the chart loader to invoke when it has fetched a data payload from the
 * storage server.
 *
 * @param dataPayload: The raw data payload.
 */
export type OnDataPayloadReady = (response: DataPayloadReady) => void;

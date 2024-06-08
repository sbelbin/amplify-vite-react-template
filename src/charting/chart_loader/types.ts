import { AwsCredentialIdentity } from '@aws-sdk/types';

export const enum LoadSequence {
  Earliest = 'earliest',
  Latest = 'latest'
}

export const enum KindRequestMessage {
  Initialize = 'initialize',
  Start = 'start',
  Stop = 'stop',
  Terminate = 'terminate'
}

export interface InitializeRequestMessage {
  kind: KindRequestMessage.Initialize;
  storageRegion: string;
  storageCredentials?: AwsCredentialIdentity;
  bucket: string;
  folder: string;
  filesLoaded: string[];
  loadSequence: LoadSequence;
}

export interface StartRequestMessage {
  kind: KindRequestMessage.Start;
  interval: number;
}

export interface StopRequestMessage {
  kind: KindRequestMessage.Stop;
}

export interface TerminateRequestMessage {
  kind: KindRequestMessage.Terminate;
}

export type RequestMessage = InitializeRequestMessage | StartRequestMessage | StopRequestMessage | TerminateRequestMessage;

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

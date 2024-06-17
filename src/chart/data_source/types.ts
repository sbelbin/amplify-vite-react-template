import * as eeg_readings from '../../models/eeg_readings';

import { AwsCredentialIdentity } from '@aws-sdk/types';

export const enum LoadSequence {
  Earliest = 'earliest',
  Latest = 'latest'
}

export interface RecordingSessionFolderDetails {
  region: string;
  bucket: string;
  folder: string;
}

export const enum KindRequestMessage {
  Initialize = 'initialize',
  Start = 'start',
  Stop = 'stop',
  Dispose = 'dispose'
}

export interface InitializeRequestMessage {
  kind: KindRequestMessage.Initialize;
  storageCredentials?: AwsCredentialIdentity;
  folderDetails: RecordingSessionFolderDetails;
  loadSequence: LoadSequence;
}

export interface StartRequestMessage {
  kind: KindRequestMessage.Start;
  interval: number;
}

export interface StopRequestMessage {
  kind: KindRequestMessage.Stop;
}

export interface DisposeRequestMessage {
  kind: KindRequestMessage.Dispose;
}

export type RequestMessage = InitializeRequestMessage | StartRequestMessage | StopRequestMessage | DisposeRequestMessage;

/**
 * Different kinds of response messages emitted by the chart data source, such as indicating when a
 * definitions are ready or when a segment is ready.
 */
export const enum KindResponseMessage {
  DefinitionsReady = 'definitions_ready',
  SegmentReady = 'segment_ready',
  Disposed = 'disposed'
}

/**
 * An event response message representing a DataPayloadReady response.
 */
export interface DefinitionReadyMessage extends eeg_readings.SignalDefinitions {
  kind: KindResponseMessage.DefinitionsReady
}

export interface SegmentReadyMessage extends eeg_readings.Segment {
  kind: KindResponseMessage.SegmentReady
}

export interface DisposedMessage {
  kind: KindResponseMessage.Disposed
}

export type ResponseMessage = DefinitionReadyMessage | SegmentReadyMessage | DisposedMessage;

/**
 * Callback function for the chart data source to invoke when it has fetched the definitions
 * of the signals that are being sampled within the recording session.
 *
 * @param definitions - The signal definitions.
 */
export type OnDefinitionsReady = (definitions: eeg_readings.SignalDefinitions) => void;

/**
 * Callback function for the chart data source to invoke when it has fetched a segment of the
 * recording session's sample values and annotation notes.
 *
 * @param segment - A segment of the recording session.
 */
export type OnSegmentReady = (segment: eeg_readings.Segment) => void;

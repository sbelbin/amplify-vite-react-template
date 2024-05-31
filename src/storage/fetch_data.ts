import { maximumChunkSize } from './constants';

import {
  Client,
  OffsetRange
} from './types';

import {
  GetObjectCommand,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3';

/**
 * Fetches a single data segment.
 *
 * @param client: The storage client.
 * @param bucket: The storage bucket/container.
 * @param folder: The absolute path of the folder relative to the bucket.
 * @param offsetRange: The offset range to fetch.
 * @returns An array of bytes.
 *
 * @remarks The custom filter and custom sorting are practical means to reduce the amount of files
 *          to return from this function. This can reduce the complexity to the code that invokes
 *          this function since they can simply enumerate the list that is returned.
 */
export function fetchDataSegment(client: Client,
                                 bucket: string,
                                 key: string,
                                 offsetRange: OffsetRange): Promise<Uint8Array> {
  const command = new GetObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        Range: composeRange(offsetRange),
                      });

  return getDataSegment(client, command);
}

/**
 * Fetches a multiple data segments.
 *
 * @param client: The storage client.
 * @param bucket: The storage bucket/container.
 * @param folder: The absolute path of the folder relative to the bucket.
 * @param size: The number of bytes to fetch.
 * @param offsetRange: The offset range to start fetch from.
 * @returns Array buffer of bytes.
 *
 * @remarks The custom filter and custom sorting are practical means to reduce the amount of files
 *          to return from this function. This can reduce the complexity to the code that invokes
 *          this function since they can simply enumerate the list that is returned.
 */
export async function fetchData(client: Client,
                                bucket: string,
                                key: string,
                                size: number,
                                startOffset: number = 0,
                                chunkSize: number = maximumChunkSize) : Promise<ArrayBuffer> {
  const buffer = new ArrayBuffer(size);
  const dataPayload = new Uint8Array(buffer);

  const finishOffset = startOffset + size - 1;
  let currentOffset = startOffset;

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  while (currentOffset < finishOffset) {
    const bytesToRead = Math.min(finishOffset - currentOffset, chunkSize);

    command.input.Range = composeRange({ start: currentOffset, finish: currentOffset + bytesToRead - 1 });

    dataPayload.set(await getDataSegment(client, command), currentOffset);

    currentOffset += bytesToRead;
  }

  return buffer;
}

//
// Internal
//

function composeRange(offsetRange: OffsetRange) : string {
  return `bytes=${offsetRange.start}-${offsetRange.finish}`;
}

function assertResponse(response: GetObjectCommandOutput): GetObjectCommandOutput {

  // if (result.httpStatusCode < 200 && result.httpStatusCode > 299) {
  //     console.log(`An invalid HTTP response has occurred. http_status_code: ${result.httpStatusCode}.`);
  //     throw new Error(`An invalid HTTP response has occurred. http_status_code: ${result.httpStatusCode}.`);
  // }

  return response;
}

async function sendCommand(client: Client,
                           command: GetObjectCommand): Promise<GetObjectCommandOutput> {
  return assertResponse(await client.send(command));
}

async function getDataSegment(client: Client,
                              command: GetObjectCommand): Promise<Uint8Array> {
  const response = await sendCommand(client, command);

  if (!response.Body) {
    throw new Error('Failed to extract body the response.');
  }

  return await response.Body.transformToByteArray();
}

import { unfilteredListFiles } from './constants';

import { assertAWSResponse } from '../utilities/error_handling/aws_assert_response';

import {
  Client,
  File,
  ListFilesFilter,
  ListFilesOrderBy
} from './types';

import {
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';

/**
 * Provides a list of files that exist in the specified folder and its subfolders.
 *
 * @param client: The storage client.
 * @param bucket: The storage bucket/container.
 * @param folder: The absolute path of the folder relative to the bucket.
 * @param customFilter: A custom function to filter the files.
 * @param customOrderBy: A custom function to sort this list of files.
 * @returns An array of files.
 *
 * @remarks The custom filter and custom sorting are practical means to reduce the amount of files
 *          to return from this function. This can reduce the complexity to the code that invokes
 *          this function since they can simply enumerate the list that is returned.
 */
export async function listFilesInFolder(client: Client,
                                        bucket: string,
                                        folder: string,
                                        customFilter: ListFilesFilter = unfilteredListFiles,
                                        customOrderBy?: ListFilesOrderBy): Promise<File[]>
{
  const delimiter = '/';

  const listFilesFilter = (file: File) =>
    !(file.Key?.endsWith(delimiter)) && customFilter(file);

  const applyFilter = (contents?: File[]) =>
    contents?.filter((object) => listFilesFilter(object)) ?? [];

  const command = new ListObjectsV2Command({
                        Bucket: bucket,
                        Prefix: folder
                      });

  let response = await sendCommand(client, command);
  const filesList = applyFilter(response.Contents);

  while (response.IsTruncated) {
    command.input.ContinuationToken = response.NextContinuationToken;
    response = await sendCommand(client, command);
    filesList.push(...applyFilter(response.Contents));
  }

  return (customOrderBy)
       ? filesList.sort((lhs, rhs) => customOrderBy(lhs, rhs))
       : filesList;
}

/**
 * Provides a list of files that were created or modified after the given reference point-in-time.
 *
 * @param date: Minutes as a number value.
 * @returns An array of files.
 *
 * @remarks This is useful in situations such as the monitoring a given folder & its sub-folders
 *          as to act when files are added into the folder.
 */
export async function listFilesModifiedAfter(client: Client,
                                             bucket: string,
                                             folder: string,
                                             referenceTime: Date,
                                             customFilter: ListFilesFilter = unfilteredListFiles,
                                             orderBy?: ListFilesOrderBy): Promise<File[]>
{
  const fileListFilter = (file: File) => {
    const fileLastModified = file.LastModified?.getTime() ?? 0;
    return (fileLastModified > referenceTime.getTime()) && customFilter(file);
  }

  return listFilesInFolder(client, bucket, folder, fileListFilter, orderBy);
}

//
// Internal
//

async function sendCommand(client: Client,
                           command: ListObjectsV2Command): Promise<ListObjectsV2CommandOutput> {
  return assertAWSResponse(await client.send(command));
}

/**
 * Define the different kinds of folder types.
 *
 * @remarks
 *   Currently only supports AWS's S3 buckets, but in time could support other cloud storage providers
 *   such as Microsoft's Azure Blob storage and OVH's S3 buckets.
 */
export const enum KindPath {
  AWS_S3 = 'AWS_S3',
  AZURE_BLOB = 'AZURE_BLOB'
}

/**
 * Interface supporting the different kinds of folders.
 *
 * @remarks
 *   The provides a general interface in which the storage API accepts as the location
 *   of a file/folder to a (cloud) storage provider.
 *
 * @todo Adapt storage API
 *   Adapt the various storage API functions as to accepts
 *   turn proceeds to interface with the corresponding cloud storage provider in order
 *   to accomplish the operation(s) such as fetching the data.
 */
export interface IPath {
  kind: KindPath;
  url: URL;
}

/**
 * Path to a file/folder on a AWS S3 bucket.
 *
 * @remarks
 *   AWS operates by regions and it's recommended when operating with an AWS S3 bucket to
 *   establish an authenticated client connection within that given region. Otherwise, if
 *   not in the appropriate region, then the S3 bucket might not be found or unreachable
 *   from the default AWS region.
 */
export interface AWSS3Path extends IPath {
  kind: KindPath.AWS_S3
  region: string;
}

export interface AzureBlobFolder extends IPath {
  kind: KindPath.AZURE_BLOB;
}

/**
 * Implementation to supporting the different kinds of folders.
 *
 * @todo Adapt storage API
 *   Adapt the various storage API functions to accept a Path type (or IPath) as the input or as
 *   return value so the application can support alternative storage providers as to minimize the
 *   storage implementation details from the application's core logic.
 */
export type Path = AWSS3Path | AzureBlobFolder;

export function parsePath(text: string): Path | undefined {
  const path = JSON.parse(text);

  const kind = path.kind as KindPath;
  const url = new URL(path.url);

  switch (kind) {
    case KindPath.AWS_S3:
      return {
               kind: kind,
               region: path.region,
               url: url
             };

    case KindPath.AZURE_BLOB:
      return {
               kind: kind,
               url: url
             };
  }

  return undefined;
}

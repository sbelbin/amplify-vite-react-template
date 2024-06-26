import {
  _Object,
  S3Client
} from '@aws-sdk/client-s3';

export type Client = S3Client;
export type File = _Object;

export type ListFilesFilter = (file: File) => boolean;
export type ListFilesOrderBy = (lhs: File, rhs: File) => number;

export interface OffsetRange {
  start: number
  finish: number
}

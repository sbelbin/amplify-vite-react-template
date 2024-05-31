import {
  File,
  ListFilesFilter,
  ListFilesOrderBy
} from './types';

export const MB = 1048576;
export const maximumChunkSize = 10 * MB;

export const unfilteredListFiles: ListFilesFilter = () => true;

export const orderByLastModifiedAscending: ListFilesOrderBy = (lhs: File, rhs: File) => {
  const lhsLastModified = lhs.LastModified?.getTime() ?? 0;
  const rhsLastModified = rhs.LastModified?.getTime() ?? 0;

  return (lhsLastModified === rhsLastModified) ? 0
       : (lhsLastModified < rhsLastModified) ? 1
       : -1;
}

export const orderByLastModifiedDescending: ListFilesOrderBy = (lhs: File, rhs: File) => {
  const lhsLastModified = lhs.LastModified?.getTime() ?? 0;
  const rhsLastModified = rhs.LastModified?.getTime() ?? 0;

  return (lhsLastModified === rhsLastModified) ? 0
       : (lhsLastModified > rhsLastModified) ? 1
       : -1;
}

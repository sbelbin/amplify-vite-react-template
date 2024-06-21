import {
  File,
  ListFilesFilter,
  ListFilesOrderBy
} from './types';

export const MB = 1048576;
export const maximumChunkSize = 10 * MB;

export const unfilteredListFiles: ListFilesFilter = () => true;

const compareLastModified = (lhs: File, rhs: File, isDescending: boolean) => {
  const lhsLastModified = lhs.LastModified?.getTime() ?? 0;
  const rhsLastModified = rhs.LastModified?.getTime() ?? 0;

  return isDescending
       ? rhsLastModified - lhsLastModified
       : lhsLastModified - rhsLastModified;
}

export const orderByLastModifiedAscending: ListFilesOrderBy = (lhs: File, rhs: File) => {
  return compareLastModified(lhs, rhs, false);
}

export const orderByLastModifiedDescending: ListFilesOrderBy = (lhs: File, rhs: File) => {
  return compareLastModified(lhs, rhs, true);
}

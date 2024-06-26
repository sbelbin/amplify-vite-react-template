import { AWS_S3_Path } from './path';
import {
  S3BucketPath,
  S3RegionBucketPath
} from './s3_bucket_path';

export function toS3BucketPath(path: AWS_S3_Path) : S3BucketPath | undefined {
  return isValidS3URL(path.url)
       ? {
           bucket: getBucket(path.url),
           path: getPath(path.url)
         }
       : undefined;
}

export function toS3RegionBucketPath(path: AWS_S3_Path) : S3RegionBucketPath | undefined {
  return isValidS3URL(path.url)
       ? {
           bucket: getBucket(path.url),
           path: getPath(path.url),
           region: path.region
         }
       : undefined;
}

function isValidS3URL(url: URL): boolean {
  return (url.protocol === 's3:' && url.pathname.length !== 0);
}

function getBucket(url: URL): string {
  const pos = url.pathname.indexOf('/', 2);
  return url.pathname.substring(2, pos);
}

function getPath(url: URL): string {
  const pos = url.pathname.indexOf('/', 2);
  return url.pathname.substring(pos + 1);
}

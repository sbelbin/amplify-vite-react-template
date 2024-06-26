export interface S3BucketPath {
  bucket: string;
  path: string;
}

export interface S3RegionBucketPath extends S3BucketPath {
  region?: string;
}

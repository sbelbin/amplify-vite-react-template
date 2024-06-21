import { Client } from './types';

import * as authentication from '../authentication';

import { S3Client } from '@aws-sdk/client-s3';
import { AwsCredentialIdentity } from '@aws-sdk/types';

export function connectWithCredentials(region: string, credentials: AwsCredentialIdentity | undefined): Client {
  return new S3Client({ region: region, credentials: credentials });
}

export async function connect(region: string): Promise<Client> {
  return connectWithCredentials(region, await authentication.sessionCredentials());
}

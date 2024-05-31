import {
  fetchAuthSession
} from 'aws-amplify/auth';

import { AWSCredentials } from '@aws-amplify/core/internals/utils';

export async function sessionAccessToken() {
  const result = await fetchAuthSession();
  return result.tokens?.accessToken
}

export async function sessionCredentials(): Promise<AWSCredentials | undefined> {
  const result = await fetchAuthSession();
  return result.credentials;
}

import { getCurrentUser } from 'aws-amplify/auth';

export async function currentUserName(): Promise<string | undefined> {
  const result = await getCurrentUser();
  return result.signInDetails?.loginId;
}

export async function isUserLoggedIn(): Promise<boolean> {
  return (await currentUserName()) !== undefined;
}

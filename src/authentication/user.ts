import { getCurrentUser } from 'aws-amplify/auth';

export async function authenticatedUserLoginId(): Promise<string | undefined> {
  try {
    const result = await getCurrentUser();

    return result.signInDetails?.loginId;
  } catch(error) {
    return undefined;
  }
}

export async function isAuthenticatedUserLoggedIn(): Promise<boolean> {
  return await authenticatedUserLoginId() !== undefined;
}

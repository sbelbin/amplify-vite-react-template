import {
  fetchAuthSession,
  getCurrentUser,
  JWT
} from 'aws-amplify/auth';

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

export async function authenticatedUserAccessToken(): Promise<JWT | undefined> {
  try {
    const result = await fetchAuthSession();
    return result.tokens?.accessToken
  } catch(error) {
    return undefined;
  }
}

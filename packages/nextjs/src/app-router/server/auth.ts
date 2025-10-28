import { getAuthDataFromRequest } from '../../server/data/getAuthDataFromRequest';
import type { RequestLike } from '../../server/types';
import type { Aobj,TernSecureUser } from '../../types';
import { buildRequestLike } from './utils';

/**
 * `Auth` object of the currently active user and the `redirectToSignIn()` method.
 */
type Auth = Aobj;

export interface AuthFn {
  (): Promise<Auth>;
}

const createAuthObject = () => {
  return async (req: RequestLike) => {
    return getAuthDataFromRequest(req);
  };
};

/**
 * Get the current authenticated user from the session cookies
 */
export const auth: AuthFn = async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only');

  const request = await buildRequestLike();

  const authObject = await createAuthObject()(request);

  return Object.assign(authObject);
};


export { TernSecureUser }
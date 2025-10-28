import type { DecodedIdToken } from '@tern-secure/types';

import { getAuth } from '../auth';
import { constants } from '../constants';
import type { TokenCarrier } from '../utils/errors';
import {
  RefreshTokenErrorReason,
  TokenVerificationError,
  TokenVerificationErrorReason,
} from '../utils/errors';
import type { RequestState, SignedInState, SignedOutState } from './authstate';
import { AuthErrorReason, signedIn, signedOut } from './authstate';
import { createRequestProcessor } from './c-authenticateRequestProcessor';
import { getCookieNameEnvironment, getCookiePrefix } from './cookie';
import { createTernSecureRequest } from './ternSecureRequest';
import type { AuthenticateRequestOptions } from './types';
import { verifyToken } from './verify';

function hasAuthorizationHeader(request: Request): boolean {
  return request.headers.has('Authorization');
}

function isRequestForRefresh(
  error: TokenVerificationError,
  context: { refreshTokenInCookie?: string },
  request: Request,
) {
  return (
    error.reason === TokenVerificationErrorReason.TokenExpired &&
    !!context.refreshTokenInCookie &&
    request.method === 'GET'
  );
}

export async function authenticateRequest(
  request: Request,
  options: AuthenticateRequestOptions,
): Promise<RequestState> {
  const context = createRequestProcessor(createTernSecureRequest(request), options);
  const { refreshTokenInCookie } = context;

  const { refreshExpiredIdToken } = getAuth(options);

  async function refreshToken() {
    if (!refreshTokenInCookie) {
      return {
        data: null,
        error: {
          message: 'No refresh token available',
          reason: AuthErrorReason.SessionTokenMissing,
        },
      };
    }
    return await refreshExpiredIdToken(refreshTokenInCookie, {
      referer: context.ternUrl.origin,
    });
  }

  async function handleRefresh(): Promise<
    | { data: { decoded: DecodedIdToken; token: string; headers: Headers }; error: null }
    | { data: null; error: any }
  > {
    const { data: refreshedData, error } = await refreshToken();
    if (!refreshedData) {
      return { data: null, error };
    }

    const headers = new Headers();
    const { idToken } = refreshedData;

    const maxAge = 3600;
    const cookiePrefix = getCookiePrefix();
    const idTokenCookieName = getCookieNameEnvironment(constants.Cookies.IdToken, cookiePrefix);
    const baseCookieAttributes = 'HttpOnly; Secure; SameSite=Strict; Path=/';

    const idTokenCookie = `${idTokenCookieName}=${idToken}; ${baseCookieAttributes};`;
    headers.append('Set-Cookie', idTokenCookie);

    const { data: decoded, errors } = await verifyToken(idToken, options);
    if (errors) {
      return {
        data: null,
        error: errors ? errors[0] : new Error('Failed to verify refreshed token'),
      };
    }
    return { data: { decoded, token: idToken, headers }, error: null };
  }

  async function authenticateRequestWithTokenInCookie() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = await verifyToken(context.idTokenInCookie!, options);

      if (errors) {
        throw errors[0];
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedInRequestState = signedIn(context, data, undefined, context.idTokenInCookie!);
      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'cookie');
    }
  }

  async function authenticateRequestWithTokenInHeader() {
    const { sessionTokenInHeader } = context;
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { data, errors } = await verifyToken(sessionTokenInHeader!, options);

      if (errors) {
        throw errors[0];
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const signedInRequestState = signedIn(context, data, undefined, sessionTokenInHeader!);
      return signedInRequestState;
    } catch (err) {
      return handleError(err, 'header');
    }
  }

  async function handleError(
    err: unknown,
    tokenCarrier: TokenCarrier,
  ): Promise<SignedInState | SignedOutState> {
    if (!(err instanceof TokenVerificationError)) {
      return signedOut(context, AuthErrorReason.UnexpectedError);
    }

    let refreshError: string | null;
    if (isRequestForRefresh(err, context, request)) {
      const { data, error } = await handleRefresh();
      if (data) {
        return signedIn(context, data.decoded, data.headers, data.token);
      }

      if (error?.cause?.reason) {
        refreshError = error.cause.reason;
      }
    } else {
      if (request.method !== 'GET') {
        refreshError = RefreshTokenErrorReason.NonEligibleNonGet;
      } else if (!context.refreshTokenInCookie) {
        refreshError = RefreshTokenErrorReason.NonEligibleNoCookie;
      } else {
        refreshError = null;
      }
    }

    err.tokenCarrier = tokenCarrier;

    return signedOut(context, err.reason, err.getFullMessage());
  }

  if (hasAuthorizationHeader(request)) {
    return authenticateRequestWithTokenInHeader();
  }

  return authenticateRequestWithTokenInCookie();
}

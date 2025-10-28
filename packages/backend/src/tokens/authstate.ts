import type { CheckAuthorizationFromSessionClaims, DecodedIdToken } from '@tern-secure/types';
import type { JWTPayload } from 'jose';

import { constants } from '../constants';
import type { TokenVerificationErrorReason } from '../utils/errors';
import { mapJwtPayloadToDecodedIdToken } from '../utils/mapDecode';
import type { RequestProcessorContext } from './c-authenticateRequestProcessor';
import type { TernSecureRequest } from './ternSecureRequest';

export const AuthStatus = {
  SignedIn: 'signed-in',
  SignedOut: 'signed-out',
} as const;

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

export const AuthErrorReason = {
  SessionTokenAndUATMissing: 'session-token-and-uat-missing',
  SessionTokenMissing: 'session-token-missing',
  SessionTokenExpired: 'session-token-expired',
  SessionTokenIATBeforeClientUAT: 'session-token-iat-before-client-uat',
  SessionTokenNBF: 'session-token-nbf',
  SessionTokenIatInTheFuture: 'session-token-iat-in-the-future',
  ActiveOrganizationMismatch: 'active-organization-mismatch',
  UnexpectedError: 'unexpected-error',
} as const;

export type AuthErrorReason = (typeof AuthErrorReason)[keyof typeof AuthErrorReason];

export type AuthReason = AuthErrorReason | TokenVerificationErrorReason;

export type SignedInAuthObject = {
  sessionClaims: DecodedIdToken;
  userId: string;
  token: string;
  require: CheckAuthorizationFromSessionClaims;
  error: string | null;
};

export type SignedOutAuthObject = {
  sessionClaims: null;
  userId: null;
  token: null;
  require: CheckAuthorizationFromSessionClaims;
  error: string | null;
};

export type SignedInState = {
  status: typeof AuthStatus.SignedIn;
  reason: null;
  signInUrl: string;
  signUpUrl: string;
  isSignedIn: true;
  auth: () => SignedInAuthObject;
  token: string;
  headers: Headers;
};

export type SignedOutState = {
  status: typeof AuthStatus.SignedOut;
  reason: string;
  isSignedIn: false;
  signInUrl: string;
  signUpUrl: string;
  auth: () => SignedOutAuthObject;
  token: null;
  headers: Headers;
};

export type RequestState = SignedInState | SignedOutState;

export interface BackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}

export type AuthObject = SignedInAuthObject | SignedOutAuthObject;

function createHasAuthorization(
  decodedIdToken: DecodedIdToken,
): CheckAuthorizationFromSessionClaims {
  return (authorizationParams: any) => {
    if (
      !authorizationParams ||
      typeof authorizationParams !== 'object' ||
      Array.isArray(authorizationParams)
    ) {
      return false;
    }
    const claims = decodedIdToken as Record<string, any>;

    return Object.entries(authorizationParams).every(([key, value]) => {
      const claimValue = claims[key];
      if (typeof claimValue === 'undefined') {
        return false;
      }
      if (Array.isArray(value)) {
        if (Array.isArray(claimValue)) {
          return value.some(v => claimValue.includes(v));
        }
        return value.includes(claimValue);
      }

      if (Array.isArray(claimValue)) {
        return claimValue.includes(value);
      }
      return claimValue === value;
    });
  };
}

export function signedInAuthObject(
  sessionToken: string,
  sessionClaims: JWTPayload,
): SignedInAuthObject {
  const decodedIdToken = mapJwtPayloadToDecodedIdToken(sessionClaims);
  return {
    sessionClaims: {
      ...decodedIdToken,
    },
    userId: decodedIdToken.uid,
    token: sessionToken,
    require: createHasAuthorization(decodedIdToken),
    error: null,
  };
}

export function signedOutAuthObject(): SignedOutAuthObject {
  return {
    sessionClaims: null,
    userId: null,
    token: null,
    require: () => false,
    error: 'No active session',
  };
}

export function signedIn(
  authCtx: RequestProcessorContext,
  sessionClaims: JWTPayload,
  headers: Headers = new Headers(),
  token: string,
): SignedInState {
  const authObject = signedInAuthObject(token, sessionClaims);
  return {
    status: AuthStatus.SignedIn,
    reason: null,
    signInUrl: authCtx.signInUrl || '',
    signUpUrl: authCtx.signUpUrl || '',
    isSignedIn: true,
    auth: () => authObject,
    token,
    headers,
  };
}

export function signedOut(
  authCtx: RequestProcessorContext,
  reason: AuthReason,
  message = '',
  headers: Headers = new Headers(),
): SignedOutState {
  return decorateHeaders({
    status: AuthStatus.SignedOut,
    reason,
    message,
    signInUrl: authCtx.signInUrl || '',
    signUpUrl: authCtx.signUpUrl || '',
    isSignedIn: false,
    auth: () => signedOutAuthObject(),
    token: null,
    headers,
  });
}

const decorateHeaders = <T extends RequestState>(requestState: T): T => {
  const headers = new Headers(requestState.headers || {});
  if (requestState.reason) {
    try {
      headers.set(constants.Headers.AuthReason, requestState.reason);
    } catch {
      // Ignore errors
    }
  }

  if (requestState.status) {
    try {
      headers.set(constants.Headers.AuthStatus, requestState.status);
    } catch {
      // Ignore errors
    }
  }
  requestState.headers = headers;
  return requestState;
};

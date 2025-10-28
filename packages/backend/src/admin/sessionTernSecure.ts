'use server';
import { handleFirebaseAuthError } from '@tern-secure/shared/errors';
import type {
  CookieStore,
  SessionParams,
  SessionResult,
  TernSecureHandlerOptions,
} from '@tern-secure/types';

import { constants } from '../constants';
import { getAuthForTenant } from '../utils/admin-init';


/**
 * Generates cookie name with optional prefix
 */

const DEFAULT_COOKIE_CONFIG = {
  DEFAULT_EXPIRES_IN_MS: 5 * 60 * 1000, // 5 minutes
  DEFAULT_EXPIRES_IN_SECONDS: 5 * 60,
  REVOKE_REFRESH_TOKENS_ON_SIGNOUT: true,
} as const;

const DEFAULT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
} as const;

/**
 * Generates cookie name with optional prefix
 */
const getCookieName = (baseName: string, prefix?: string): string => {
  return prefix ? `${prefix}${baseName}` : baseName;
};

/**
 * Creates standard cookie options with optional overrides
 */
const createCookieOptions = (
  maxAge: number,
  overrides?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
  },
) => {
  return {
    maxAge,
    httpOnly: overrides?.httpOnly ?? DEFAULT_COOKIE_OPTIONS.httpOnly,
    secure: overrides?.secure ?? DEFAULT_COOKIE_OPTIONS.secure,
    sameSite: overrides?.sameSite ?? DEFAULT_COOKIE_OPTIONS.sameSite,
    path: overrides?.path ?? DEFAULT_COOKIE_OPTIONS.path,
  };
};

/**
 * Determines the appropriate cookie prefix based on environment and options
 */
const getCookiePrefix = (): string => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? '__HOST-' : '__dev_';
};

/**
 * Creates cookies for user session management
 * @param params - Session parameters containing idToken and optional refreshToken
 * @param cookieStore - Cookie store interface for managing cookies
 * @param options - TernSecure handler options containing cookie configurations
 */
export async function createSessionCookie(
  params: SessionParams | string,
  cookieStore: CookieStore,
  options?: TernSecureHandlerOptions,
): Promise<SessionResult> {
  try {
    const tenantAuth = getAuthForTenant(options?.tenantId || '');

    const idToken = typeof params === 'string' ? params : params.idToken;
    const refreshToken = typeof params === 'string' ? undefined : (params as any).refreshToken;

    if (!idToken) {
      return {
        success: false,
        message: 'ID token is required',
        error: 'INVALID_TOKEN',
      };
    }

    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await tenantAuth.verifyIdToken(idToken);
    } catch (verifyError) {
      const authError = handleFirebaseAuthError(verifyError);
      return {
        success: false,
        message: authError.message,
        error: authError.code,
      };
    }

    const cookiePromises: Promise<void>[] = [];
    const cookiePrefix = getCookiePrefix();

    // Always set idToken cookie by default
    const idTokenCookieName = getCookieName(constants.Cookies.IdToken, cookiePrefix);
    cookiePromises.push(
      cookieStore.set(
        idTokenCookieName,
        idToken,
        createCookieOptions(DEFAULT_COOKIE_CONFIG.DEFAULT_EXPIRES_IN_SECONDS),
      ),
    );

    // Always set refreshToken cookie by default if provided
    if (refreshToken) {
      const refreshTokenCookieName = getCookieName(constants.Cookies.Refresh, cookiePrefix);
      cookiePromises.push(
        cookieStore.set(
          refreshTokenCookieName,
          refreshToken,
          createCookieOptions(DEFAULT_COOKIE_CONFIG.DEFAULT_EXPIRES_IN_SECONDS),
        ),
      );
    }

    // Create and set session cookie only if session config is provided
    if (options?.cookies?.session) {
      const sessionOptions = options.cookies.session;
      const sessionCookieName = getCookieName(constants.Cookies.Session);
      const expiresIn = sessionOptions.maxAge
        ? sessionOptions.maxAge * 1000
        : DEFAULT_COOKIE_CONFIG.DEFAULT_EXPIRES_IN_MS;

      try {
        const sessionCookie = await tenantAuth.createSessionCookie(idToken, { expiresIn });
        cookiePromises.push(
          cookieStore.set(
            sessionCookieName,
            sessionCookie,
            createCookieOptions(
              sessionOptions.maxAge || DEFAULT_COOKIE_CONFIG.DEFAULT_EXPIRES_IN_SECONDS,
              {
                httpOnly: sessionOptions.httpOnly,
                sameSite: sessionOptions.sameSite,
                path: sessionOptions.path,
              },
            ),
          ),
        );
      } catch (sessionError) {
        console.error(
          '[createSessionCookie] Firebase session cookie creation failed:',
          sessionError,
        );
        const authError = handleFirebaseAuthError(sessionError);
        return {
          success: false,
          message: authError.message,
          error: authError.code,
        };
      }
    }

    // Create and set custom token cookie only if enableCustomToken is true
    if (options?.enableCustomToken && decodedToken?.uid) {
      const customTokenCookieName = getCookieName(constants.Cookies.Custom, cookiePrefix);
      const customToken = await createCustomToken(decodedToken.uid, options);
      if (customToken) {
        cookiePromises.push(
          cookieStore.set(
            customTokenCookieName,
            customToken,
            createCookieOptions(DEFAULT_COOKIE_CONFIG.DEFAULT_EXPIRES_IN_SECONDS),
          ),
        );
      }
    }

    await Promise.all(cookiePromises);

    return {
      success: true,
      message: 'Session created successfully',
      expiresIn: DEFAULT_COOKIE_CONFIG.DEFAULT_EXPIRES_IN_SECONDS,
    };
  } catch (error) {
    console.error('[createSessionCookie] Unexpected error:', error);
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || 'Failed to create session',
      error: authError.code || 'INTERNAL_ERROR',
    };
  }
}

/**
 * Clears user session cookies
 * @param cookieStore - Cookie store interface for managing cookies
 * @param options - TernSecure handler options containing cookie configurations
 */
export async function clearSessionCookie(
  cookieStore: CookieStore,
  options?: TernSecureHandlerOptions,
): Promise<SessionResult> {
  try {
    const adminAuth = getAuthForTenant(options?.tenantId || '');
    const cookiePrefix = getCookiePrefix();

    // Get the session cookie name for revocation purposes
    const sessionCookieName = getCookieName(constants.Cookies.Session, cookiePrefix);
    const sessionCookie = await cookieStore.get(sessionCookieName);

    const deletionPromises: Promise<void>[] = [];

    // Delete all cookie types
    // Session cookie (only if it was configured)
    if (options?.cookies?.session) {
      deletionPromises.push(cookieStore.delete(sessionCookieName));
    }

    // Always delete default cookies
    const idTokenCookieName = getCookieName(constants.Cookies.IdToken, cookiePrefix);
    deletionPromises.push(cookieStore.delete(idTokenCookieName));

    const refreshTokenCookieName = getCookieName(constants.Cookies.Refresh, cookiePrefix);
    deletionPromises.push(cookieStore.delete(refreshTokenCookieName));

    const customTokenCookieName = getCookieName(constants.Cookies.Custom, cookiePrefix);
    deletionPromises.push(cookieStore.delete(customTokenCookieName));

    // Also delete legacy cookie names for backward compatibility
    deletionPromises.push(cookieStore.delete(constants.Cookies.Session));

    await Promise.all(deletionPromises);

    // Revoke refresh tokens if session cookie exists and revocation is enabled
    if (DEFAULT_COOKIE_CONFIG.REVOKE_REFRESH_TOKENS_ON_SIGNOUT && sessionCookie?.value) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value);
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      } catch (revokeError) {
        console.error('[clearSessionCookie] Failed to revoke refresh tokens:', revokeError);
      }
    }

    return {
      success: true,
      message: 'Session cleared successfully',
    };
  } catch (error) {
    const authError = handleFirebaseAuthError(error);
    return {
      success: false,
      message: authError.message || 'Failed to clear session',
      error: authError.code || 'INTERNAL_ERROR',
    };
  }
}

/**
 * Creates a custom token for a user
 * @param uid - User ID to create the custom token for
 * @param options - TernSecure handler options
 * @returns Promise resolving to the custom token string or null if creation fails
 */
export async function createCustomToken(
  uid: string,
  options?: TernSecureHandlerOptions,
): Promise<string | null> {
  const adminAuth = getAuthForTenant(options?.tenantId || '');
  try {
    const customToken = await adminAuth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('[createCustomToken] Error creating custom token:', error);
    return null;
  }
}


export async function createCustomTokenClaims(
  uid: string,
  developerClaims?: { [key: string]: unknown },
): Promise<string> {
  const adminAuth = getAuthForTenant();
  try {
    const customToken = await adminAuth.createCustomToken(uid, developerClaims);
    return customToken;
  } catch (error) {
    console.error('[createCustomToken] Error creating custom token:', error);
    return '';
  }
}

import type { CookieOptions, TernSecureHandlerOptions } from '@tern-secure/types';

import { DEFAULT_COOKIE_OPTIONS } from './types';

/**
 * Creates complete cookie options by merging config with defaults
 * Used for both setting and deleting cookies to ensure consistency
 */
export function getCookieOptions(
  config?: TernSecureHandlerOptions,
): Required<Pick<CookieOptions, 'path' | 'httpOnly' | 'secure' | 'sameSite'>> &
  Pick<CookieOptions, 'maxAge' | 'priority'> {
  return {
    path: config?.cookies?.path ?? DEFAULT_COOKIE_OPTIONS.path ?? '/',
    httpOnly: config?.cookies?.httpOnly ?? DEFAULT_COOKIE_OPTIONS.httpOnly ?? true,
    secure:
      config?.cookies?.secure ?? DEFAULT_COOKIE_OPTIONS.secure ?? process.env.NODE_ENV === 'production',
    sameSite: config?.cookies?.sameSite ?? DEFAULT_COOKIE_OPTIONS.sameSite ?? 'strict',
    maxAge: config?.cookies?.maxAge ?? DEFAULT_COOKIE_OPTIONS.maxAge,
    priority: config?.cookies?.priority ?? DEFAULT_COOKIE_OPTIONS.priority,
  };
}

/**
 * Extracts options needed for cookie deletion
 * For __HOST- prefixed cookies, all security attributes must match
 * @param options - Object containing cookies config and revokeRefreshTokensOnSignOut flag
 */
export function getDeleteOptions(options?: {
  cookies?: TernSecureHandlerOptions['cookies'];
  revokeRefreshTokensOnSignOut?: boolean;
}): {
  path: string;
  httpOnly?: boolean;
  secure?: boolean;
  domain?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  revokeRefreshTokensOnSignOut?: boolean;
} {
  return {
    path: options?.cookies?.path ?? DEFAULT_COOKIE_OPTIONS.path ?? '/',
    httpOnly: options?.cookies?.httpOnly ?? DEFAULT_COOKIE_OPTIONS.httpOnly ?? true,
    secure:
      options?.cookies?.secure ?? DEFAULT_COOKIE_OPTIONS.secure ?? process.env.NODE_ENV === 'production',
    sameSite: options?.cookies?.sameSite ?? DEFAULT_COOKIE_OPTIONS.sameSite ?? 'strict',
    revokeRefreshTokensOnSignOut: options?.revokeRefreshTokensOnSignOut ?? true,
    // Domain is intentionally omitted to use current domain
  };
}

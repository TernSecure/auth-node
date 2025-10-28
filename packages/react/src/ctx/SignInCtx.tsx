'use client';

import type {
  AuthErrorTree,
  SignInFallbackRedirectUrl,
  SignInForceRedirectUrl,
  SignInProps,
  TernSecureUser,
} from '@tern-secure/auth';
import { buildURL, RedirectUrls } from '@tern-secure/auth';
import { useTernSecure } from '@tern-secure/shared/react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';

export type SignInCtx = SignInProps & SignInForceRedirectUrl & SignInFallbackRedirectUrl;

export type SignInContextType = Omit<SignInCtx, 'fallbackRedirectUrl' | 'forceRedirectUrl'> & {
  onSignInSuccess: (
    user: TernSecureUser,
    options?: { onPreRedirect?: () => Promise<boolean> },
  ) => void;
  handleSignInError: (error: AuthErrorTree) => void;
  redirectAfterSignIn: () => any;
  signInUrl: string;
  signUpUrl: string;
  afterSignUpUrl: string;
  afterSignInUrl: string;
  checkRedirectResult: () => Promise<void>;
};

export const SignInContext = createContext<SignInCtx | null>(null);

export const useSignInContext = (): SignInContextType => {
  const context = useContext(SignInContext);
  const ternSecure = useTernSecure();
  const ternSecureOptions = ternSecure._internal_getAllOptions();
  const currentParams = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);

  if (context === null) {
    throw new Error(
      'useSignInContext must be used within a SignInProvider. Please wrap your component tree with SignInProvider.',
    );
  }

  const { ...ctx } = context;

  const createAuthError = useCallback(
    (message: string, code: string, name: string = 'AuthError', response?: any): AuthErrorTree => {
      const authError = new Error(message) as AuthErrorTree;
      authError.name = name;
      authError.code = code;
      authError.response = response;
      return authError;
    },
    [],
  );

  const handleSignInError = useCallback((authError: AuthErrorTree) => {
    console.error(authError);
  }, []);

  const redirectUrls = new RedirectUrls(
    ternSecureOptions,
    {
      ...ctx,
      signInForceRedirectUrl: ctx.signInForceRedirectUrl || ctx.forceRedirectUrl,
      signInFallbackRedirectUrl: ctx.signInFallbackRedirectUrl || ctx.fallbackRedirectUrl,
    },
    currentParams,
  );

  const afterSignInUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignInUrl());
  const afterSignUpUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignUpUrl());

  const redirectAfterSignIn = () => ternSecure.navigate(afterSignInUrl);

  const preservedParams = redirectUrls.getPreservedSearchParams();
  const baseSignInUrl = ctx.path || ternSecureOptions.signInUrl;
  const baseSignUpUrl = ternSecureOptions.signUpUrl;

  const signInUrl = buildURL(
    {
      base: baseSignInUrl,
      hashSearchParams: [currentParams, preservedParams],
    },
    { stringify: true },
  );

  const signUpUrl = buildURL(
    {
      base: baseSignUpUrl,
      hashSearchParams: [currentParams, preservedParams],
    },
    { stringify: true },
  );

  /**
   *
   * This function separates session creation from redirection, allowing consumers
   * to perform custom logic between authentication and redirect.
   *
   * Use cases:
   * 1. Check if user exists in external database (e.g., FreeSWITCH VoIP user table)
   * 2. Validate user permissions or roles
   * 3. Perform additional setup or initialization
   * 4. Custom redirect logic based on user data
   * Example:
   *   await onSignInSuccess(user, {
   *     onPreRedirect: async () => {
   *       // user is accessible here via closure
   *       const exists = await checkUser(user.email);
   *       return exists;
   *     }
   *   });
   *
   * @param user - The authenticated TernSecureUser
   * @param options - Configuration options
   * @param options.onPreRedirect - Optional async callback executed before redirect.
   *                                Return false to prevent redirection, true to proceed.
   *                                This is where you can perform DB checks, role validation, etc.
   *                                The user object is accessible via closure.
   *                                If not provided, automatically redirects after session creation.
   */
  const onSignInSuccess = useCallback(
    async (
      user: TernSecureUser,
      options?: {
        onPreRedirect?: () => Promise<boolean>;
      },
    ) => {
      try {
        await ternSecure.createActiveSession({ session: user });

        if (options?.onPreRedirect) {
          try {
            const shouldRedirect = await options.onPreRedirect();

            if (shouldRedirect) {
              redirectAfterSignIn();
            }
            // If shouldRedirect is false, consumer handles redirect manually
          } catch (error) {
            const authError = createAuthError(
              'Pre-redirect validation failed',
              'PRE_REDIRECT_FAILED',
              'PreRedirectError',
              error,
            );
            handleSignInError(authError);
          }
        } else {
          redirectAfterSignIn();
        }
      } catch (error) {
        const authError = createAuthError(
          error instanceof Error ? error.message : 'Failed to create session',
          'SESSION_CREATION_FAILED',
          'SessionError',
          error,
        );
        handleSignInError(authError);
      }
    },
    [ternSecure, createAuthError, handleSignInError, redirectAfterSignIn],
  );

  const checkRedirectResult = useCallback(async (): Promise<void> => {
    try {
      const result = await ternSecure.getRedirectResult();
      if (result && result.success) {
        await onSignInSuccess(result.user);
      } else if (result && !result.success) {
        const authError = createAuthError(
          result.message || 'Redirect sign-in failed',
          result.error || 'REDIRECT_FAILED',
          'RedirectError',
          result,
        );
        handleSignInError(authError);
      }
    } catch (error) {
      const authError = createAuthError(
        error instanceof Error ? error.message : 'Failed to check redirect result',
        'REDIRECT_CHECK_FAILED',
        'RedirectError',
        error,
      );
      handleSignInError(authError);
    }
  }, [ternSecure, onSignInSuccess, handleSignInError, createAuthError]);

  return {
    ...(ctx as SignInCtx),
    afterSignInUrl,
    afterSignUpUrl,
    signInUrl,
    signUpUrl,
    checkRedirectResult,
    onSignInSuccess,
    handleSignInError,
    redirectAfterSignIn,
  };
};

interface SignInProviderProps extends Partial<SignInCtx> {
  children: ReactNode;
}

export function SignInProvider({ children, ...ctxProps }: SignInProviderProps) {
  const contextValue = ctxProps as SignInCtx;
  return <SignInContext.Provider value={contextValue}>{children}</SignInContext.Provider>;
}

export { useTernSecure };

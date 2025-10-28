'use client';

import type {
  AuthErrorTree,
  SignUpFallbackRedirectUrl,
  SignUpForceRedirectUrl,
  SignUpProps,
} from '@tern-secure/auth';
import { buildURL, RedirectUrls } from '@tern-secure/auth';
import { useTernSecure } from '@tern-secure/shared/react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';

export type SignUpCtx = SignUpProps & SignUpForceRedirectUrl & SignUpFallbackRedirectUrl;

export type SignUpContextType = Omit<SignUpCtx, 'fallbackRedirectUrl' | 'forceRedirectUrl'> & {
  handleSignUpError: (error: AuthErrorTree) => void;
  redirectAfterSignUp: () => any;
  signInUrl: string;
  signUpUrl: string;
  afterSignUpUrl: string;
  afterSignInUrl: string;
};

export const SignInContext = createContext<SignUpCtx | null>(null);

export const useSignUpContext = (): SignUpContextType => {
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
      'useSignUpContext must be used within a SignUpProvider. Please wrap your component tree with SignUpProvider.',
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

  const handleSignUpError = useCallback((authError: AuthErrorTree) => {
    console.error(authError);
  }, []);

  const redirectUrls = new RedirectUrls(
    ternSecureOptions,
    {
      ...ctx,
      signUpForceRedirectUrl: ctx.signUpForceRedirectUrl || ctx.forceRedirectUrl,
      signUpFallbackRedirectUrl: ctx.signUpFallbackRedirectUrl || ctx.fallbackRedirectUrl,
    },
    currentParams,
  );

  const afterSignUpUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignUpUrl());
  const afterSignInUrl = ternSecure.constructUrlWithAuthRedirect(redirectUrls.getAfterSignInUrl());

  const redirectAfterSignUp = () => ternSecure.navigate(afterSignUpUrl);

  const preservedParams = redirectUrls.getPreservedSearchParams();
  const baseSignUpUrl = ternSecureOptions.signUpUrl;
  const baseSignInUrl = ternSecureOptions.signInUrl;

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

  return {
    ...ctx,
    afterSignInUrl,
    afterSignUpUrl,
    signInUrl,
    signUpUrl,
    handleSignUpError,
    redirectAfterSignUp,
  };
};

interface SignUpProviderProps extends Partial<SignUpCtx> {
  children: ReactNode;
}

export function SignUpProvider({ children, ...ctxProps }: SignUpProviderProps) {
  const contextValue = ctxProps as SignUpCtx;
  return <SignInContext.Provider value={contextValue}>{children}</SignInContext.Provider>;
}

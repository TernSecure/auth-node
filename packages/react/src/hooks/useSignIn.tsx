'use client';

import type {
  ResendEmailVerification,
  SignInFormValues,
  SignInResponse,
  SocialProviderOptions,
  UseSignInReturn,
} from '@tern-secure/types';

import { useAuthSignInCtx } from '../ctx/TernSecureAuthResourcesCtx';
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider';

/**
 * Hook to access the SignInResource methods from TernSecureAuth
 * Provides type-safe access to all sign-in related functionality
 */
export const useSignIn = (): UseSignInReturn => {
  useAssertWrappedByTernSecureAuthProvider('useSignIn');
  const auth = useAuthSignInCtx();

  if (!auth) {
    return {
      isLoaded: false,
      signIn: undefined,
    };
  }

  return {
    isLoaded: true,
    signIn: auth,
  };
};

export const signIn = {
  withEmailAndPassword: async (params: SignInFormValues): Promise<SignInResponse> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.withEmailAndPassword(params);
  },

  withSocialProvider: async (
    provider: string,
    customOptions: SocialProviderOptions,
  ): Promise<SignInResponse | void> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.withSocialProvider(provider, customOptions);
  },

  resendEmailVerification: async (): Promise<ResendEmailVerification> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.resendEmailVerification();
  },

  checkRedirectResult: async (): Promise<SignInResponse | null> => {
    const auth = useAuthSignInCtx();
    if (!auth) {
      throw new Error('SignIn methods not available - auth not initialized');
    }
    return auth.checkRedirectResult();
  },
};

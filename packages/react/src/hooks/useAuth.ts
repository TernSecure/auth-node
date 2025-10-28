'use client';

import type {
  SignOut,
  SignOutOptions,
  TernSecureUser,
  UseAuthReturn,
} from '@tern-secure/types';
import { useCallback } from 'react';

import { useAuthProviderCtx } from '../ctx/AuthProvider';
import { useIsoTernSecureAuthCtx } from '../ctx/IsomorphicTernSecureCtx';
import type { IsoTernSecureAuth } from '../lib/isoTernSecureAuth';
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider';


const handleSignOut = (instance: IsoTernSecureAuth) => {
  return async (options?: SignOutOptions) => {
    try {
      if (options?.onBeforeSignOut) {
        await options.onBeforeSignOut();
      }

      await instance.signOut(options);

      if (options?.onAfterSignOut) {
        await options.onAfterSignOut();
      }
    } catch (error) {
      console.error('[useAuth] Sign out failed:', error);
      throw error;
    }
  };
};

export const useAuth = (): UseAuthReturn => {
  useAssertWrappedByTernSecureAuthProvider('useAuth');

  const ctx = useAuthProviderCtx();
  let authCtx = ctx;

  if (authCtx.user === undefined) {
    authCtx = { ...authCtx, user: null };
  }

  const instance = useIsoTernSecureAuthCtx();
  const signOut: SignOut = useCallback(handleSignOut(instance), [instance]);

  return useDeriveAuth({ ...authCtx, signOut });
};

export function useDeriveAuth(authObject: any): UseAuthReturn {
  const { signOut } = authObject ?? {};
  const payload = resolvedAuthState({ authObject: { ...authObject, signOut } });

  if (!payload) {
    throw new Error('[useDeriveAuth] Unable to derive auth state.');
  }
  return payload;
}

const deriveAuthStatus = (
  isLoaded: boolean,
  isAuthenticated: boolean,
  isVerified: boolean,
): UseAuthReturn['status'] => {
  if (!isLoaded) return 'loading';
  if (!isAuthenticated) return 'unauthenticated';
  if (!isVerified) return 'unverified';
  return 'authenticated';
};

type AuthStateOptions = {
  authObject: {
    userId?: string | null;
    user?: TernSecureUser | null;
    signOut: SignOut;
  };
};

const resolvedAuthState = ({
  authObject: { userId, user, signOut },
}: AuthStateOptions): UseAuthReturn | undefined => {
  if (!user) {
    return {
      isLoaded: false,
      isVerified: false,
      isAuthenticated: false,
      isValid: false,
      user: null,
      userId: null,
      sessionClaims: null,
      status: 'loading',
      signOut,
    } as const;
  }

  if (user && userId) {
    const isLoaded = true;
    const isValid = true;
    const isVerified = user.emailVerified || false;
    const isAuthenticated = isValid && isVerified;
    const status = deriveAuthStatus(isLoaded, isAuthenticated, isVerified);
    return {
      isLoaded,
      isValid,
      user,
      userId,
      isAuthenticated,
      isVerified,
      status,
      signOut,
    } as const;
  }
};

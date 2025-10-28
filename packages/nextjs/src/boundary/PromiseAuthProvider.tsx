'use client';

import type { TernSecureStateExtended } from '@tern-secure/types';
import { useAuth, useDeriveAuth } from '@tern-secure-node/react';
import { useRouter } from 'next/compat/router';
import React from 'react';

const PromiseAuthContext = React.createContext<
  Promise<TernSecureStateExtended> | TernSecureStateExtended | null
>(null);

export function PromiseAuthProvider({
  authPromise,
  children,
}: {
  authPromise: Promise<TernSecureStateExtended> | TernSecureStateExtended;
  children: React.ReactNode;
}) {
  return <PromiseAuthContext.Provider value={authPromise}>{children}</PromiseAuthContext.Provider>;
}

export function usePromiseAuth() {
  const isPagesRouter = useRouter();
  const valueFromContext = React.useContext(PromiseAuthContext);

  let resolvedData = valueFromContext;
  if (valueFromContext && 'then' in valueFromContext) {
    resolvedData = React.use(valueFromContext);
  }

  if (typeof window === 'undefined') {
    // Pages router should always use useAuth as it is able to grab initial auth state from context during SSR.
    if (isPagesRouter) {
      return useAuth();
    }

    return useDeriveAuth({ ...resolvedData });
  } else {
    return useAuth();
  }
}

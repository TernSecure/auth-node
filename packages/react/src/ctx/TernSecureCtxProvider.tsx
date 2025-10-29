'use client';

import type { DecodedIdToken,TernSecureResources, TernSecureUser} from '@tern-secure/types';
import React, { useEffect, useMemo, useState } from 'react';

import { IsoTernSecureAuth } from '../lib/isoTernSecureAuth';
import { deriveAuthState } from '../shared/derivedAuthState';
import type { IsoTernSecureAuthOptions } from '../types';
import { AuthProviderCtx } from './AuthProvider';
import { IsoTernSecureAuthCtx } from './IsomorphicTernSecureCtx';

type TernSecureInitialState = {
  userId: string | null;
  user?: TernSecureUser | null;
  token?: string | null;
  sessionClaims?: DecodedIdToken | null;
};

type TernSecureCtxProviderProps = {
  children: React.ReactNode;
  instanceOptions: IsoTernSecureAuthOptions;
  initialState: TernSecureInitialState | undefined;
};

export type TernSecureCtxProviderState = TernSecureResources;

export function TernSecureCtxProvider(props: TernSecureCtxProviderProps) {
  const { children, initialState, instanceOptions } = props;

  const { isoTernSecureAuth: instance, instanceStatus } = useInitTernSecureAuth(instanceOptions);

  const [authState, setAuthState] = useState<TernSecureCtxProviderState>({
    user: instance.user,
    session: instance.currentSession,
  });

  React.useEffect(() => {
    return instance.addListener(e => setAuthState({ ...e }));
  }, []);

  const derivedState = deriveAuthState(instance.isReady, authState, initialState);
  const { user, userId } = derivedState;

  const authCtx = useMemo(() => {
    const value = {
      userId: userId,
      user: user,
    };
    return { value };
  }, [userId, user]);

  const ternAuthCtx = useMemo(
    () => ({
      value: instance,
      instanceStatus,
    }),
    [instance, instanceStatus],
  );

  return (
    <IsoTernSecureAuthCtx.Provider value={ternAuthCtx}>
      <AuthProviderCtx.Provider value={authCtx}>{children}</AuthProviderCtx.Provider>
    </IsoTernSecureAuthCtx.Provider>
  );
}

const useInitTernSecureAuth = (options: IsoTernSecureAuthOptions) => {
  const isoTernSecureAuth = useMemo(() => {
    return IsoTernSecureAuth.getOrCreateInstance(options);
  }, []);

  const [instanceStatus, setInstanceStatus] = useState(isoTernSecureAuth.status);

  useEffect(() => {
    void isoTernSecureAuth.on('status', setInstanceStatus);
    return () => isoTernSecureAuth.off('status', setInstanceStatus);
  }, [isoTernSecureAuth]);

  useEffect(() => {
    void isoTernSecureAuth.initialize();
  }, [isoTernSecureAuth]);

  useEffect(() => {
    return () => {
      IsoTernSecureAuth.clearInstance();
    };
  }, []);

  return {
    isoTernSecureAuth,
    instanceStatus,
  };
};

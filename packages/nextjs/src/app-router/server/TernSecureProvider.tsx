import type { TernSecureStateExtended } from '@tern-secure/types';
import type { ReactNode } from 'react';
import React from 'react';

import { PromiseAuthProvider } from '../../boundary/PromiseAuthProvider';
import { getTernSecureAuthData } from '../../server/data/getAuthDataFromRequest';
import { isNext13 } from '../../server/sdk-versions';
import type { TernSecureNextProps } from '../../types';
import { allNextProviderPropsWithEnv } from '../../utils/allNextProviderProps';
import { ClientTernSecureProvider } from '../client/TernSecureProvider';
import { buildRequestLike } from './utils';

const getTernSecureState = React.cache(async function getTernSecureState() {
  const request = await buildRequestLike();
  const data = getTernSecureAuthData(request);
  return data;
});

export async function TernSecureProvider(props: TernSecureNextProps) {
  const { children, ...rest } = props;
  const { persistence } = rest;

  const browserCookiePersistence = persistence === 'browserCookie';

  async function generateStatePromise() {
    if (!browserCookiePersistence) {
      return Promise.resolve(undefined);
    }
    if (isNext13) {
      return Promise.resolve(await getTernSecureState());
    }
    return getTernSecureState();
  }

  const providerProps = allNextProviderPropsWithEnv({ ...rest });

  let output: ReactNode;

  if (browserCookiePersistence) {
    output = (
      <PromiseAuthProvider
        authPromise={generateStatePromise() as unknown as Promise<TernSecureStateExtended>}
      >
        <ClientTernSecureProvider
          {...providerProps}
          initialState={await generateStatePromise()}
        >
          {children}
        </ClientTernSecureProvider>
      </PromiseAuthProvider>
    );
  } else {
    output = (
      <ClientTernSecureProvider
        {...providerProps}
      >
        {children}
      </ClientTernSecureProvider>
    );
  }

  return output;
}

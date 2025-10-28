import React from 'react';

import type { TernSecureProviderProps } from '../types';
import { TernSecureCtxProvider } from './TernSecureCtxProvider';

function TernSecureProviderBase(props: TernSecureProviderProps) {
  const { children, initialState, bypassApiKey, ...restProps } = props;

  return (
    <TernSecureCtxProvider
      initialState={initialState}
      instanceOptions={restProps}
    >
      {children}
    </TernSecureCtxProvider>
  );
}

// Memoize the provider to prevent unnecessary re-renders
const TernSecureProvider = React.memo(TernSecureProviderBase);

TernSecureProvider.displayName = 'TernSecureProvider';

export { TernSecureProvider };

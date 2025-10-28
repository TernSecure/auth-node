'use client';

import { TernSecureProvider as TernSecureReactProvider } from '@tern-secure-node/react';

import { TernNextOptionsProvider, useTernNextOptions } from '../../boundary/NextOptionsCtx';
import type { TernSecureNextProps } from '../../types';
import { allNextProviderPropsWithEnv } from '../../utils/allNextProviderProps';
import { useAwaitablePush } from './useAwaitablePush';
import { useAwaitableReplace } from './useAwaitableReplace';

const NextClientProvider = (props: TernSecureNextProps) => {
  const { children } = props;

  const push = useAwaitablePush();
  const replace = useAwaitableReplace();

  const isNested = Boolean(useTernNextOptions());
  if (isNested) {
    return props.children;
  }

  const providerProps = allNextProviderPropsWithEnv({
    ...props,
    // @ts-expect-error Error because of the stricter types of internal `push`
    routerPush: push,
    // @ts-expect-error Error because of the stricter types of internal `replace`
    routerReplace: replace,
  });
  return (
    <TernNextOptionsProvider options={providerProps}>
      <TernSecureReactProvider {...providerProps}>{children}</TernSecureReactProvider>
    </TernNextOptionsProvider>
  );
};

export const ClientTernSecureProvider = (props: TernSecureNextProps) => {
  const { children, ...rest } = props;
  return <NextClientProvider {...rest}>{children}</NextClientProvider>;
};

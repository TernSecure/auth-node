import React from 'react';

import type { TernSecureNextProps } from '../types';

type TernNextContextValue = Partial<Omit<TernSecureNextProps, 'children'>>;

const TernNextOptionsCtx = React.createContext<{ value: TernNextContextValue } | undefined>(undefined);
TernNextOptionsCtx.displayName = 'TernNextOptionsCtx';

const useTernNextOptions = () => {
  const ctx = React.useContext(TernNextOptionsCtx) as { value: TernNextContextValue };
  return ctx?.value;
};

const TernNextOptionsProvider = (
  props: React.PropsWithChildren<{ options: TernNextContextValue }>,
): React.JSX.Element => {
  const { children, options } = props;
  return <TernNextOptionsCtx.Provider value={{ value: options }}>{children}</TernNextOptionsCtx.Provider>;
};

export { TernNextOptionsProvider, useTernNextOptions };

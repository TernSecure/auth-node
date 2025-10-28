type RequireMetadata<T extends (to: any, metadata?: any) => any> = T extends (
  to: infer To,
  metadata?: infer Metadata,
) => infer R
  ? (to: To, metadata: Metadata) => R
  : never;

type NavigationFunction =
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  | RequireMetadata<NonNullable<import('./types').TernSecureNextProps['routerPush']>>
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  | RequireMetadata<NonNullable<import('./types').TernSecureNextProps['routerReplace']>>;

interface Window {
  __tern_internal_navigations: Record<
    string,
    {
      fun: NavigationFunction;
      promisesBuffer: Array<() => void> | undefined;
    }
  >;

  next?: {
    version: string;
  };
}

declare const PACKAGE_NAME: string;
declare const PACKAGE_VERSION: string;

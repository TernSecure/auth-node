import type { TernSecureConfig,TernSecureUser } from '@tern-secure/types';
import type { TernSecureProviderProps } from '@tern-secure-node/react';



export type AuthenticateRequestOptions = {
  signInUrl?: string;
  signUpUrl?: string;
  apiKey?: string;
  firebaseConfig?: TernSecureConfig
};


export type TernSecureNextProps = TernSecureProviderProps & {
  apiKey?: string;
  requiresVerification?: boolean;
  loadingComponent?: React.ReactNode;
  /**
   * If set to true, the NextJS middleware will be invoked
   * every time the client-side auth state changes (sign-out, sign-in, etc.).
   * That way, any auth-dependent logic can be placed inside the middleware.
   * Example: Configuring the middleware to force a redirect to `/sign-in` when the user signs out
   *
   * @default true
   */
  __unstable_invokeMiddlewareOnAuthStateChange?: boolean;
};


export type NextProviderProcessedProps = Omit<TernSecureProviderProps, 'children'>;


export type SerializableTernSecureUser = Omit<TernSecureUser, 'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'toJSON'>;

export type Aobj = {
  user: SerializableTernSecureUser | null
  userId: string | null
}

export { TernSecureUser }
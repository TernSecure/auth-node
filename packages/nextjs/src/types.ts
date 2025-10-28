import type { TernSecureProviderProps } from '@tern-secure/react';
import type { TernSecureUser } from '@tern-secure/types';
//import type { User } from 'firebase/auth';


/**
 * TernSecure Firebase configuration interface
 * Extends Firebase's base configuration options
 */
export interface TernSecureConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  appName?: string;
  tenantId?: string;
}

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


/**
 * Enables autocompletion for a union type, while keeping the ability to use any string
 * or type of `T`
 * @internal
 */
export type Autocomplete<U extends T, T = string> = U | (T & Record<never, never>);


export type NextProviderProcessedProps = Omit<TernSecureProviderProps, 'children'>;


export type Aobj = {
  user: TernSecureUser | null
}

export { TernSecureUser }
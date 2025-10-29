import type { ApiClient } from '../fireRestApi';
import type { TernSecureConfig, TernSecureUserData, VerifyTokenVOptions } from './verify';

export type SessionCookieAttributes = {
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

export type SessionCookieFromMiddleware = {
  name: string;
  attributes: SessionCookieAttributes;
  revokeRefreshTokensOnSignOut?: boolean;
};

export type MiddlewareCookiesOptions = {
  session_cookie: SessionCookieFromMiddleware;
};


export type AuthenticateFireRequestOptions = {
  signInUrl?: string;
  signUpUrl?: string;
  apiClient?: ApiClient;
  apiUrl?: string;
  apiVersion?: string;
  firebaseConfig?: TernSecureConfig
} & VerifyTokenVOptions;


export type AuthenticateRequestOptions = {
  tenantId?: string;
  signInUrl?: string;
  signUpUrl?: string;
  apiClient?: ApiClient;
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
  firebaseConfig?: TernSecureConfig
} & VerifyTokenVOptions;

export type { TernSecureUserData };



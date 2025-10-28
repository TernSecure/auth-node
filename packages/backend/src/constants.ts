export const GOOGLE_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
export const SESSION_COOKIE_PUBLIC_KEYS_URL =
  'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

export const MAX_CACHE_LAST_UPDATED_AT_SECONDS = 5 * 60;
export const DEFAULT_CACHE_DURATION = 3600 * 1000; // 1 hour in milliseconds
export const CACHE_CONTROL_REGEX = /max-age=(\d+)/;

const Attributes = {
  AuthToken: '__ternsecureAuthToken',
  AuthSignature: '__ternsecureAuthSignature',
  AuthStatus: '__ternsecureAuthStatus',
  AuthReason: '__ternsecureAuthReason',
  AuthMessage: '__ternsecureAuthMessage',
  TernSecureUrl: '__ternsecureUrl',
} as const;

const Cookies = {
  Session: '__session',
  CsrfToken: '__session_terncf',
  IdToken: 'TernSecure_[DEFAULT]',
  Refresh: 'TernSecureID_[DEFAULT]',
  Custom: '__custom',
  Handshake: '__ternsecure_handshake',
  DevBrowser: '__ternsecure_db_jwt',
  RedirectCount: '__ternsecure_redirect_count',
  HandshakeNonce: '__ternsecure_handshake_nonce',
} as const;

const Headers = {
  Accept: 'accept',
  AuthMessage: 'x-ternsecure-auth-message',
  Authorization: 'authorization',
  AuthReason: 'x-ternsecure-auth-reason',
  AuthSignature: 'x-ternsecure-auth-signature',
  AuthStatus: 'x-ternsecure-auth-status',
  AuthToken: 'x-ternsecure-auth-token',
  CacheControl: 'cache-control',
  TernSecureRedirectTo: 'x-ternsecure-redirect-to',
  TernSecureRequestData: 'x-ternsecure-request-data',
  TernSecureUrl: 'x-ternsecure-url',
  CloudFrontForwardedProto: 'cloudfront-forwarded-proto',
  ContentType: 'content-type',
  ContentSecurityPolicy: 'content-security-policy',
  ContentSecurityPolicyReportOnly: 'content-security-policy-report-only',
  EnableDebug: 'x-ternsecure-debug',
  ForwardedHost: 'x-forwarded-host',
  ForwardedPort: 'x-forwarded-port',
  ForwardedProto: 'x-forwarded-proto',
  Host: 'host',
  Location: 'location',
  Nonce: 'x-nonce',
  Origin: 'origin',
  Referrer: 'referer',
  SecFetchDest: 'sec-fetch-dest',
  UserAgent: 'user-agent',
  ReportingEndpoints: 'reporting-endpoints',
} as const;

const ContentTypes = {
  Json: 'application/json',
} as const;

/**
 * @internal
 */
export const constants = {
  Attributes,
  Cookies,
  Headers,
  ContentTypes,
} as const;

export type Constants = typeof constants;

export const RefreshTokenErrorReason = {
  NonEligibleNoCookie: 'non-eligible-no-refresh-cookie',
  NonEligibleNonGet: 'non-eligible-non-get',
  InvalidSessionToken: 'invalid-session-token',
  MissingApiClient: 'missing-api-client',
  MissingIdToken: 'missing-id-token',
  MissingSessionToken: 'missing-session-token',
  MissingRefreshToken: 'missing-refresh-token',
  ExpiredIdTokenDecodeFailed: 'expired-id-token-decode-failed',
  ExpiredSessionTokenDecodeFailed: 'expired-session-token-decode-failed',
  FetchError: 'fetch-error',
} as const;

export type TokenCarrier = 'header' | 'cookie';

export const TokenVerificationErrorReason = {
  TokenExpired: 'token-expired',
  TokenInvalid: 'token-invalid',
  TokenInvalidAlgorithm: 'token-invalid-algorithm',
  TokenInvalidAuthorizedParties: 'token-invalid-authorized-parties',
  TokenInvalidSignature: 'token-invalid-signature',
  TokenNotActiveYet: 'token-not-active-yet',
  TokenIatInTheFuture: 'token-iat-in-the-future',
  TokenVerificationFailed: 'token-verification-failed',
  InvalidSecretKey: 'secret-key-invalid',
  LocalJWKMissing: 'jwk-local-missing',
  RemoteJWKFailedToLoad: 'jwk-remote-failed-to-load',
  RemoteJWKInvalid: 'jwk-remote-invalid',
  RemoteJWKMissing: 'jwk-remote-missing',
  JWKFailedToResolve: 'jwk-failed-to-resolve',
  JWKKidMismatch: 'jwk-kid-mismatch',
};

export type TokenVerificationErrorReason =
  (typeof TokenVerificationErrorReason)[keyof typeof TokenVerificationErrorReason];

export class TokenVerificationError extends Error {
  reason: TokenVerificationErrorReason;
  tokenCarrier?: TokenCarrier;

  constructor({
    message,
    reason,
  }: {
    message: string;
    reason: TokenVerificationErrorReason;
  }) {
    super(message);

    Object.setPrototypeOf(this, TokenVerificationError.prototype);

    this.reason = reason;
    this.message = message;
  }

  public getFullMessage() {
    return `${[this.message].filter(m => m).join(' ')} (reason=${this.reason}, token-carrier=${
      this.tokenCarrier
    })`;
  }
  }

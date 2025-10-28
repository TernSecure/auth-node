import type { IdAndRefreshTokenJSON,TokenJSON } from './JSON';

export class Token {
  constructor(readonly jwt: string) {}

  static fromJSON(data: TokenJSON): Token {
    return new Token(data.jwt);
  }
}

export class IdAndRefreshTokens {
  constructor(
    readonly idToken: string,
    readonly refreshToken: string,
  ) {}

  static fromJSON(data: IdAndRefreshTokenJSON): IdAndRefreshTokens {
    return new IdAndRefreshTokens(data.idToken, data.refreshToken);
  }
}

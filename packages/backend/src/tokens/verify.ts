import type { DecodedIdToken, TernSecureConfig, TernSecureUserData } from '@tern-secure/types';

import type { JwtReturnType } from '../jwt/types';
import { ternDecodeJwt, verifyJwt, type VerifyJwtOptions } from '../jwt/verifyJwt';
import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';
import type { LoadJWKFromRemoteOptions } from './keys';
import { loadJWKFromRemote } from './keys';

export type VerifyTokenVOptions = Omit<VerifyJwtOptions, 'key'> & Omit<LoadJWKFromRemoteOptions, 'kid'> & {
  jwtKey?: string;
};

export { TernSecureConfig, TernSecureUserData };

export async function verifyToken(
  token: string,
  options: VerifyTokenVOptions,
): Promise<JwtReturnType<DecodedIdToken, TokenVerificationError>> {
  const { data: decodedResult, errors } = ternDecodeJwt(token);

  if (errors) {
    return { errors };
  }

  const { header } = decodedResult;
  const { kid } = header;

  if (!kid) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalid,
          message: 'JWT "kid" header is missing.',
        }),
      ],
    };
  }

  try {
    const key = options.jwtKey || (await loadJWKFromRemote({ ...options, kid }));

    if (!key) {
      return {
        errors: [
          new TokenVerificationError({
            reason: TokenVerificationErrorReason.TokenInvalid,
            message: `No public key found for kid "${kid}".`,
          }),
        ],
      };
    }
    return await verifyJwt(token, { ...options, key });
  } catch (error) {
    if (error instanceof TokenVerificationError) {
      return { errors: [error] };
    }
    return {
      errors: [error as TokenVerificationError],
    };
  }
}

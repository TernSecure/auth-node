import type { DecodedIdToken, Jwt, JWTPayload } from '@tern-secure/types';
import {
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
} from 'jose';

import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';
import { mapJwtPayloadToDecodedIdToken } from '../utils/mapDecode';
import { base64url } from '../utils/rfc4648';
import { importKey } from './cryptoKeys';
import type { JwtReturnType } from './types';
import {
  verifyExpirationClaim,
  verifyHeaderKid,
  verifyIssuedAtClaim,
  verifySubClaim,
} from './verifyContent';

const DEFAULT_CLOCK_SKEW_IN_MS = 5 * 1000;

export type VerifyJwtOptions = {
  audience?: string | string[];
  clockSkewInMs?: number;
  key: JsonWebKey | string;
};

export async function verifySignature(
  jwt: Jwt,
  key: JsonWebKey | string,
): Promise<JwtReturnType<JWTPayload, Error>> {
  const { header, raw } = jwt;
  const joseAlgorithm = header.alg || 'RS256';

  try {
    const publicKey = await importKey(key, joseAlgorithm);

    const { payload } = await jwtVerify(raw.text, publicKey);

    return { data: payload };
  } catch (error) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalidSignature,
          message: (error as Error).message,
        }),
      ],
    };
  }
}

export function ternDecodeJwt(token: string): JwtReturnType<Jwt, TokenVerificationError> {
  try {
    const header = decodeProtectedHeader(token);
    const payload = decodeJwt(token);

    const tokenParts = (token || '').toString().split('.');
    if (tokenParts.length !== 3) {
      return {
        errors: [
          new TokenVerificationError({
            reason: TokenVerificationErrorReason.TokenInvalid,
            message: 'Invalid JWT format',
          }),
        ],
      };
    }

    const [rawHeader, rawPayload, rawSignature] = tokenParts;
    const signature = base64url.parse(rawSignature, { loose: true });

    const data = {
      header,
      payload,
      signature,
      raw: {
        header: rawHeader,
        payload: rawPayload,
        signature: rawSignature,
        text: token,
      },
    };

    return { data };
  } catch (error: any) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalid,
          message: error.message,
        }),
      ],
    };
  }
}

export async function verifyJwt(
  token: string,
  options: VerifyJwtOptions,
): Promise<JwtReturnType<DecodedIdToken, TokenVerificationError>> {
  const { key } = options;
  const clockSkew = options.clockSkewInMs || DEFAULT_CLOCK_SKEW_IN_MS;

  const { data: decoded, errors } = ternDecodeJwt(token);
  if (errors) {
    return { errors };
  }

  const { header, payload } = decoded;

  try {
    verifyHeaderKid(header.kid);
    verifySubClaim(payload.sub);
    verifyExpirationClaim(payload.exp, clockSkew);
    verifyIssuedAtClaim(payload.iat, clockSkew);
  } catch (error) {
    return { errors: [error as TokenVerificationError] };
  }

  const { data: verifiedPayload, errors: signatureErrors } = await verifySignature(decoded, key);
  if (signatureErrors) {
    return {
      errors: [
        new TokenVerificationError({
          reason: TokenVerificationErrorReason.TokenInvalidSignature,
          message: 'Token signature verification failed.',
        }),
      ],
    };
  }

  const decodedIdToken = mapJwtPayloadToDecodedIdToken(verifiedPayload);

  return { data: decodedIdToken };
}

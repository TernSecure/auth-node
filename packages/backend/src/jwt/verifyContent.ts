import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';
import { algs } from './algorithms';

export const verifyHeaderType = (typ?: unknown) => {
  if (typeof typ === 'undefined') {
    return;
  }

  if (typ !== 'JWT') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalid,
      message: `Invalid JWT type ${JSON.stringify(typ)}. Expected "JWT".`,
    });
  }
};

export const verifyHeaderKid = (kid?: unknown) => {
  if (typeof kid === 'undefined') {
    return;
  }

  if (typeof kid !== 'string') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalid,
      message: `Invalid JWT kid ${JSON.stringify(kid)}. Expected a string.`,
    });
  }
};

export const verifyHeaderAlgorithm = (alg: string) => {
  if (!algs.includes(alg)) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenInvalidAlgorithm,
      message: `Invalid JWT algorithm ${JSON.stringify(alg)}. Supported: ${algs}.`,
    });
  }
};

export const verifySubClaim = (sub?: string) => {
  if (typeof sub !== 'string') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Subject claim (sub) is required and must be a string. Received ${JSON.stringify(sub)}.`,
    });
  }
};

export const verifyExpirationClaim = (exp: number | undefined, clockSkewInMs: number) => {
  if (typeof exp !== 'number') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Invalid JWT expiry date (exp) claim ${JSON.stringify(exp)}. Expected a number.`,
    });
  }

  const currentDate = new Date(Date.now());
  const expiryDate = new Date(0);
  expiryDate.setUTCSeconds(exp);

  const expired = expiryDate.getTime() <= currentDate.getTime() - clockSkewInMs;
  if (expired) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenExpired,
      message: `JWT is expired. Expiry date: ${expiryDate.toUTCString()}, Current date: ${currentDate.toUTCString()}.`,
    });
  }
};

export const verifyIssuedAtClaim = (iat: number | undefined, clockSkewInMs: number) => {
  if (typeof iat === 'undefined') {
    return;
  }

  if (typeof iat !== 'number') {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenVerificationFailed,
      message: `Invalid JWT issued at date claim (iat) ${JSON.stringify(iat)}. Expected a number.`,
    });
  }

  const currentDate = new Date(Date.now());
  const issuedAtDate = new Date(0);
  issuedAtDate.setUTCSeconds(iat);

  const postIssued = issuedAtDate.getTime() > currentDate.getTime() + clockSkewInMs;
  if (postIssued) {
    throw new TokenVerificationError({
      reason: TokenVerificationErrorReason.TokenIatInTheFuture,
      message: `JWT issued at date claim (iat) is in the future. Issued at date: ${issuedAtDate.toUTCString()}; Current date: ${currentDate.toUTCString()};`,
    });
  }
};

import type { JWTPayload } from '@tern-secure/types';
import { importPKCS8, SignJWT } from 'jose';

import type { JwtReturnType } from './types';


export interface CustomTokenClaims {
  [key: string]: unknown;
}

export class CustomTokenError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'CustomTokenError';
  }
}

const RESERVED_CLAIMS = [
  'acr',
  'amr',
  'at_hash',
  'aud',
  'auth_time',
  'azp',
  'cnf',
  'c_hash',
  'exp',
  'firebase',
  'iat',
  'iss',
  'jti',
  'nbf',
  'nonce',
  'sub',
];

async function createCustomTokenJwt(
  uid: string,
  developerClaims?: CustomTokenClaims,
): Promise<JwtReturnType<string, CustomTokenError>> {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!privateKey || !clientEmail) {
      return {
        errors: [
          new CustomTokenError(
            'Missing FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL environment variables',
            'MISSING_ENV_VARS',
          ),
        ],
      };
    }

    if (!uid || typeof uid !== 'string') {
      return {
        errors: [new CustomTokenError('uid must be a non-empty string', 'INVALID_UID')],
      };
    }

    if (uid.length > 128) {
      return {
        errors: [new CustomTokenError('uid must not exceed 128 characters', 'UID_TOO_LONG')],
      };
    }

    if (developerClaims) {
      for (const claim of Object.keys(developerClaims)) {
        if (RESERVED_CLAIMS.includes(claim)) {
          return {
            errors: [new CustomTokenError(`Custom claim '${claim}' is reserved`, 'RESERVED_CLAIM')],
          };
        }
      }
    }

    // Set expiration (default 1 hour, max 1 hour)
    const expiresIn = 3600;
    const now = Math.floor(Date.now() / 1000);

    const parsedPrivateKey = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'RS256');

    const payload: JWTPayload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + expiresIn,
      uid: uid,
      ...developerClaims,
    };

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .setIssuer(clientEmail)
      .setSubject(clientEmail)
      .setAudience(
        'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      )
      .sign(parsedPrivateKey);

    return {
      data: jwt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      errors: [
        new CustomTokenError(`Failed to create custom token: ${message}`, 'TOKEN_CREATION_FAILED'),
      ],
    };
  }
}

export async function createCustomToken(
  uid: string,
  developerClaims?: CustomTokenClaims,
): Promise<string> {
  const { data, errors } = await createCustomTokenJwt(uid, developerClaims);

  if (errors) {
    throw errors[0];
  }

  return data;
}

export function createCustomTokenWithResult(
  uid: string,
  developerClaims?: CustomTokenClaims,
): Promise<JwtReturnType<string, CustomTokenError>> {
  return createCustomTokenJwt(uid, developerClaims);
}
import { type RemoteJWKSetOptions } from 'jose';

import {
  CACHE_CONTROL_REGEX,
  DEFAULT_CACHE_DURATION,
  GOOGLE_PUBLIC_KEYS_URL,
  MAX_CACHE_LAST_UPDATED_AT_SECONDS
} from '../constants';
import { TokenVerificationError, TokenVerificationErrorReason } from '../utils/errors';

export type PublicKeys = { [key: string]: string };

interface PublicKeysResponse {
  keys: PublicKeys;
  expiresAt: number;
}

export type LoadJWKFromRemoteOptions = RemoteJWKSetOptions & {
  kid: string;
  keyURL?: string;
  skipJwksCache?: boolean;
};

type CertificateCache = Record<string, string>;

let cache: CertificateCache = {};
let lastUpdatedAt = 0;
let googleExpiresAt = 0;

function getFromCache(kid: string) {
  return cache[kid];
}

function getCacheValues() {
  return Object.values(cache);
}

function setInCache(kid: string, certificate: string, shouldExpire = true) {
  cache[kid] = certificate;
  lastUpdatedAt = shouldExpire ? Date.now() : -1;
}

async function fetchPublicKeys(keyUrl: string): Promise<PublicKeysResponse> {
  const url = new URL(keyUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new TokenVerificationError({
      message: `Error loading public keys from ${url.href} with code=${response.status} `,
      reason: TokenVerificationErrorReason.TokenInvalid,
    });
  }

  const data = await response.json();
  const expiresAt = getExpiresAt(response);

  return {
    keys: data,
    expiresAt,
  };
}

export async function loadJWKFromRemote({
  keyURL = GOOGLE_PUBLIC_KEYS_URL,
  skipJwksCache,
  kid,
}: LoadJWKFromRemoteOptions): Promise<string> {
  if (skipJwksCache || isCacheExpired() || !getFromCache(kid)) {
    const { keys, expiresAt } = await fetchPublicKeys(keyURL);

    if (!keys || Object.keys(keys).length === 0) {
      throw new TokenVerificationError({
        message: `The JWKS endpoint ${keyURL} returned no keys`,
        reason: TokenVerificationErrorReason.RemoteJWKFailedToLoad,
      });
    }
    googleExpiresAt = expiresAt;

    Object.entries(keys).forEach(([keyId, cert]) => {
      setInCache(keyId, cert);
    });
  }
  const cert = getFromCache(kid);
  if (!cert) {
    getCacheValues();
    const availableKids = Object.keys(cache).sort().join(', ');

    throw new TokenVerificationError({
      message: `No public key found for kid "${kid}". Available kids: [${availableKids}]`,
      reason: TokenVerificationErrorReason.TokenInvalid,
    });
  }
  return cert;
}

function isCacheExpired() {
  const now = Date.now();
  if (lastUpdatedAt === -1) {
    return false;
  }

  const cacheAge = now - lastUpdatedAt;
  const maxCacheAge = MAX_CACHE_LAST_UPDATED_AT_SECONDS * 1000;
  const localCacheExpired = cacheAge >= maxCacheAge;
  const googleCacheExpired = now >= googleExpiresAt;

  const isExpired = localCacheExpired || googleCacheExpired;

  if (isExpired) {
    cache = {};
  }

  return isExpired;
}

function getExpiresAt(res: Response) {
  const cacheControlHeader = res.headers.get('cache-control');
  if (!cacheControlHeader) {
    return Date.now() + DEFAULT_CACHE_DURATION;
  }
  const maxAgeMatch = cacheControlHeader.match(CACHE_CONTROL_REGEX);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : DEFAULT_CACHE_DURATION / 1000;

  return Date.now() + maxAge * 1000;
}

export const getCacheStats = () => ({
  localExpiry: lastUpdatedAt + MAX_CACHE_LAST_UPDATED_AT_SECONDS * 1000,
  googleExpiry: googleExpiresAt,
  cacheCount: Object.keys(cache).length,
});

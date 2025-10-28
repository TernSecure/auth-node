import { importJWK, importSPKI,importX509, type KeyLike } from 'jose';

export async function importKey(key: JsonWebKey | string, algorithm: string): Promise<KeyLike> {
  if (typeof key === 'object') {
    const result = await importJWK(key as Parameters<typeof importJWK>[0], algorithm);
    if (result instanceof Uint8Array) {
      throw new Error('Unexpected Uint8Array result from JWK import');
    }
    return result;
  }

  const keyString = key.trim();

  if (keyString.includes('-----BEGIN CERTIFICATE-----')) {
    return await importX509(keyString, algorithm);
  }

  if (keyString.includes('-----BEGIN PUBLIC KEY-----')) {
    return await importSPKI(keyString, algorithm);
  }

  try {
    return await importSPKI(keyString, algorithm);
  } catch (error) {
    throw new Error(
      `Unsupported key format. Supported formats: X.509 certificate (PEM), SPKI (PEM), JWK (JSON object or string). Error: ${error}`,
    );
  }
}

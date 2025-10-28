import { createCustomToken } from '../jwt/customJwt';
import type { AuthenticateRequestOptions, TernSecureUserData } from '../tokens/types';
import { verifyToken } from '../tokens/verify';

export interface IdAndRefreshTokens {
  idToken: string;
  refreshToken: string;
}

export interface CustomTokens {
  idToken: string;
  refreshToken: string;
  customToken: string;
}

interface CustomForIdAndRefreshTokenOptions {
  tenantId?: string;
  appCheckToken?: string;
  referer?: string;
}

interface FirebaseRefreshTokenResponse {
  kind: string;
  id_token: string;
  refresh_token: string;
  expires_in: string;
  isNewUser: boolean;
}

interface FirebaseCustomTokenResponse {
  kind: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  isNewUser: boolean;
}

type AuthResult<T = any> = { data: T; error: null } | { data: null; error: any };

const API_KEY_ERROR = 'API Key is required';
const NO_DATA_ERROR = 'No token data received';

function parseFirebaseResponse<T>(data: unknown): T {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      throw new Error(`Failed to parse Firebase response: ${error}`);
    }
  }
  return data as T;
}

export function getAuth(options: AuthenticateRequestOptions) {
  const { apiKey } = options;
  const firebaseApiKey = options.firebaseConfig?.apiKey;
  const effectiveApiKey = apiKey || firebaseApiKey;

  async function getUserData(idToken?: string, localId?: string): Promise<TernSecureUserData> {
    if (!effectiveApiKey) {
      throw new Error(API_KEY_ERROR);
    }
    const response = await options.apiClient?.userData.getUserData(effectiveApiKey, {
      idToken,
      localId,
    });

    if (!response?.data) {
      throw new Error(NO_DATA_ERROR);
    }

    const parsedData = parseFirebaseResponse<TernSecureUserData>(response.data);
    return parsedData;
  }

  async function refreshExpiredIdToken(
    refreshToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<AuthResult> {
    if (!effectiveApiKey) {
      return { data: null, error: new Error(API_KEY_ERROR) };
    }
    const response = await options.apiClient?.tokens.refreshToken(effectiveApiKey, {
      refresh_token: refreshToken,
      request_origin: opts.referer,
    });

    if (!response?.data) {
      return {
        data: null,
        error: new Error(NO_DATA_ERROR),
      };
    }

    const parsedData = parseFirebaseResponse<FirebaseRefreshTokenResponse>(response.data);

    return {
      data: {
        idToken: parsedData.id_token,
        refreshToken: parsedData.refresh_token,
      },
      error: null,
    };
  }

  async function customForIdAndRefreshToken(
    customToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<IdAndRefreshTokens> {
    if (!effectiveApiKey) {
      throw new Error('API Key is required to create custom token');
    }
    const response = await options.apiClient?.tokens.exchangeCustomForIdAndRefreshTokens(
      effectiveApiKey,
      {
        token: customToken,
        returnSecureToken: true,
      },
      {
        referer: opts.referer,
      },
    );

    if (!response?.data) {
      throw new Error('No data received from Firebase token exchange');
    }

    const parsedData = parseFirebaseResponse<FirebaseCustomTokenResponse>(response.data);

    return {
      idToken: parsedData.idToken,
      refreshToken: parsedData.refreshToken,
    };
  }

  async function createCustomIdAndRefreshToken(
    idToken: string,
    opts: CustomForIdAndRefreshTokenOptions,
  ): Promise<CustomTokens> {
    const decoded = await verifyToken(idToken, options);
    const { data, errors } = decoded;
    if (errors) {
      throw errors[0];
    }

    const customToken = await createCustomToken(data.uid, {
      emailVerified: data.email_verified,
      source_sign_in_provider: data.firebase.sign_in_provider,
    });

    const idAndRefreshTokens = await customForIdAndRefreshToken(customToken, {
      referer: opts.referer,
    });

    return {
      ...idAndRefreshTokens,
      customToken,
    };
  }

  return {
    getUserData,
    customForIdAndRefreshToken,
    createCustomIdAndRefreshToken,
    refreshExpiredIdToken,
  };
}

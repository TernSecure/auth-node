import { getCookieName, getCookiePrefix } from '@tern-secure/shared/cookie';
import type { AuthenticateRequestOptions } from '@tern-secure-node/backend';
import { constants } from '@tern-secure-node/backend';
import { getAuth } from '@tern-secure-node/backend/auth';

import { ternSecureBackendClient } from '../../server/ternsecureClient';
import type { NextCookieStore } from '../../utils/NextCookieAdapter';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from './constants';
import { getCookieOptions } from './cookieOptionsHelper';
import type { TernSecureHandlerOptions } from './types';

export async function refreshCookieWithIdToken(
  idToken: string,
  cookieStore: NextCookieStore,
  config?: TernSecureHandlerOptions,
  referrer?: string,
): Promise<void> {
  const backendClient = await ternSecureBackendClient();

  const authOptions: AuthenticateRequestOptions = {
    tenantId: config?.tenantId || undefined,
    firebaseConfig: {
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      appId: FIREBASE_APP_ID,
    },
    apiClient: backendClient,
  };

  const COOKIE_OPTIONS = getCookieOptions(config);

  const { createCustomIdAndRefreshToken } = getAuth(authOptions);

  const customTokens = await createCustomIdAndRefreshToken(idToken, { referer: referrer });

  const cookiePrefix = getCookiePrefix();

  const cookiePromises = [
    cookieStore.set(
      getCookieName(constants.Cookies.IdToken, cookiePrefix),
      customTokens.idToken,
      COOKIE_OPTIONS,
    ),
    cookieStore.set(
      getCookieName(constants.Cookies.Refresh, cookiePrefix),
      customTokens.refreshToken,
      COOKIE_OPTIONS,
    ),
  ];

  if (config?.enableCustomToken) {
    cookiePromises.push(
      cookieStore.set(constants.Cookies.Custom, customTokens.customToken, COOKIE_OPTIONS),
    );
  }

  await Promise.all(cookiePromises);
}

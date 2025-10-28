import admin from 'firebase-admin';

import { initializeAdminConfig } from './config';

if (!admin.apps.length) {
  try {
    const config = initializeAdminConfig();
    admin.initializeApp({
      credential: admin.credential.cert({
        ...config,
        privateKey: config.privateKey.replace(/\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const tenantManager = admin.auth().tenantManager();

/**
 * Gets the appropriate Firebase Auth instance.
 * If a tenantId is provided, it returns the Auth instance for that tenant.
 * Otherwise, it returns the default project-level Auth instance.
 * @param tenantId - The optional tenant ID.
 * @returns An admin.auth.Auth instance.
 */
export function getAuthForTenant(tenantId?: string): admin.auth.Auth {
  if (tenantId) {
    return tenantManager.authForTenant(tenantId) as unknown as admin.auth.Auth;
  }
  return admin.auth();
}
import type { TernSecureConfig } from "@tern-secure/types";
import { AuthStatus } from "@tern-secure-node/backend";
import type { FirebaseServerApp } from "firebase/app";
import { initializeServerApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";

import { getAuthKeyFromRequest } from "../../server/headers-utils";
import type { RequestLike } from "../../server/types";
import type { Aobj, SerializableTernSecureUser } from "../../types";
import { FIREBASE_API_KEY, FIREBASE_APP_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_MEASUREMENT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET } from "../constant";


// Serializable auth object type
/**
 * Auth objects moving through the server -> client boundary need to be serializable
 * as we need to ensure that they can be transferred via the network as pure strings.
 * Some frameworks like Remix or Next (/pages dir only) handle this serialization by simply
 * ignoring any non-serializable keys, however Nextjs /app directory is stricter and
 * throws an error if a non-serializable value is found.
 * @internal
 */
export const authObjectToSerializable = <T extends Record<string, unknown>>(
  obj: T
): T => {
  // remove any non-serializable props from the returned object

  const { ...rest } = obj as unknown as Aobj;
  return rest as unknown as T;
};

export async function getTernSecureAuthData(
  req: RequestLike,
  initialState = {}
) {
  const authObject = await getAuthDataFromRequest(req);
  return authObjectToSerializable({ ...initialState, ...authObject });
}

export async function getAuthDataFromRequest(req: RequestLike): Promise<Aobj> {
  const authStatus = getAuthKeyFromRequest(req, "AuthStatus");
  const authToken = getAuthKeyFromRequest(req, "AuthToken");
  const authSignature = getAuthKeyFromRequest(req, "AuthSignature");
  const authReason = getAuthKeyFromRequest(req, "AuthReason");

  let authObject;
  if (!authStatus || authStatus !== AuthStatus.SignedIn) {
    authObject = null;
  } else {
    const authResult = await authenticateRequest(
      authToken as string,
      req as any
    );
    authObject = authResult;
  }

  return {
    user: authObject,
    userId: authObject ? authObject.uid : null,
  };
}

const authenticateRequest = async (
  token: string,
  request: Request
): Promise<SerializableTernSecureUser | null> => {
  try {
    const origin = new URL(request.url).origin;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("referer", origin);
    requestHeaders.set("Referer", origin);

    const mockRequest = {
      headers: requestHeaders,
    };

    const config: TernSecureConfig = {
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT_ID,
      storageBucket: FIREBASE_STORAGE_BUCKET,
      messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      appId: FIREBASE_APP_ID,
      measurementId: FIREBASE_MEASUREMENT_ID,
    };

    const firebaseServerApp: FirebaseServerApp = initializeServerApp(
      config,
      {
        authIdToken: token,
        releaseOnDeref: mockRequest,
      }
    );

    const auth: Auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    if (auth.currentUser) {
      const userObj: SerializableTernSecureUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
        displayName: auth.currentUser.displayName,
        isAnonymous: auth.currentUser.isAnonymous,
        phoneNumber: auth.currentUser.phoneNumber,
        photoURL: auth.currentUser.photoURL,
        providerId: auth.currentUser.providerId,
        tenantId: auth.currentUser.tenantId,
        refreshToken: auth.currentUser.refreshToken,
        metadata: {
          creationTime: auth.currentUser.metadata.creationTime,
          lastSignInTime: auth.currentUser.metadata.lastSignInTime,
        },
        providerData: auth.currentUser.providerData.map((provider) => ({
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          photoURL: provider.photoURL,
          providerId: provider.providerId,
        })),
      };

      return userObj;
    }

    return null;
  } catch (error) {
    return null;
  }
};

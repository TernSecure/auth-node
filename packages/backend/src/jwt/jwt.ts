import type {
  DecodedIdToken,
  TernVerificationResult,
} from "@tern-secure/types";
import { createRemoteJWKSet, decodeJwt,jwtVerify } from "jose";


export type FirebaseIdTokenPayload = DecodedIdToken;

// Firebase public key endpoints
const FIREBASE_ID_TOKEN_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const FIREBASE_SESSION_CERT_URL =
  "https://identitytoolkit.googleapis.com/v1/sessionCookiePublicKeys";

//const FIREBASE_NEW_SESSION_PK = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys"

// Simple in-memory cache for JWKS
let idTokenJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let sessionJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

const getIdTokenJWKS = () => {
  if (!idTokenJWKS) {
    idTokenJWKS = createRemoteJWKSet(new URL(FIREBASE_ID_TOKEN_URL), {
      cacheMaxAge: 3600000, // 1 hour
      timeoutDuration: 5000, // 5 seconds
      cooldownDuration: 30000, // 30 seconds between retries
    });
  }
  return idTokenJWKS;
};

const getSessionJWKS = () => {
  if (!sessionJWKS) {
    sessionJWKS = createRemoteJWKSet(new URL(FIREBASE_SESSION_CERT_URL), {
      cacheMaxAge: 3600000, // 1 hour
      timeoutDuration: 5000, // 5 seconds
      cooldownDuration: 30000, // 30 seconds between retries
    });
  }
  return sessionJWKS;
};



export async function verifyToken(
  token: string,
  isSessionCookie = false
): Promise<TernVerificationResult> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error("Firebase Project ID is not configured");
    }

    const { decoded } = decodeJwt(token);
    if (!decoded) {
      throw new Error("Invalid token format");
    }

    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        // Use different JWKS based on token type
        const JWKS = isSessionCookie ? getSessionJWKS() : getIdTokenJWKS();

        const { payload } = await jwtVerify(token, JWKS, {
          issuer: isSessionCookie
            ? "https://session.firebase.google.com/" + projectId
            : "https://securetoken.google.com/" + projectId,
          audience: projectId,
          algorithms: ["RS256"],
        });

        const firebasePayload = payload as unknown as FirebaseIdTokenPayload;
        const now = Math.floor(Date.now() / 1000);

        // Verify token claims
        if (firebasePayload.exp <= now) {
          throw new Error("Token has expired");
        }

        if (firebasePayload.iat > now) {
          throw new Error("Token issued time is in the future");
        }

        if (!firebasePayload.sub) {
          throw new Error("Token subject is empty");
        }

        if (firebasePayload.auth_time > now) {
          throw new Error("Token auth time is in the future");
        }

        return {
          valid: true,
          uid: firebasePayload.sub,
          sub: firebasePayload.sub,
          email: firebasePayload.email,
          email_verified: firebasePayload.email_verified,
          auth_time: firebasePayload.auth_time,
          iat: firebasePayload.iat,
          exp: firebasePayload.exp,
          aud: firebasePayload.aud,
          iss: firebasePayload.iss,
          firebase: firebasePayload.firebase,
          phone_number: firebasePayload.phone_number,
          picture: firebasePayload.picture,
        };
      } catch (error) {
        lastError = error as Error;
        if (error instanceof Error && error.name === "JWKSNoMatchingKey") {
          console.warn(`JWKS retry attempt ${4 - retries}:`, error.message);
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
        }
        throw error;
      }
    }

    throw lastError || new Error("Failed to verify token after retries");
  } catch (error) {
    console.error("Token verification details:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      decoded: decodeJwt(token),
      isSessionCookie,
    });

    return {
      valid: false,
      error: {
        success: false,
        message: error instanceof Error ? error.message : "Invalid token",
        code: "INVALID_TOKEN",
      },
    };
  }
}

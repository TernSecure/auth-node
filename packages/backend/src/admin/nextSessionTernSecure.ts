"use server";

import { getCookieName, getCookiePrefix } from "@tern-secure/shared/cookie";
import { handleFirebaseAuthError } from "@tern-secure/shared/errors";
import type {
  DecodedIdToken,
  SessionResult,
  TernVerificationResult,
} from "@tern-secure/types";
import { cookies } from "next/headers";

import { constants } from "../constants";
import {
  adminTernSecureAuth as adminAuth,
  getAuthForTenant,
} from "../utils/admin-init";

export type TernVerification =
  | (DecodedIdToken & {
      error?: never;
    })
  | {
      error: any;
    };

const SESSION_CONSTANTS = {
  COOKIE_NAME: constants.Cookies.Session,
  DEFAULT_EXPIRES_IN_MS: 60 * 60 * 24 * 5 * 1000, // 5 days
  DEFAULT_EXPIRES_IN_SECONDS: 60 * 60 * 24 * 5,
  REVOKE_REFRESH_TOKENS_ON_SIGNOUT: true,
} as const;

/**
 * Helper function to log debug messages only in development environment
 */
const debugLog = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

export async function CreateNextSessionCookie(idToken: string) {
  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set(constants.Cookies.Session, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch (error) {
    return { success: false, message: "Failed to create session" };
  }
}

export async function GetNextServerSessionCookie() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("_session_cookie")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  try {
    const decondeClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    return {
      token: sessionCookie,
      userId: decondeClaims.uid,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new Error("Invalid Session");
  }
}

export async function GetNextIdToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("_session_token")?.value;

  if (!token) {
    throw new Error("No session cookie found");
  }

  try {
    const decodedClaims = await adminAuth.verifyIdToken(token);
    return {
      token: token,
      userId: decodedClaims.uid,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new Error("Invalid Session");
  }
}

export async function SetNextServerSession(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set("_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch {
    return { success: false, message: "Failed to create session" };
  }
}

export async function SetNextServerToken(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set("_tern", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });
    return { success: true, message: "Session created" };
  } catch {
    return { success: false, message: "Failed to create session" };
  }
}

export async function verifyNextTernIdToken(
  token: string
): Promise<TernVerificationResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      ...decodedToken,
      valid: true,
    };
  } catch (error) {
    const authError = handleFirebaseAuthError(error);
    return {
      valid: false,
      error: authError,
    };
  }
}

export async function VerifyNextTernSessionCookie(
  session: string
): Promise<TernVerification> {
  try {
    const res = await adminAuth.verifySessionCookie(session);
    return {
      ...res,
    };
  } catch (error) {
    const authError = handleFirebaseAuthError(error);
    return {
      error: authError,
    };
  }
}

export async function ClearNextSessionCookie(
  tenantId?: string,
  deleteOptions?: {
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    revokeRefreshTokensOnSignOut?: boolean;
  }
): Promise<SessionResult> {
  try {
    const tenantAuth = getAuthForTenant(tenantId || "");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONSTANTS.COOKIE_NAME);
    const cookiePrefix = getCookiePrefix();
    const idTokenCookieName = getCookieName(
      constants.Cookies.IdToken,
      cookiePrefix
    );
    const idTokenCookie = cookieStore.get(idTokenCookieName);

    const finalDeleteOptions = {
      path: deleteOptions?.path,
      domain: deleteOptions?.domain,
      httpOnly: deleteOptions?.httpOnly,
      secure: deleteOptions?.secure,
      sameSite: deleteOptions?.sameSite,
    };

    cookieStore.delete({
      name: SESSION_CONSTANTS.COOKIE_NAME,
      ...finalDeleteOptions,
    });
    cookieStore.delete({ name: idTokenCookieName, ...finalDeleteOptions });
    cookieStore.delete({
      name: getCookieName(constants.Cookies.Refresh, cookiePrefix),
      ...finalDeleteOptions,
    });
    cookieStore.delete({
      name: constants.Cookies.Custom,
      ...finalDeleteOptions,
    });

    const shouldRevokeTokens =
      deleteOptions?.revokeRefreshTokensOnSignOut ??
      SESSION_CONSTANTS.REVOKE_REFRESH_TOKENS_ON_SIGNOUT;

    if (shouldRevokeTokens) {
      try {
        let userSub: string | undefined;

        // Try to get user sub from session cookie first
        if (sessionCookie?.value) {
          try {
            const decodedClaims = await tenantAuth.verifySessionCookie(
              sessionCookie.value
            );
            userSub = decodedClaims.sub;
          } catch (sessionError) {
            debugLog.warn(
              "[ClearNextSessionCookie] Session cookie verification failed:",
              sessionError
            );
          }
        }

        // If no session cookie, try idToken cookie
        if (!userSub) {
          if (idTokenCookie?.value) {
            try {
              const decodedIdToken = await tenantAuth.verifyIdToken(
                idTokenCookie.value
              );
              userSub = decodedIdToken.sub;
            } catch (idTokenError) {
              debugLog.warn(
                "[ClearNextSessionCookie] ID token verification failed:",
                idTokenError
              );
            }
          }
        }

        // Revoke tokens if we got a user sub
        if (userSub) {
          await tenantAuth.revokeRefreshTokens(userSub);
          debugLog.log(
            `[ClearNextSessionCookie] Successfully revoked tokens for user: ${userSub}`
          );
        } else {
          debugLog.warn(
            "[ClearNextSessionCookie] No valid token found for revocation"
          );
        }
      } catch (revokeError) {
        debugLog.error(
          "[ClearNextSessionCookie] Failed to revoke refresh tokens:",
          revokeError
        );
      }
    }
    return { success: true, message: "Session cleared successfully" };
  } catch (error) {
    debugLog.error("Error clearing session:", error);
    return { success: false, message: "Failed to clear session cookies" };
  }
}

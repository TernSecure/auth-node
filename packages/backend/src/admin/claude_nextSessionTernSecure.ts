"use server";

import { handleFirebaseAuthError } from "@tern-secure/shared/errors";
import type { DecodedIdToken } from "@tern-secure/types";

import { adminTernSecureAuth as adminAuth } from "../utils/admin-init";

/**
 * Generic reusable return type for authentication operations
 * Returns either data of type T or an error of type E
 *
 * @template T - The type of the data when successful
 * @template E - The type of the error when failed
 */
export type AuthReturnType<T, E> =
  | { data: T; error?: never }
  | { data?: never; error: E };

/**
 * Return type for verifyNextTernIdToken function
 * Either returns data with decodedIdToken or error with detailed error information
 */
export type VerifyIdTokenResult = AuthReturnType<
  DecodedIdToken,
  ReturnType<typeof handleFirebaseAuthError>
>;

/**
 * Refactored function to verify Next.js Tern ID Token
 * Returns a consistent structure with either data or error
 *
 * @param token - The ID token to verify
 * @returns Object with either data containing decodedIdToken or error with detailed error information
 */
export async function claudeVerifyNextTernIdToken(
  token: string
): Promise<VerifyIdTokenResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      data: decodedToken,
    };
  } catch (error) {
    const authError = handleFirebaseAuthError(error);
    return {
      error: authError,
    };
  }
}

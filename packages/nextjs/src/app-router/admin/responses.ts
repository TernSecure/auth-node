import type { TernSecureApiErrorJSON } from '@tern-secure/types';
import { NextResponse } from 'next/server';

/**
 * Standardized error response creation
 */
export function createApiErrorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse {
  const errors: TernSecureApiErrorJSON[] = [
    {
      code,
      message,
    },
  ];

  return NextResponse.json(
    {
      success: false,
      message,
      error: code,
      errors, // Include both formats for compatibility
    },
    { status },
  );
}

/**
 * Standardized success response creation
 */
export function createApiSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status },
  );
}

/**
 * Session verification response utilities
 */
export class SessionResponseHelper {
  static createVerificationResponse(decodedSession: any): NextResponse {
    return createApiSuccessResponse({
      valid: true,
      uid: decodedSession.data?.payload?.sub,
      exp: decodedSession.data?.payload?.exp,
    });
  }

  static createUnauthorizedResponse(): NextResponse {
    return createApiErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  static createSessionCreationResponse(res: any): NextResponse {
    if (!res.success) {
      console.error('[TernSecureAuthHandler] Error creating session:', {
        error: res.error,
        message: res.message,
        cookieSet: res.cookieSet,
      });
    }

    const statusCode = res.success
      ? 200
      : res.error === 'INVALID_TOKEN'
        ? 400
        : res.error === 'EXPIRED_TOKEN'
          ? 401
          : 500;

    return NextResponse.json(res, { status: statusCode });
  }

  static createRefreshResponse(refreshRes: any): NextResponse {
    if (!refreshRes.success) {
      console.error('[TernSecureAuthHandler] Error refreshing session:', {
        error: refreshRes.error,
        message: refreshRes.message,
      });
    }

    const statusCode = refreshRes.success ? 200 : 401;
    return NextResponse.json(refreshRes, { status: statusCode });
  }

  static createRevokeResponse(res: any): NextResponse {
    if (!res.success) {
      console.error('[TernSecureAuthHandler] Error revoking session:', {
        error: res.error,
        message: res.message,
      });
    }
    const statusCode = res.success ? 200 : 500;
    return NextResponse.json(res, { status: statusCode });
  }
}

/**
 * HTTP method response utilities
 */
export class HttpResponseHelper {
  static createMethodNotAllowedResponse(): NextResponse {
    return createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  static createNotFoundResponse(): NextResponse {
    return createApiErrorResponse('NOT_FOUND', 'Endpoint not found', 404);
  }

  static createSubEndpointNotSupportedResponse(): NextResponse {
    return createApiErrorResponse(
      'SUB_ENDPOINT_NOT_SUPPORTED',
      'Sub-endpoint not supported for POST method',
      400,
    );
  }
}

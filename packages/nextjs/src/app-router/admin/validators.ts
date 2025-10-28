import { createApiErrorResponse } from './responses';
import type { AuthEndpoint, CorsOptions, SecurityOptions, SessionSubEndpoint } from './types';

/**
 * CORS validation utilities
 */
export class CorsValidator {
  static async validate(
    request: Request,
    corsOptions: CorsOptions,
  ): Promise<Response | null> {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Skip CORS for same-origin requests
    if (!origin || (host && origin.includes(host))) {
      return null;
    }

    if (corsOptions.allowedOrigins !== '*') {
      const isAllowed = corsOptions.allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.startsWith('*')) {
          const domain = allowedOrigin.slice(1);
          return origin?.endsWith(domain);
        }
        return origin === allowedOrigin;
      });

      if (!isAllowed) {
        return createApiErrorResponse('CORS_ORIGIN_NOT_ALLOWED', 'Origin not allowed', 403);
      }
    }

    return null;
  }

  static createOptionsResponse(corsOptions: CorsOptions): Response {
    const response = new Response(null, { status: 204 });

    if (corsOptions.allowedOrigins === '*') {
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else {
      response.headers.set('Access-Control-Allow-Origin', corsOptions.allowedOrigins.join(','));
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      corsOptions.allowedMethods?.join(',') || 'GET,POST',
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      corsOptions.allowedHeaders?.join(',') || 'Content-Type,Authorization',
    );

    if (corsOptions.allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (corsOptions.maxAge) {
      response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
    }

    return response;
  }
}

/**
 * Security validation utilities
 */
export class SecurityValidator {
  static async validate(
    request: Request,
    securityOptions: SecurityOptions,
  ): Promise<Response | null> {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent') || '';

    // CSRF Protection for cross-origin requests
    const csrfResult = this.validateCsrf(request, securityOptions, origin, host, referer);
    if (csrfResult) return csrfResult;

    // Required headers validation
    const headersResult = this.validateRequiredHeaders(request, securityOptions);
    if (headersResult) return headersResult;

    // User Agent filtering
    const userAgentResult = this.validateUserAgent(userAgent, securityOptions);
    if (userAgentResult) return userAgentResult;

    return null;
  }

  private static validateCsrf(
    request: Request,
    securityOptions: SecurityOptions,
    origin: string | null,
    host: string | null,
    referer: string | null,
  ): Response | null {
    if (securityOptions.requireCSRF && origin && host && !origin.includes(host)) {
      const hasCSRFHeader = request.headers.get('x-requested-with') === 'XMLHttpRequest';
      const hasValidReferer = referer && host && referer.includes(host);

      if (!hasCSRFHeader && !hasValidReferer) {
        const isAllowedReferer = securityOptions.allowedReferers?.some((allowedRef: string) =>
          referer?.includes(allowedRef),
        );

        if (!isAllowedReferer) {
          return createApiErrorResponse('CSRF_PROTECTION', 'Access denied', 403);
        }
      }
    }
    return null;
  }

  private static validateRequiredHeaders(
    request: Request,
    securityOptions: SecurityOptions,
  ): Response | null {
    if (securityOptions.requiredHeaders) {
      for (const [headerName, expectedValue] of Object.entries(securityOptions.requiredHeaders)) {
        const actualValue = request.headers.get(headerName);
        if (actualValue !== expectedValue) {
          return createApiErrorResponse(
            'INVALID_HEADERS',
            'Required header missing or invalid',
            400,
          );
        }
      }
    }
    return null;
  }

  private static validateUserAgent(
    userAgent: string,
    securityOptions: SecurityOptions,
  ): Response | null {
    // User Agent blocking
    if (securityOptions.userAgent?.block?.length) {
      const isBlocked = securityOptions.userAgent.block.some((blocked: string) =>
        userAgent.toLowerCase().includes(blocked.toLowerCase()),
      );

      if (isBlocked) {
        return createApiErrorResponse('USER_AGENT_BLOCKED', 'Access denied', 403);
      }
    }

    // User Agent allowlist
    if (securityOptions.userAgent?.allow?.length) {
      const isAllowed = securityOptions.userAgent.allow.some((allowed: string) =>
        userAgent.toLowerCase().includes(allowed.toLowerCase()),
      );

      if (!isAllowed) {
        return createApiErrorResponse('USER_AGENT_NOT_ALLOWED', 'Access denied', 403);
      }
    }

    return null;
  }
}

/**
 * CSRF token validation utilities
 */
export class CsrfValidator {
  static validate(csrfToken: string, csrfCookieValue: string | undefined): Response | null {
    if (!csrfToken) {
      return createApiErrorResponse('INVALID_CSRF_TOKEN', 'CSRF token is required', 400);
    }

    if (!csrfCookieValue) {
      return createApiErrorResponse('CSRF_COOKIE_MISSING', 'CSRF token cookie not found', 403);
    }

    if (csrfToken !== csrfCookieValue) {
      return createApiErrorResponse('CSRF_TOKEN_MISMATCH', 'CSRF token mismatch', 403);
    }

    return null;
  }
}

/**
 * Route validation utilities
 */
export class RouteValidator {
  static validatePathStructure(pathSegments: string[]): Response | null {
    if (pathSegments.length < 3) {
      return createApiErrorResponse(
        'INVALID_ROUTE',
        'Invalid route structure. Expected: /api/auth/{endpoint}',
        404,
      );
    }
    return null;
  }

  static validateEndpoint(
    _endpoint: AuthEndpoint,
    endpointConfig: any,
    method: string,
  ): Response | null {
    if (!endpointConfig || !endpointConfig.enabled) {
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
    }

    if (method !== 'OPTIONS' && !endpointConfig.methods.includes(method as any)) {
      return createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    return null;
  }

  static validateSubEndpoint(
    subEndpoint: SessionSubEndpoint | undefined,
    subEndpointConfig: any,
    method: string,
  ): Response | null {
    if (!subEndpoint) {
      return createApiErrorResponse('SUB_ENDPOINT_REQUIRED', 'Session sub-endpoint required', 400);
    }

    if (!subEndpointConfig || !subEndpointConfig.enabled) {
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
    }

    if (!subEndpointConfig.methods?.includes(method as any)) {
      return createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    return null;
  }
}

/**
 * Request body validation utilities
 */
export class RequestValidator {
  static async validateSessionRequest(request: Request): Promise<{
    body: any;
    idToken?: string;
    csrfToken?: string;
    error?: Response;
  }> {
    try {
      const body = await request.json();
      return { body, idToken: body.idToken, csrfToken: body.csrfToken };
    } catch (error) {
      return {
        body: null,
        error: createApiErrorResponse('INVALID_REQUEST_FORMAT', 'Invalid request format', 400),
      };
    }
  }

  static validateIdToken(idToken: string | undefined): Response | null {
    if (!idToken) {
      return createApiErrorResponse(
        'INVALID_TOKEN',
        'ID token is required for creating session',
        400,
      );
    }
    return null;
  }
}

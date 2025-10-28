import { cookies } from 'next/headers';

import type { RequestProcessorContext } from './c-authenticateRequestProcessor';
import { createApiErrorResponse } from './responses';
import type {
  AuthEndpoint,
  ComprehensiveValidationResult,
  CorsOptions,
  EndpointConfig,
  SecurityOptions,
  SessionSubEndpoint,
  ValidationConfig,
} from './types';

/**
 * Main validators factory function
 * Returns an object containing all validator functions and utilities
 */
export function createValidators(context: RequestProcessorContext) {
  const { origin, host, referrer, userAgent, method, pathSegments } = context;
  const request = context.request;

  async function validateCors(corsOptions: CorsOptions): Promise<Response | null> {
    if (corsOptions.skipSameOrigin) {
      if (!origin || (host && origin.includes(host))) {
        return null;
      }
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

  function createCorsOptionsResponse(corsOptions: CorsOptions): Response {
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

  async function validateSecurity(securityOptions: SecurityOptions): Promise<Response | null> {
    const csrfResult = validateCsrf(securityOptions);
    if (csrfResult) return csrfResult;

    const headersResult = validateRequiredHeaders(securityOptions);
    if (headersResult) return headersResult;

    const userAgentResult = validateUserAgent(securityOptions);
    if (userAgentResult) return userAgentResult;

    return null;
  }

  function validateCsrf(securityOptions: SecurityOptions): Response | null {
    if (securityOptions.requireCSRF && origin && host && !origin.includes(host)) {
      const hasCSRFHeader = context.request.headers.get('x-requested-with') === 'XMLHttpRequest';
      const hasValidReferer = referrer && host && referrer.includes(host);

      if (!hasCSRFHeader && !hasValidReferer) {
        const isAllowedReferrer = securityOptions.allowedReferers?.some((allowedRef: string) =>
          referrer?.includes(allowedRef),
        );

        if (!isAllowedReferrer) {
          return createApiErrorResponse('CSRF_PROTECTION', 'Access denied', 403);
        }
      }
    }
    return null;
  }

  function validateRequiredHeaders(securityOptions: SecurityOptions): Response | null {
    if (securityOptions.requiredHeaders) {
      for (const [headerName, expectedValue] of Object.entries(securityOptions.requiredHeaders)) {
        const actualValue = context.request.headers.get(headerName);
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

  function validateUserAgent(securityOptions: SecurityOptions): Response | null {
    if (securityOptions.userAgent?.block?.length) {
      const isBlocked = securityOptions.userAgent.block.some((blocked: string) =>
        context.request.headers.get('user-agent')?.toLowerCase().includes(blocked.toLowerCase()),
      );

      if (isBlocked) {
        return createApiErrorResponse('USER_AGENT_BLOCKED', 'Access denied', 403);
      }
    }

    if (securityOptions.userAgent?.allow?.length) {
      const isAllowed = securityOptions.userAgent.allow.some((allowed: string) =>
        request.headers.get('user-agent')?.toLowerCase().includes(allowed.toLowerCase()),
      );

      if (!isAllowed) {
        return createApiErrorResponse('USER_AGENT_NOT_ALLOWED', 'Access denied', 403);
      }
    }

    return null;
  }

  function validateCsrfToken(
    csrfToken: string,
    csrfCookieValue: string | undefined,
  ): Response | null {
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

  function validatePathStructure(): Response | null {
    if (pathSegments.length < 3) {
      return createApiErrorResponse(
        'INVALID_ROUTE',
        'Invalid route structure. Expected: /api/auth/{endpoint}',
        404,
      );
    }
    return null;
  }

  function validateEndpoint(
    _endpoint: AuthEndpoint,
    endpointConfig: EndpointConfig,
  ): Response | null {
    if (!endpointConfig || !endpointConfig.enabled) {
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
    }

    if (method !== 'OPTIONS' && !endpointConfig.methods.includes(method as any)) {
      return createApiErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    return null;
  }

  function validateSubEndpoint(
    subEndpoint: SessionSubEndpoint | undefined,
    subEndpointConfig: any,
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

  async function validateSessionRequest(): Promise<{
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

  function validateIdToken(idToken: string | undefined): Response | null {
    if (!idToken) {
      return createApiErrorResponse(
        'INVALID_TOKEN',
        'ID token is required for creating session',
        400,
      );
    }
    return null;
  }

  /**
   * Main validation orchestrator function
   * Runs all configured validations in the correct order
   */
  async function validateRequest(config: ValidationConfig): Promise<ComprehensiveValidationResult> {
    if (method === 'OPTIONS' && config.cors) {
      return {
        isValid: true,
        corsResponse: createCorsOptionsResponse(config.cors),
      };
    }
    const pathError = validatePathStructure();
    if (pathError) {
      return { isValid: false, error: pathError };
    }

    if (config.cors) {
      const corsError = await validateCors(config.cors);
      if (corsError) {
        return { isValid: false, error: corsError };
      }
    }

    if (config.security) {
      const securityError = await validateSecurity(config.security);
      if (securityError) {
        return { isValid: false, error: securityError };
      }
    }

    if (config.endpoint) {
      const endpointError = validateEndpoint(config.endpoint.name, config.endpoint.config);
      if (endpointError) {
        return { isValid: false, error: endpointError };
      }
    }

    if (config.subEndpoint) {
      const subEndpointError = validateSubEndpoint(
        config.subEndpoint.name,
        config.subEndpoint.config,
      );
      if (subEndpointError) {
        return { isValid: false, error: subEndpointError };
      }
    }

    let sessionData;
    if (method === 'POST' && (config.requireIdToken || config.requireCsrfToken)) {
      const sessionResult = await validateSessionRequest();
      if (sessionResult.error) {
        return { isValid: false, error: sessionResult.error };
      }

      sessionData = sessionResult;

      if (config.requireIdToken) {
        const idTokenError = validateIdToken(sessionData.idToken);
        if (idTokenError) {
          return { isValid: false, error: idTokenError };
        }
      }

      if (config.requireCsrfToken && sessionData.csrfToken) {
        const cookieStore = await cookies();
        const csrfCookieValue = cookieStore.get('csrfToken')?.value;
        const csrfError = validateCsrfToken(sessionData.csrfToken, csrfCookieValue);
        if (csrfError) {
          return { isValid: false, error: csrfError };
        }
      }
    }

    return {
      isValid: true,
      sessionData,
    };
  }

  /**
   * Convenience function for quick validation setup
   */
  function createValidationConfig(overrides: Partial<ValidationConfig> = {}): ValidationConfig {
    return {
      ...overrides,
    };
  }

  return {
    createValidationConfig,

    validateRequest,

    validateCors,
    validateSecurity,
    validatePathStructure,
    validateEndpoint,
    validateSubEndpoint,
    validateSessionRequest,
    validateIdToken,
    validateCsrfToken,

    createCorsOptionsResponse,
  };
}

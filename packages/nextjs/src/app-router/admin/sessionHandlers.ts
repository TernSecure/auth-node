import type { CookieSubEndpoint } from '@tern-secure/types';
import { clearSessionCookie } from '@tern-secure-node/backend/admin';
import { ternDecodeJwtUnguarded } from '@tern-secure-node/backend/jwt';

import { NextCookieStore } from '../../utils/NextCookieAdapter';
import { type RequestProcessorContext } from './c-authenticateRequestProcessor';
import { createValidators } from './fnValidators';
import { refreshCookieWithIdToken } from './request';
import { createApiErrorResponse, createApiSuccessResponse, HttpResponseHelper, SessionResponseHelper } from './responses';
import type { SessionSubEndpoint, TernSecureHandlerOptions } from './types';

async function sessionEndpointHandler(
  context: RequestProcessorContext,
  config: TernSecureHandlerOptions,
): Promise<Response> {
  const { subEndpoint, method, referrer } = context;

  const validators = createValidators(context);

  const {
    validateSubEndpoint,
    validateSecurity,
    validateSessionRequest,
    validateCsrfToken,
    validateIdToken,
  } = validators;

  if (!subEndpoint) {
    return createApiErrorResponse('SUB_ENDPOINT_REQUIRED', 'Session sub-endpoint required', 400);
  }

  const sessionsConfig = config.endpoints?.sessions;
  const subEndpointConfig = sessionsConfig?.subEndpoints?.[subEndpoint];

  validateSubEndpoint(subEndpoint, subEndpointConfig);

  if (subEndpointConfig?.security) {
    await validateSecurity(subEndpointConfig.security);
  }

  const SessionGetHandler = async (subEndpoint: SessionSubEndpoint): Promise<Response> => {
    const handleSessionVerify = async (): Promise<Response> => {
      try {
        const sessionCookie = context.sessionTokenInCookie;
        if (!sessionCookie) {
          return SessionResponseHelper.createUnauthorizedResponse();
        }

        const { data: decodedSession, errors } = ternDecodeJwtUnguarded(sessionCookie);
        if (errors) {
          return SessionResponseHelper.createUnauthorizedResponse();
        }

        return SessionResponseHelper.createVerificationResponse(decodedSession);
      } catch (error) {
        return SessionResponseHelper.createUnauthorizedResponse();
      }
    };

    switch (subEndpoint) {
      case 'verify':
        return handleSessionVerify();
      default:
        return HttpResponseHelper.createNotFoundResponse();
    }
  };

  const SessionPostHandler = async (subEndpoint: SessionSubEndpoint): Promise<Response> => {
    const cookieStore = new NextCookieStore();

    const { idToken, csrfToken, error } = await validateSessionRequest();
    if (error) return error;

    const csrfCookieValue = await cookieStore.get('_session_terncf');
    validateCsrfToken(csrfToken || '', csrfCookieValue.value);

    const handleCreateSession = async (
      cookieStore: NextCookieStore,
      idToken: string,
    ): Promise<Response> => {
      try {
        await refreshCookieWithIdToken(idToken, cookieStore, config, referrer);
        return SessionResponseHelper.createSessionCreationResponse({
          success: true,
          message: 'Session created successfully',
        });
      } catch (error) {
        return createApiErrorResponse('SESSION_CREATION_FAILED', 'Session creation failed', 500);
      }
    };

    const handleRefreshSession = async (
      cookieStore: NextCookieStore,
      idToken: string,
    ): Promise<Response> => {
      try {
        const decodedSession = ternDecodeJwtUnguarded(idToken);
        if (decodedSession.errors) {
          return createApiErrorResponse('INVALID_SESSION', 'Invalid session for refresh', 401);
        }

        const refreshRes = await refreshCookieWithIdToken(idToken, cookieStore, config);
        return SessionResponseHelper.createRefreshResponse(refreshRes);
      } catch (error) {
        return createApiErrorResponse('REFRESH_FAILED', 'Session refresh failed', 500);
      }
    };

    const handleRevokeSession = async (cookieStore: NextCookieStore): Promise<Response> => {
      const res = await clearSessionCookie(cookieStore);
      return SessionResponseHelper.createRevokeResponse(res);
    };

    switch (subEndpoint) {
      case 'createsession': {
        validateIdToken(idToken);
        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return handleCreateSession(cookieStore, idToken!);
      }

      case 'refresh':
        //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return handleRefreshSession(cookieStore, idToken!);

      case 'revoke':
        return handleRevokeSession(cookieStore);

      default:
        return HttpResponseHelper.createSubEndpointNotSupportedResponse();
    }
  };

  switch (method) {
    case 'GET':
      return SessionGetHandler(subEndpoint);

    case 'POST':
      return SessionPostHandler(subEndpoint);

    default:
      return HttpResponseHelper.createMethodNotAllowedResponse();
  }
}

async function cookieEndpointHandler(
  context: RequestProcessorContext,
  config: TernSecureHandlerOptions,
): Promise<Response> {
  const { subEndpoint, method } = context;

  const validators = createValidators(context);
  const { validateSecurity } = validators;

  if (!subEndpoint) {
    return createApiErrorResponse('SUB_ENDPOINT_REQUIRED', 'Cookie sub-endpoint required', 400);
  }

  const cookiesConfig = config.endpoints?.cookies;
  const subEndpointConfig = cookiesConfig?.subEndpoints?.[subEndpoint as CookieSubEndpoint];

  if (!subEndpointConfig || !subEndpointConfig.enabled) {
    return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Cookie endpoint not found or disabled', 404);
  }

  if (subEndpointConfig?.security) {
    await validateSecurity(subEndpointConfig.security);
  }

  const CookieGetHandler = async (subEndpoint: CookieSubEndpoint): Promise<Response> => {
    const handleGetCookie = async (): Promise<Response> => {
      try {
        const url = new URL(context.ternUrl);
        const tokenName = url.searchParams.get('tokenName');

        if (!tokenName) {
          return createApiErrorResponse('TOKEN_NAME_REQUIRED', 'tokenName query parameter is required', 400);
        }

        let cookieValue: string | undefined;

        switch (tokenName) {
          case 'idToken':
            cookieValue = context.idTokenInCookie;
            break;
          case 'sessionToken':
            cookieValue = context.sessionTokenInCookie;
            break;
          case 'refreshToken':
            cookieValue = context.refreshTokenInCookie;
            break;
          case 'customToken':
            cookieValue = context.customTokenInCookie;
            break;
          default:
            return createApiErrorResponse('INVALID_TOKEN_NAME', 'Invalid token name. Must be one of: idToken, sessionToken, refreshToken, customToken', 400);
        }

        if (!cookieValue) {
          return createApiErrorResponse(
            'TOKEN_NOT_FOUND',
            `${tokenName} not found in httpOnly cookies`,
            404
          );
        }

        return createApiSuccessResponse({
          token: cookieValue,
        });
      } catch (error) {
        return createApiErrorResponse('COOKIE_RETRIEVAL_FAILED', 'Failed to retrieve cookie', 500);
      }
    };

    switch (subEndpoint) {
      case 'get':
        return handleGetCookie();
      default:
        return HttpResponseHelper.createNotFoundResponse();
    }
  };

  switch (method) {
    case 'GET':
      return CookieGetHandler(subEndpoint as CookieSubEndpoint);
    default:
      return HttpResponseHelper.createMethodNotAllowedResponse();
  }
}

export { sessionEndpointHandler, cookieEndpointHandler };

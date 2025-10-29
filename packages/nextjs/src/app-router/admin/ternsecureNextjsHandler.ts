import { createTernSecureRequest } from '@tern-secure-node/backend';

import { createRequestProcessor } from './c-authenticateRequestProcessor';
import { TENANT_ID } from './constants';
import { EndpointRouter } from './endpointRouter';
import { createValidators } from './fnValidators';
import { createApiErrorResponse } from './responses';
import type { TernSecureHandlerOptions } from './types';
import { DEFAULT_HANDLER_OPTIONS } from './types';
import { ConfigUtils } from './utils';

function createHandlerConfig(options?: TernSecureHandlerOptions): TernSecureHandlerOptions {
  const baseConfig: Required<TernSecureHandlerOptions> = ConfigUtils.mergeWithDefaults(
    DEFAULT_HANDLER_OPTIONS,
    options,
  );

  return {
    ...baseConfig,
    tenantId: TENANT_ID,
  };
}

export function createTernSecureNextJsHandler(options: TernSecureHandlerOptions) {
  const config = createHandlerConfig(options);

  const handler = async (request: Request): Promise<Response> => {
    try {
      const context = createRequestProcessor(createTernSecureRequest(request), options);

      const { validateSecurity } = createValidators(context);
      await validateSecurity(options.security || {});

      if (!context.endpoint) {
        return createApiErrorResponse('ENDPOINT_REQUIRED', 'Endpoint is required', 400);
      }

      return await EndpointRouter.route(context, config);
    } catch (error) {
      return createApiErrorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', 500);
    }
  };

  return {
    GET: handler,
    POST: handler,
  } as const;
}

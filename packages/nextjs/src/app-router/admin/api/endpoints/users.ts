{/*import type { NextResponse } from 'next/server';

import type { AuthEndpoint, TernSecureInternalHandlerConfig } from '../../types';
import type { EndpointHandler, HandlerContext } from './abstract';
import { createApiErrorResponse } from './responses';
import { SessionEndpointHandler } from './sessionHandlers';

class UsersHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'users';
  }

  handle(
    _handlerContext: HandlerContext,
    _config: TernSecureInternalHandlerConfig,
  ): Promise<NextResponse> {
    return Promise.resolve(
      createApiErrorResponse('ENDPOINT_NOT_IMPLEMENTED', 'Users endpoint not implemented', 501),
    );
  }
}*/}
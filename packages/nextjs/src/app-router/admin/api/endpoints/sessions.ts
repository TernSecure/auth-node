/*{import type { NextResponse } from 'next/server';

import type { AuthEndpoint, TernSecureInternalHandlerConfig } from '../../types';
import type { EndpointHandler, HandlerContext} from './abstract';
import { SessionEndpointHandler } from './sessionHandlers';

class SessionsHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'sessions';
  }

  async handle(
    handlerContext: HandlerContext,
    config: TernSecureInternalHandlerConfig,
  ): Promise<NextResponse> {
    const { request, subEndpoint, method } = handlerContext;
    return await SessionEndpointHandler.handle(request, method, subEndpoint, config);
  }
} */
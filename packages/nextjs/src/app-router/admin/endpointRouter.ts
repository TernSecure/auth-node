import type { RequestProcessorContext } from './c-authenticateRequestProcessor';
import { createApiErrorResponse } from './responses';
import { cookieEndpointHandler, sessionEndpointHandler } from './sessionHandlers';
import type { AuthEndpoint, TernSecureHandlerOptions } from './types';

export interface EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean;
  handle(context: RequestProcessorContext, config: TernSecureHandlerOptions): Promise<Response>;
}

class SessionsHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'sessions';
  }

  async handle(
    context: RequestProcessorContext,
    config: TernSecureHandlerOptions,
  ): Promise<Response> {
    return await sessionEndpointHandler(context, config);
  }
}

class UsersHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'users';
  }

  handle(_context: RequestProcessorContext, _config: TernSecureHandlerOptions): Promise<Response> {
    return Promise.resolve(
      createApiErrorResponse('ENDPOINT_NOT_IMPLEMENTED', 'Users endpoint not implemented', 501),
    );
  }
}

class CookieHandler implements EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean {
    return endpoint === 'cookies';
  }

  async handle(
    context: RequestProcessorContext,
    config: TernSecureHandlerOptions,
  ): Promise<Response> {
    return await cookieEndpointHandler(context, config);
  }
}

export class EndpointRouter {
  private static readonly handlers: EndpointHandler[] = [
    new SessionsHandler(),
    new UsersHandler(),
    new CookieHandler(),
  ];

  static async route(
    context: RequestProcessorContext,
    config: TernSecureHandlerOptions,
  ): Promise<Response> {
    const { endpoint } = context;

    if (!endpoint) {
      return createApiErrorResponse('ENDPOINT_REQUIRED', 'Endpoint is required', 400);
    }

    const handler = this.handlers.find(h => h.canHandle(endpoint));

    if (!handler) {
      return createApiErrorResponse('ENDPOINT_NOT_FOUND', 'Endpoint not found', 404);
    }

    return handler.handle(context, config);
  }

  static addHandler(handler: EndpointHandler): void {
    this.handlers.push(handler);
  }

  static removeHandler(predicate: (handler: EndpointHandler) => boolean): void {
    const index = this.handlers.findIndex(predicate);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }
}

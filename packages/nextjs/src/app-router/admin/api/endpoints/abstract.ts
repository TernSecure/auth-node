import type { RequestProcessorContext } from '../../c-authenticateRequestProcessor';
import type {
  AuthEndpoint,
  SessionSubEndpoint,
  TernSecureHandlerOptions,
} from '../../types';

export interface HandlerContext {
  request: Request;
  pathSegments: string[];
  endpoint: AuthEndpoint;
  subEndpoint: SessionSubEndpoint;
  method: string;
  requestProcessorContext: RequestProcessorContext;
}

export interface EndpointHandler {
  canHandle(endpoint: AuthEndpoint): boolean;
  handle(
    context: RequestProcessorContext,
    config: TernSecureHandlerOptions,
  ): Promise<Response>;
}

export abstract class BaseEndpointHandler implements EndpointHandler {
  abstract canHandle(endpoint: AuthEndpoint): boolean;
  abstract handle(
    context: RequestProcessorContext,
    config: TernSecureHandlerOptions,
  ): Promise<Response>;

  protected validateMethod(allowedMethods: string[], method: string): boolean {
    return allowedMethods.includes(method);
  }

  protected validateSubEndpoint(
    subEndpoint: SessionSubEndpoint | undefined,
    requiredSubEndpoint?: boolean,
  ): boolean {
    if (requiredSubEndpoint) {
      return subEndpoint !== undefined;
    }
    return true;
  }
}
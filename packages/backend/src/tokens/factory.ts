
import type { ApiClient } from '../fireRestApi';
import {
  type buildTimeOptions,
  mergePreDefinedOptions,
  type RuntimeOptions,
} from '../utils/options';
import { authenticateRequest } from './request';

/**
 * @internal
 */
export type CreateAuthenticateRequestOptions = {
  options: buildTimeOptions;
  apiClient: ApiClient;
};

export function createAuthenticateRequest(params: CreateAuthenticateRequestOptions) {
  const buildTimeOptions = mergePreDefinedOptions(params.options);
  const apiClient = params.apiClient;

  const handleAuthenticateRequest = (request: Request, options: RuntimeOptions = {}) => {
    const { apiUrl } = buildTimeOptions;
    return authenticateRequest(request, { ...options, apiUrl, apiClient });
  };

  return {
    authenticateRequest: handleAuthenticateRequest,
  };
}
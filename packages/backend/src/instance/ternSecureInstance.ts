import type { ApiClient,CreateFireApiOptions} from "../fireRestApi";
import { createFireApi } from "../fireRestApi";
import type { RequestState } from "../tokens/authstate";
import type { CreateAuthenticateRequestOptions } from "../tokens/factory";
import { createAuthenticateRequest } from "../tokens/factory";
import type {
  TernSecureRequest,
} from "../tokens/ternSecureRequest";

export type TernSecureBackendOptions = CreateFireApiOptions & CreateAuthenticateRequestOptions['options'];

export type TernSecureBackendClient = ApiClient & ReturnType<typeof createAuthenticateRequest>;

export interface TernSecureBackendInstance {
  ternSecureRequest: TernSecureRequest;
  requestState: RequestState;
}


export function createTernSecureBackendClient(options: TernSecureBackendOptions): TernSecureBackendClient {
  const opts = { ...options };
  const apiClient = createFireApi(opts);
  const requestState = createAuthenticateRequest({options: opts, apiClient});

  return {
    ...apiClient,
    ...requestState,
  };
}

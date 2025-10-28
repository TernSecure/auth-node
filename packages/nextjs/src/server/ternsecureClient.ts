import {
  createTernSecureBackendClient,
} from '@tern-secure-node/backend';

import { API_URL, API_VERSION,FIREBASE_API_KEY } from './constant';

const backendClientDefaultOptions = {
  apiKey: FIREBASE_API_KEY,
  apiUrl: API_URL,
  apiVersion: API_VERSION,
};

const ternSecureBackendClient = async () => {
  return createBackendClientWithOptions({});
};

const createBackendClientWithOptions: typeof createTernSecureBackendClient = options => {
  return createTernSecureBackendClient({
    ...backendClientDefaultOptions,
    ...options,
  });
};

export { ternSecureBackendClient };
import type { RequestFunction } from '../request';

export abstract class AbstractAPI {
  constructor(protected request: RequestFunction) {}

  protected requireApiKey(apiKey: string) {
    if (!apiKey) {
      throw new Error('A valid API key is required.');
    }
  }
}

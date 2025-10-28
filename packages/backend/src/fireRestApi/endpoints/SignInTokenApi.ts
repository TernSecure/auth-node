import type { IdAndRefreshTokens } from '../resources/Token';
import { AbstractAPI } from './AbstractApi';


type CreateSignInTokenParams = {
  token: string;
  returnSecureToken?: boolean;
};

export class SignInTokenApi extends AbstractAPI {
  public async createCustomToken(
    apiKey: string,
    params: CreateSignInTokenParams,
  ): Promise<IdAndRefreshTokens> {
    try {
      this.requireApiKey(apiKey);
      const { ...restParams } = params;

      const response = await this.request<IdAndRefreshTokens>({
        endpoint: "signInWithCustomToken",
        method: 'POST',
        bodyParams: restParams,
      });

      if (response.errors) {
        const errorMessage = response.errors[0]?.message || 'Failed to create custom token';
        throw new Error(errorMessage);
      }

      return response.data;
    } catch (error) {
      const contextualMessage = `Failed to create custom token: ${error instanceof Error ? error.message : 'Unknown error'}`;
      throw new Error(contextualMessage);
    }
  }
}

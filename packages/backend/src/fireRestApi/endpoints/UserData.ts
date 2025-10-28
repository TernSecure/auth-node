import type { User } from '../resources/User';
import { AbstractAPI } from './AbstractApi';

type UserDataParams = {
  localId?: string;
  idToken?: string;
};

type UserDataOptions = {
  referer?: string;
};

export class UserData extends AbstractAPI {
    public async getUserData(apiKey: string, params: UserDataParams, options?: UserDataOptions) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;

    const headers: Record<string, string> = {};
    if (options?.referer) {
      headers['Referer'] = options.referer;
    }
    return this.request<User>({
      endpoint: 'lookup',
      method: 'POST',
      apiKey,
      bodyParams: restParams,
      headerParams: headers,
    });
  }
}
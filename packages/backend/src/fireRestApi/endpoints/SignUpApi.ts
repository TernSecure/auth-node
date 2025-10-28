import { AbstractAPI } from "./AbstractApi";


type CreateSignUpTokenParams = {
  email: string;
  password: string;
  returnSecureToken?: boolean;
};


export class SignUpApi extends AbstractAPI {
  public async createCustomToken(apiKey: string, params: CreateSignUpTokenParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      endpoint: "signUp",
      method: "POST",
      bodyParams: restParams,
    });
  }

}

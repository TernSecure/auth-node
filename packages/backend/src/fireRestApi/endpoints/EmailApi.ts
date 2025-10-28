import { AbstractAPI } from "./AbstractApi";


type sendEmailVerificationParams = {
    idToken: string;
    requestType: 'VERIFY_EMAIL';
};

type ConfirmEmailVerificationParams = {
  oobCode: string;
};


export class EmailApi extends AbstractAPI {
  public async verifyEmailVerification(apiKey: string, params: sendEmailVerificationParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      endpoint: "sendOobCode",
      method: "POST",
      bodyParams: restParams,
    });
  }

  public async confirmEmailVerification(apiKey: string, params: ConfirmEmailVerificationParams) {
    this.requireApiKey(apiKey);
    const { ...restParams } = params;
    return this.request({
      endpoint: "sendOobCode",
      method: "POST",
      bodyParams: restParams,
    });
  }
}
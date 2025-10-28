import { EmailApi, PasswordApi, SignInTokenApi, SignUpApi, TokenApi, UserData } from './endpoints';
import { createRequest } from './request';

export type CreateFireApiOptions = Parameters<typeof createRequest>[0];
export type ApiClient = ReturnType<typeof createFireApi>;

export function createFireApi(options: CreateFireApiOptions) {
  const request = createRequest(options);
  return {
    email: new EmailApi(request),
    password: new PasswordApi(request),
    signIn: new SignInTokenApi(request),
    signUp: new SignUpApi(request),
    tokens: new TokenApi(request),
    userData: new UserData(request),
  };
}

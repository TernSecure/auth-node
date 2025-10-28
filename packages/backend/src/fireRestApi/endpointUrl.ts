import { FIREBASE_AUTH_EMULATOR_HOST, useEmulator } from './emulator';

export const topLevelEndpoint = (apiKey: string, projectId: string, version: string) => {
  return `https://identitytoolkit.googleapis.com/${version}/projects/${projectId}${apiKey}`;
};

export const lookupEndpoint = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
};

export const getRefreshTokenEndpoint = (apiKey: string) => {
  return `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
};

export const signInWithPassword = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
};

export const signUpEndpoint = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
};

export const getCustomTokenEndpoint = (apiKey: string) => {
  if (useEmulator() && FIREBASE_AUTH_EMULATOR_HOST) {
    let protocol = 'http://';
    if (FIREBASE_AUTH_EMULATOR_HOST.startsWith('http://')) {
      protocol = '';
    }

    return `${protocol}${FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
  }
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
};

export const passwordResetEndpoint = (apiKey: string) => {
  return `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`;
};

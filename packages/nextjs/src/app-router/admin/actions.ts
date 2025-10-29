'use server';

import {
  ClearNextSessionCookie,
  clearSessionCookie,
  CreateNextSessionCookie,
  createSessionCookie,
  SetNextServerSession,
  SetNextServerToken,
} from '@tern-secure-node/backend/admin';

import { NextCookieStore } from '../../utils/NextCookieAdapter';
import { TENANT_ID } from './constants';
import { getDeleteOptions } from './cookieOptionsHelper';
import type { TernSecureHandlerOptions } from './types';

export async function createSessionCookieServer(idToken: string) {
  const cookieStore = new NextCookieStore();
  return createSessionCookie(idToken, cookieStore);
}

export async function clearSessionCookieServer() {
  const cookieStore = new NextCookieStore();
  return clearSessionCookie(cookieStore);
}

export async function clearNextSessionCookie(options?: {
  cookies?: TernSecureHandlerOptions['cookies'];
  revokeRefreshTokensOnSignOut?: boolean;
}) {
  const deleteOptions = getDeleteOptions(options);
  return ClearNextSessionCookie(TENANT_ID, deleteOptions);
}

export async function setNextServerSession(idToken: string) {
  return SetNextServerSession(idToken);
}

export async function setNextServerToken(token: string) {
  return SetNextServerToken(token);
}

export async function createNextSessionCookie(idToken: string) {
  return CreateNextSessionCookie(idToken);
}

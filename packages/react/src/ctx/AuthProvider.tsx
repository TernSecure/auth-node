import { createContextAndHook } from "@tern-secure/shared/react";
import type { TernSecureUser } from "@tern-secure/types";

export type AuthProviderCtxValue = {
  userId: string | null | undefined;
  user: TernSecureUser | null | undefined;
};

export const [AuthProviderCtx, useAuthProviderCtx] =
  createContextAndHook<AuthProviderCtxValue>("AuthProviderCtx");

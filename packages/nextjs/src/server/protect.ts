import type { CheckAuthorizationFromSessionClaims } from "@tern-secure/types";
import type { AuthObject, RedirectFun, SignedInAuthObject } from "@tern-secure-node/backend";
import { constants } from "@tern-secure-node/backend";

import { constants as nextConstants } from "../constants";
import { isNextFetcher } from "./nextFetcher";

type AuthProtectOptions = {
  /**
   * The URL to redirect the user to if they are not authorized.
   */
  unauthorizedUrl?: string;
  /**
   * The URL to redirect the user to if they are not authenticated.
   */
  unauthenticatedUrl?: string;
};

export interface AuthProtect {
  (
    params?: (require: CheckAuthorizationFromSessionClaims) => boolean,
    options?: AuthProtectOptions
  ): Promise<SignedInAuthObject>;
  (options?: AuthProtectOptions): Promise<SignedInAuthObject>;
}

export function createProtect(opts: {
  request: Request;
  authObject: AuthObject;
  notFound: () => never;
  redirect: (url: string) => void;
  redirectToSignIn: RedirectFun<unknown>;
}): AuthProtect {
  const { redirectToSignIn, authObject, redirect, notFound, request } = opts;

  return (async (...args: any[]) => {
    const optionValuesAsParam =
      args[0]?.unauthenticatedUrl || args[0]?.unauthorizedUrl;
    const paramsOrFunction = optionValuesAsParam ? undefined : (args[0] as 
      | CheckAuthorizationFromSessionClaims
      | ((require: CheckAuthorizationFromSessionClaims) => boolean));
    const unauthenticatedUrl = (args[0]?.unauthenticatedUrl ||
      args[1]?.unauthenticatedUrl) as string | undefined;
    const unauthorizedUrl = (args[0]?.unauthorizedUrl ||
      args[1]?.unauthorizedUrl) as string | undefined;

    const handleUnauthenticated = () => {
      if (unauthenticatedUrl) {
        redirect(unauthenticatedUrl);
      }
      if (isPageRequest(request)) {
        return redirectToSignIn();
      }
      return notFound();
    };

    const handleUnauthorized = () => {
      if (unauthorizedUrl) {
        redirect(unauthorizedUrl);
      }
      notFound();
    };

    if (!authObject.userId) {
      handleUnauthenticated();
    }

    if (!paramsOrFunction) {
      return authObject;
    }

    if (typeof paramsOrFunction === "function") {
      if (paramsOrFunction(authObject.require)) {
        return authObject;
      }
      return handleUnauthorized();
    }

    if (authObject.require(paramsOrFunction)) {
      return authObject;
    }
  }) as AuthProtect;
}

const isServerActionRequest = (req: Request) => {
  return (
    !!req.headers.get(nextConstants.Headers.NextUrl) &&
    (req.headers.get(constants.Headers.Accept)?.includes("text/x-component") ||
      req.headers
        .get(constants.Headers.ContentType)
        ?.includes("multipart/form-data") ||
      !!req.headers.get(nextConstants.Headers.NextAction))
  );
};

const isPageRequest = (req: Request): boolean => {
  return (
    req.headers.get(constants.Headers.SecFetchDest) === "document" ||
    req.headers.get(constants.Headers.SecFetchDest) === "iframe" ||
    req.headers.get(constants.Headers.Accept)?.includes("text/html") ||
    isAppRouterInternalNavigation(req) ||
    isPagesRouterInternalNavigation(req)
  );
};

const isAppRouterInternalNavigation = (req: Request) =>
  (!!req.headers.get(nextConstants.Headers.NextUrl) &&
    !isServerActionRequest(req)) ||
  isPagePathAvailable();

const isPagePathAvailable = () => {
  const __fetch = globalThis.fetch;

  if (!isNextFetcher(__fetch)) {
    return false;
  }

  const { page, pagePath } = __fetch.__nextGetStaticStore().getStore() || {};

  return Boolean(
    // available on next@14
    pagePath ||
      // available on next@15
      page
  );
};

const isPagesRouterInternalNavigation = (req: Request) =>
  !!req.headers.get(nextConstants.Headers.NextjsData);

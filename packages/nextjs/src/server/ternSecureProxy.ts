import type {
  AuthenticateRequestOptions,
  AuthObject,
  RedirectFun,
  RequestState,
  TernSecureRequest,
} from "@tern-secure-node/backend";
import {
  constants,
  createRedirect,
  createTernSecureRequest,
} from "@tern-secure-node/backend";
import { notFound as nextjsNotFound } from "next/navigation";
import type { NextProxy, NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isRedirect, setHeader } from "../utils/response";
import { serverRedirectWithAuth } from "../utils/serverRedirectAuth";
import { SIGN_IN_URL, SIGN_UP_URL } from "./constant";
import {
  isNextjsNotFoundError,
  isNextjsRedirectError,
  isRedirectToSignInError,
  isRedirectToSignUpError,
  nextjsRedirectError,
  redirectToSignInError,
  redirectToSignUpError,
} from "./nextErrors";
import { type AuthProtect, createProtect } from "./protect";
import { ternSecureBackendClient } from "./ternsecureClient";
import type {
  NextMiddlewareEvtParam,
  NextMiddlewareRequestParam,
  NextMiddlewareReturn,
} from "./types";
import { decorateRequest } from "./utils";

export type MiddlewareAuthObject = AuthObject & {
  redirectToSignIn: RedirectFun<Response>;
  redirectToSignUp: RedirectFun<Response>;
};

export interface MiddlewareAuth {
  (): Promise<MiddlewareAuthObject>;

  protect: AuthProtect;
}

type MiddlewareHandler = (
  auth: MiddlewareAuth,
  request: NextMiddlewareRequestParam,
  event: NextMiddlewareEvtParam
) => NextMiddlewareReturn;

export interface MiddlewareOptions extends AuthenticateRequestOptions {
  debug?: boolean;
}
type MiddlewareOptionsCallback = (
  req: NextRequest
) => MiddlewareOptions | Promise<MiddlewareOptions>;

interface TernSecureMiddleware {
  /**
   * @example
   * export default ternSecureMiddleware((auth, request, event) => { ... }, options);
   */
  (handler: MiddlewareHandler, options?: MiddlewareOptions): NextProxy;

  /**
   * @example
   * export default ternSecureMiddleware((auth, request, event) => { ... }, (req) => options);
   */
  (handler: MiddlewareHandler, options?: MiddlewareOptionsCallback): NextProxy;

  /**
   * @example
   * export default ternSecureMiddleware(options);
   */
  (options?: MiddlewareOptions): NextProxy;
  /**
   * @example
   * export default ternSecureMiddleware;
   */
  (
    request: NextMiddlewareRequestParam,
    event: NextMiddlewareEvtParam
  ): NextMiddlewareReturn;
}

export const ternSecureProxy = ((
  ...args: unknown[]
): NextProxy | NextMiddlewareReturn => {
  const [request, event] = parseRequestAndEvent(args);
  const [handler, params] = parseHandlerAndOptions(args);

  const middleware = () => {
    const withAuthNextMiddleware: NextProxy = async (request, event) => {
      const resolvedParams =
        typeof params === "function" ? await params(request) : params;

      const signInUrl = resolvedParams.signInUrl || SIGN_IN_URL;
      const signUpUrl = resolvedParams.signUpUrl || SIGN_UP_URL;

      const options = {
        signInUrl,
        signUpUrl,
        ...resolvedParams,
      };

      const reqBackendClient = await ternSecureBackendClient();

      const ternSecureRequest = createTernSecureRequest(request);

      const requestStateClient = await reqBackendClient.authenticateRequest(
        ternSecureRequest,
        options
      );


      const authObjectClient = requestStateClient.auth();

      const { redirectToSignIn } = createMiddlewareRedirects(ternSecureRequest);

      const { redirectToSignUp } = createMiddlewareRedirects(ternSecureRequest);

      const protect = await createMiddlewareProtect(
        ternSecureRequest,
        authObjectClient,
        redirectToSignIn
      );

      const authObj: MiddlewareAuthObject = Object.assign(authObjectClient, {
        redirectToSignIn,
        redirectToSignUp,
      });

      const authHandler = () => Promise.resolve(authObj);
      authHandler.protect = protect;

      let handlerResult: Response = NextResponse.next();

      try {
        const userHandlerResult = await handler?.(authHandler, request, event);
        handlerResult = userHandlerResult || handlerResult;
      } catch (error: any) {
        handlerResult = handleControlError(
          error,
          ternSecureRequest,
          request,
          requestStateClient
        );
      }

      if (requestStateClient.headers) {
        requestStateClient.headers.forEach((value, key) => {
          handlerResult.headers.append(key, value);
        });
      }

      if (isRedirect(handlerResult)) {
        return serverRedirectWithAuth(ternSecureRequest, handlerResult);
      }

      decorateRequest(ternSecureRequest, handlerResult, requestStateClient);
      return handlerResult;
    };

    const nextMiddleware: NextProxy = async (request, event) => {
      return withAuthNextMiddleware(request, event);
    };

    if (request && event) {
      return nextMiddleware(request, event);
    }
    return nextMiddleware;
  };
  return middleware();
}) as TernSecureMiddleware;

const parseRequestAndEvent = (args: unknown[]) => {
  return [
    args[0] instanceof Request ? args[0] : undefined,
    args[0] instanceof Request ? args[1] : undefined,
  ] as [
      NextMiddlewareRequestParam | undefined,
      NextMiddlewareEvtParam | undefined,
    ];
};

const parseHandlerAndOptions = (args: unknown[]) => {
  return [
    typeof args[0] === "function" ? args[0] : undefined,
    (args.length === 2
      ? args[1]
      : typeof args[0] === "function"
        ? {}
        : args[0]) || {},
  ] as [
      MiddlewareHandler | undefined,
      MiddlewareOptions | MiddlewareOptionsCallback,
    ];
};

/**
 * Create middleware redirect functions
 */
const createMiddlewareRedirects = (ternSecureRequest: TernSecureRequest) => {
  const redirectToSignIn: MiddlewareAuthObject["redirectToSignIn"] = (
    opts = {}
  ) => {
    const url = ternSecureRequest.ternUrl.toString();
    redirectToSignInError(url, opts.returnBackUrl);
  };

  const redirectToSignUp: MiddlewareAuthObject["redirectToSignUp"] = (
    opts = {}
  ) => {
    const url = ternSecureRequest.ternUrl.toString();
    redirectToSignUpError(url, opts.returnBackUrl);
  };

  return { redirectToSignIn, redirectToSignUp };
};

const createMiddlewareProtect = (
  ternSecureRequest: TernSecureRequest,
  authObject: AuthObject,
  redirectToSignIn: RedirectFun<Response>
) => {
  return (async (params: any, options: any) => {
    const notFound = () => nextjsNotFound();

    const redirect = (url: string) =>
      nextjsRedirectError(url, {
        redirectUrl: url,
      });

    return createProtect({
      request: ternSecureRequest,
      redirect,
      notFound,
      authObject,
      redirectToSignIn,
    })(params, options);
  }) as unknown as Promise<AuthProtect>;
};

export const redirectAdapter = (url: string | URL) => {
  return NextResponse.redirect(url, {
    headers: { [constants.Headers.TernSecureRedirectTo]: "true" },
  });
};

/**
 * Handle control flow errors in middleware
 */
const handleControlError = (
  error: any,
  ternSecureRequest: TernSecureRequest,
  nextrequest: NextRequest,
  requestState: RequestState
): Response => {
  if (isNextjsNotFoundError(error)) {
    return setHeader(
      NextResponse.rewrite(new URL(`/tern_${Date.now()}`, nextrequest.url)),
      constants.Headers.AuthReason,
      "protect-rewrite"
    );
  }

  const isRedirectToSignIn = isRedirectToSignInError(error);
  const isRedirectToSignUp = isRedirectToSignUpError(error);

  if (isRedirectToSignIn || isRedirectToSignUp) {
    const redirect = createRedirect({
      redirectAdapter,
      baseUrl: ternSecureRequest.ternUrl,
      signInUrl: requestState.signInUrl,
      signUpUrl: requestState.signUpUrl,
    });

    const { returnBackUrl } = error;

    return redirect[
      isRedirectToSignIn ? "redirectToSignIn" : "redirectToSignUp"
    ]({
      returnBackUrl,
    });
  }

  if (isNextjsRedirectError(error)) {
    return redirectAdapter(error.redirectUrl);
  }

  throw error;
};

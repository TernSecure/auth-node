import type {
  RequestState,
  TernSecureRequest,
} from "@tern-secure-node/backend";
import { constants } from "@tern-secure-node/backend";
import { NextRequest,NextResponse } from 'next/server';

import { constants as nextConstants } from "../constants";

const OVERRIDE_HEADERS = 'x-middleware-override-headers';
const MIDDLEWARE_HEADER_PREFIX = 'x-middleware-request' as string;



export const setRequestHeadersOnNextResponse = (
  res: NextResponse | Response,
  req: Request,
  newHeaders: Record<string, string>,
) => {
  if (!res.headers.get(OVERRIDE_HEADERS)) {
    // Emulate a user setting overrides by explicitly adding the required nextjs headers
    // https://github.com/vercel/next.js/pull/41380
    // @ts-expect-error -- property keys does not exist on type Headers
    res.headers.set(OVERRIDE_HEADERS, [...req.headers.keys()]);
    req.headers.forEach((val, key) => {
      res.headers.set(`${MIDDLEWARE_HEADER_PREFIX}-${key}`, val);
    });
  }

  // Now that we have normalised res to include overrides, just append the new header
  Object.entries(newHeaders).forEach(([key, val]) => {
    res.headers.set(OVERRIDE_HEADERS, `${res.headers.get(OVERRIDE_HEADERS)},${key}`);
    res.headers.set(`${MIDDLEWARE_HEADER_PREFIX}-${key}`, val);
  });
};

export function decorateRequest(
  req: TernSecureRequest,
  res: Response,
  requestState: RequestState,
): Response {
  const { reason, token, status } = requestState;
  // pass-through case, convert to next()
  if (!res) {
    res = NextResponse.next();
  }

  // redirect() case, return early
  if (res.headers.get(nextConstants.Headers.NextRedirect)) {
    return res;
  }

  let rewriteURL;

  // next() case, convert to a rewrite
  if (res.headers.get(nextConstants.Headers.NextResume) === '1') {
    res.headers.delete(nextConstants.Headers.NextResume);
    rewriteURL = new URL(req.url);
  }

  // rewrite() case, set auth result only if origin remains the same
  const rewriteURLHeader = res.headers.get(nextConstants.Headers.NextRewrite);

  if (rewriteURLHeader) {
    const reqURL = new URL(req.url);
    rewriteURL = new URL(rewriteURLHeader);

    // if the origin has changed, return early
    if (rewriteURL.origin !== reqURL.origin) {
      return res;
    }
  }

  if (rewriteURL) {
    setRequestHeadersOnNextResponse(res, req, {
      [constants.Headers.AuthStatus]: status,
      [constants.Headers.AuthToken]: token || '',
      [constants.Headers.AuthReason]: reason || '',
      [constants.Headers.TernSecureUrl]: req.ternUrl.toString(),
    });
    res.headers.set(nextConstants.Headers.NextRewrite, rewriteURL.href);
  }

  return res;
}


export const isPrerenderingBailout = (e: unknown) => {
  if (!(e instanceof Error) || !('message' in e)) {
    return false;
  }

  const { message } = e;

  const lowerCaseInput = message.toLowerCase();
  const dynamicServerUsage = lowerCaseInput.includes('dynamic server usage');
  const bailOutPrerendering = lowerCaseInput.includes('this page needs to bail out of prerendering');

  // note: new error message syntax introduced in next@14.1.1-canary.21
  // but we still want to support older versions.
  // https://github.com/vercel/next.js/pull/61332 (dynamic-rendering.ts:153)
  const routeRegex = /Route .*? needs to bail out of prerendering at this point because it used .*?./;

  return routeRegex.test(message) || dynamicServerUsage || bailOutPrerendering;
};

export async function buildRequestLike(): Promise<NextRequest> {
  try {
    // Dynamically import next/headers, otherwise Next12 apps will break
    // @ts-expect-error: Cannot find module 'next/headers' or its corresponding type declarations.ts(2307)
    const { headers } = await import('next/headers');
    const resolvedHeaders = await headers();
    return new NextRequest('https://placeholder.com', { headers: resolvedHeaders });
  } catch (e: any) {
    // rethrow the error when react throws a prerendering bailout
    // https://nextjs.org/docs/messages/ppr-caught-error
    if (e && isPrerenderingBailout(e)) {
      throw e;
    }

    throw new Error(
      `Clerk: auth(), currentUser() and clerkClient(), are only supported in App Router (/app directory).\nIf you're using /pages, try getAuth() instead.\nOriginal error: ${e}`,
    );
  }
}

// Original source: https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/get-script-nonce-from-header.tsx
export function getScriptNonceFromHeader(cspHeaderValue: string): string | undefined {
  const directives = cspHeaderValue
    // Directives are split by ';'.
    .split(';')
    .map(directive => directive.trim());

  // First try to find the directive for the 'script-src', otherwise try to
  // fallback to the 'default-src'.
  const directive =
    directives.find(dir => dir.startsWith('script-src')) || directives.find(dir => dir.startsWith('default-src'));

  // If no directive could be found, then we're done.
  if (!directive) {
    return;
  }

  // Extract the nonce from the directive
  const nonce = directive
    .split(' ')
    // Remove the 'strict-src'/'default-src' string, this can't be the nonce.
    .slice(1)
    .map(source => source.trim())
    // Find the first source with the 'nonce-' prefix.
    .find(source => source.startsWith("'nonce-") && source.length > 8 && source.endsWith("'"))
    // Grab the nonce by trimming the 'nonce-' prefix.
    ?.slice(7, -1);

  // If we couldn't find the nonce, then we're done.
  if (!nonce) {
    return;
  }

  // Don't accept the nonce value if it contains HTML escape characters.
  // Technically, the spec requires a base64'd value, but this is just an
  // extra layer.
  if (/[&><\u2028\u2029]/g.test(nonce)) {
    throw new Error(
      'Nonce value from Content-Security-Policy contained invalid HTML escape characters, which is disallowed for security reasons. Make sure that your nonce value does not contain the following characters: `<`, `>`, `&`',
    );
  }

  return nonce;
}

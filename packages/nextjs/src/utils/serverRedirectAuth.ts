import type {
  TernSecureRequest,
} from "@tern-secure/backend";
import {
  constants
} from "@tern-secure/backend";
import { NextResponse } from 'next/server';

/**
 * Grabs the dev browser JWT from cookies and appends it to the redirect URL when redirecting to cross-origin.
 */
export const serverRedirectWithAuth = (ternSecureRequest: TernSecureRequest, res: Response) => {
  const location = res.headers.get('location');
  const shouldAppendDevBrowser = res.headers.get(constants.Headers.TernSecureRedirectTo) === 'true';

  if (
    shouldAppendDevBrowser &&
    !!location &&
    ternSecureRequest.ternUrl.isCrossOrigin(location)
  ) {
    // Next.js 12.1+ allows redirects only to absolute URLs
    const url = new URL(location);
    return NextResponse.redirect(url.href, res);
  }
  return res;
};

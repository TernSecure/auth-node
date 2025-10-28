const buildUrl = (
  _baseUrl: string | URL,
  _targetUrl: string | URL,
  _returnBackUrl?: string | URL | null,
) => {
  if (_baseUrl === '') {
    return legacyBuildUrl(_targetUrl.toString(), _returnBackUrl?.toString());
  }

  const baseUrl = new URL(_baseUrl);
  const returnBackUrl = _returnBackUrl ? new URL(_returnBackUrl, baseUrl) : undefined;
  const res = new URL(_targetUrl, baseUrl);

  if (returnBackUrl) {
    res.searchParams.set('redirect_url', returnBackUrl.toString());
  }
  return res.toString();
};

const legacyBuildUrl = (targetUrl: string, redirectUrl?: string) => {
  let url;
  if (!targetUrl.startsWith('http')) {
    if (!redirectUrl || !redirectUrl.startsWith('http')) {
      throw new Error('destination url or return back url should be an absolute path url!');
    }

    const baseURL = new URL(redirectUrl);
    url = new URL(targetUrl, baseURL.origin);
  } else {
    url = new URL(targetUrl);
  }

  if (redirectUrl) {
    url.searchParams.set('redirect_url', redirectUrl);
  }

  return url.toString();
};

type RedirectAdapter<RedirectReturn> = (url: string) => RedirectReturn;
type RedirectToParams = { returnBackUrl?: string | URL | null };
export type RedirectFun<ReturnType> = (params?: RedirectToParams) => ReturnType;

/**
 * @internal
 */
type CreateRedirect = <ReturnType>(params: {
  redirectAdapter: RedirectAdapter<ReturnType>;
  baseUrl: URL | string;
  signInUrl?: URL | string;
  signUpUrl?: URL | string;
}) => {
  redirectToSignIn: RedirectFun<ReturnType>;
  redirectToSignUp: RedirectFun<ReturnType>;
};

export const createRedirect: CreateRedirect = params => {
  const { redirectAdapter, signInUrl, signUpUrl, baseUrl } = params;

  const redirectToSignUp = ({ returnBackUrl }: RedirectToParams = {}) => {
    if (!signUpUrl) {
      throw new Error('SignUp URL is not defined');
    }

    const pathToSignUpUrl = `${baseUrl}/sign-up`;

    function buildSignUpUrl(signIn: string | URL | undefined) {
      if (!signIn) {
        return;
      }
      const url = new URL(signIn, baseUrl);
      url.pathname = `${url.pathname}/create`;
      return url.toString();
    }

    const targetUrl = signUpUrl || buildSignUpUrl(signInUrl) || pathToSignUpUrl;

    return redirectAdapter(buildUrl(baseUrl, targetUrl, returnBackUrl));
  };

  const redirectToSignIn = ({ returnBackUrl }: RedirectToParams = {}) => {
    if (!signInUrl) {
      throw new Error('SignIn URL is not defined');
    }

    const pathToSignInUrl = `${baseUrl}/sign-in`;
    const targetUrl = signInUrl || pathToSignInUrl;

    return redirectAdapter(buildUrl(baseUrl, targetUrl, returnBackUrl));
  };

  return { redirectToSignUp, redirectToSignIn };
};

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const originalFetch = global.fetch;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const urlObj = new URL(url);

      if (urlObj.hostname === "identitytoolkit.googleapis.com") {
        const referer = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const modifiedInit = {
          ...init,
          headers: {
            ...(init?.headers || {}),
            Referer: referer,
          },
        };
        return originalFetch(input, modifiedInit);
      }
      return originalFetch(input, init);
    };
  }
}
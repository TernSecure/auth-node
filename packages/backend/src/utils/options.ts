import type { AuthenticateRequestOptions} from "../tokens/types";

export type RuntimeOptions = Omit<AuthenticateRequestOptions, "apiUrl">;

export type buildTimeOptions = Partial<Pick<AuthenticateRequestOptions, "apiKey" | "apiUrl" | "apiVersion">>;

const defaultOptions: buildTimeOptions = {
  apiKey: undefined,
  apiUrl: undefined,
  apiVersion: undefined,
};

export function mergePreDefinedOptions(
  userOptions: buildTimeOptions = {}
): buildTimeOptions {
  return {
    ...defaultOptions,
    ...userOptions,
  };
}
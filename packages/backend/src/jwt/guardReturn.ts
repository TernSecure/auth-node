import { type JwtReturnType } from "./types";

export function createJwtGuard<T extends (...args: any[]) => JwtReturnType<any, any>>(decodedFn: T) {
  return (...args: Parameters<T>): NonNullable<Awaited<ReturnType<T>>['data']> | never => {
    const { data, errors } = decodedFn(...args);

    if (errors) {
      throw errors[0];
    }

    return data;
  };
}

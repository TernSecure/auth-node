import { createJwtGuard } from './guardReturn';
import { ternDecodeJwt as _ternDecodeJwt } from './verifyJwt';

export const ternDecodeJwt = createJwtGuard(_ternDecodeJwt);
export { ternDecodeJwt as ternDecodeJwtUnguarded } from './verifyJwt';

export * from './jwt';
export * from './customJwt';
export type { JwtReturnType } from './types';
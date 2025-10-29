import { type TernSecureHandlerOptions } from '@tern-secure-node/nextjs/admin';

const authHandlerOptions: TernSecureHandlerOptions = {
  cors: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'https://ternsecure.com'],
    allowedMethods: ['GET', 'POST'],
  },
  cookies: {
    httpOnly: true,
    sameSite: 'strict',
    //maxAge: 5 * 60, // five minutes
    maxAge: 12 * 60 * 60 * 24, // twelve days
  },
  security: {
    allowedReferers: ['https://ternsecure.com'],
  },
  revokeRefreshTokensOnSignOut: true,
  debug: process.env.NODE_ENV === 'development',
};

export { authHandlerOptions };

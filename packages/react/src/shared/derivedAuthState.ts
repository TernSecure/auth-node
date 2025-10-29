import type {
  DecodedIdToken,
  SignedInSession,
  TernSecureResources,
  TernSecureUser,
} from '@tern-secure/types';


type TernSecureInitialState = {
  user?: TernSecureUser | null;
  token?: string | null;
  sessionClaims?: DecodedIdToken | null;
};

type DerivedAuthState = {
  userId: string | null | undefined;
  user: TernSecureUser | null | undefined;
  token?: string | null;
  session?: SignedInSession | null;
};

export const deriveAuthState = (
  ternSecureIsReady: boolean,
  authState: TernSecureResources,
  initialState: TernSecureInitialState | undefined,
): DerivedAuthState => {
  if (!authState.user && initialState) {
    return fromSsrInitialState(initialState);
  }
  return fromClientSideState(authState);
};

const fromSsrInitialState = (initialState: TernSecureInitialState) => {
  const userId = initialState.user ? initialState.user.uid : null;
  const token = initialState.token;
  const user = initialState.user as TernSecureUser;

  return {
    userId,
    token,
    user,
    session: undefined,
  };
};


const fromClientSideState = (authState: TernSecureResources) => {
  const userId: string | null | undefined = authState.user ? authState.user.uid : null;
  const user = authState.user;

  return {
    userId,
    user,
  };
};

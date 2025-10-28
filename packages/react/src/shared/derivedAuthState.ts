import type {
  SignedInSession,
  TernSecureResources,
  TernSecureStateExtended,
  TernSecureUser,
} from '@tern-secure/types';



type DerivedAuthState = {
  userId: string | null | undefined;
  user: TernSecureUser | null | undefined;
  token?: string | null;
  session?: SignedInSession | null;
};

export const deriveAuthState = (
  ternSecureIsReady: boolean,
  authState: TernSecureResources,
  initialState: TernSecureStateExtended | undefined,
): DerivedAuthState => {
  if (ternSecureIsReady && initialState) {
    return fromSsrInitialState(initialState);
  }
  return fromClientSideState(authState);
};

const fromSsrInitialState = (initialState: TernSecureStateExtended) => {
  const userId = initialState.userId;
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

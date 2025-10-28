import type { UseSignUpReturn } from '@tern-secure/types';

import { useAuthSignUpCtx } from '../ctx/TernSecureAuthResourcesCtx';
import { useAssertWrappedByTernSecureAuthProvider } from './useAssertWrappedTernSecureProvider';

export const useSignUp = (): UseSignUpReturn => {
  useAssertWrappedByTernSecureAuthProvider('useSignUp');
  const auth = useAuthSignUpCtx();

  if (!auth) {
    return {
      isLoaded: false,
      signUp: undefined,
    };
  }

  return {
    isLoaded: true,
    signUp: auth,
  };
};

import { 
    assertContextExists,
    TernSecureAuthCtx,
    useTernSecureAuthCtx
 } from "@tern-secure/shared/react"
import type {
    SignInResource,
    SignUpResource,
} from "@tern-secure/types"


export function useAuthSignInCtx(): SignInResource | undefined | null {
    const ctx = useTernSecureAuthCtx();
    assertContextExists(ctx, TernSecureAuthCtx)
    return ctx.signIn;
}

export function useAuthSignUpCtx(): SignUpResource | undefined | null {
    const ctx = useTernSecureAuthCtx();
    assertContextExists(ctx, TernSecureAuthCtx)
    return ctx.signUp;
}


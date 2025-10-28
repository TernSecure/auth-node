import {
    TernSecureAuthCtx,
    useTernSecureAuthCtx,
} from '@tern-secure/shared/react';

import type { IsoTernSecureAuth } from '../lib/isoTernSecureAuth';

export const IsoTernSecureAuthCtx = TernSecureAuthCtx;
export const useIsoTernSecureAuthCtx = useTernSecureAuthCtx as unknown as ()=> IsoTernSecureAuth;
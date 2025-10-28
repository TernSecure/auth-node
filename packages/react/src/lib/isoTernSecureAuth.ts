import { TernSecureAuth as TernSecureAuthImpl } from '@tern-secure/auth';
import { createTernAuthEventBus, ternEvents } from '@tern-secure/shared/ternStatusEvent';
import { handleValueOrFn } from '@tern-secure/shared/utils';
import type {
  CreateActiveSessionParams,
  DomainOrProxyUrl,
  ListenerCallback,
  SignedInSession,
  SignInRedirectOptions,
  SignInResource,
  SignOutOptions,
  SignUpRedirectOptions,
  SignUpResource,
  TernSecureAuth,
  TernSecureAuthOptions,
  TernSecureAuthStatus,
  UnsubscribeCallback,
} from '@tern-secure/types';

import type { IsoTernSecureAuthOptions, TernSecureAuthProps } from '../types';

const SDK_METADATA = {
  name: __PACKAGE_NAME__,
  version: __PACKAGE_VERSION__,
  environment: process.env.NODE_ENV,
};

export function inBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * IsomorphicTernSecure class manages the auth state and UI rendering
 * in both browser and server environments, acting as a proxy for TernSecureAuth
 */
export class IsoTernSecureAuth implements TernSecureAuth {
  private readonly _mode: 'browser' | 'server';
  private readonly options: IsoTernSecureAuthOptions;
  private readonly TernSecureAuth: TernSecureAuthProps;
  private ternauth: TernSecureAuthProps | null = null;
  private preAddListener = new Map<ListenerCallback, { unsubscribe: UnsubscribeCallback }>();

  #status: TernSecureAuthStatus = 'loading';
  #apiUrl: string | undefined;
  #domain: DomainOrProxyUrl['domain'];
  #proxyUrl: DomainOrProxyUrl['proxyUrl'];
  #eventBus = createTernAuthEventBus();

  static #instance: IsoTernSecureAuth | null | undefined;

  get status(): TernSecureAuthStatus {
    if (!this.ternauth) {
      return this.#status;
    }
    return this.ternauth.status || (this.ternauth.isReady ? 'ready' : 'loading');
  }

  get isReady(): boolean {
    return this.ternauth?.isReady || false;
  }

  get isLoading(): boolean {
    return this.ternauth?.isLoading || false;
  }

  get requiresVerification(): boolean {
    return this.options.requiresVerification ?? true;
  }

  get signIn(): SignInResource | undefined {
    if (this.ternauth) {
      return this.ternauth.signIn || undefined;
    }
    return undefined;
  }

  get signUp(): SignUpResource | undefined {
    if (this.ternauth) {
      return this.ternauth.signUp || undefined;
    }
    return undefined;
  }

  get user() {
    if (this.ternauth) {
      return this.ternauth.user;
    }
    return null;
  }

  static getOrCreateInstance(options: IsoTernSecureAuthOptions) {
    if (
      !inBrowser() ||
      !this.#instance ||
      (options.TernSecureAuth && this.#instance.TernSecureAuth !== options.TernSecureAuth)
    ) {
      this.#instance = new IsoTernSecureAuth(options);
    }
    return this.#instance;
  }

  static clearInstances() {
    if (this.#instance) {
      this.#instance.ternauth = null;
      this.#instance = null;
    }
  }

  static clearInstance() {
    this.#instance = null;
  }

  get domain(): string {
    if (typeof window !== 'undefined' && window.location) {
      return handleValueOrFn(this.#domain, new URL(window.location.href), '');
    }
    if (typeof this.#domain === 'function') {
      throw new Error('Unsupported customDomain type: function');
    }
    return this.#domain || '';
  }

  get proxyUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      return handleValueOrFn(this.#proxyUrl, new URL(window.location.href), '');
    }
    if (typeof this.#proxyUrl === 'function') {
      throw new Error('Unsupported customProxyUrl type: function');
    }
    return this.#proxyUrl || '';
  }

  get mode(): 'browser' | 'server' {
    return this._mode;
  }

  /**
   * @internal
   */
  public _internal_getOption<K extends keyof TernSecureAuthOptions>(
    key: K,
  ): TernSecureAuthOptions[K] | undefined {
    return this.ternauth?._internal_getOption
      ? this.ternauth?._internal_getOption(key)
      : this.options[key];
  }

  /**
   * @internal
   */
  public _internal_getAllOptions(): Readonly<TernSecureAuthOptions> {
    return Object.freeze({ ...this.options });
  }

  constructor(options: IsoTernSecureAuthOptions) {
    const { TernSecureAuth = null } = options || {};
    this.#domain = options.ternSecureConfig?.authDomain;
    this.options = { ...options };
    this._mode = inBrowser() ? 'browser' : 'server';
    this.#apiUrl = this.options.apiUrl;
    this.TernSecureAuth = TernSecureAuth;

    if (!this.options.sdkMetadata) {
      this.options.sdkMetadata = SDK_METADATA;
    }
  }

  get sdkMetadata() {
    return this.ternauth?.sdkMetadata || this.options.sdkMetadata;
  }

  get version() {
    return this.ternauth?.version;
  }

  get instanceType() {
    return this.ternauth?.instanceType;
  }

  get apiUrl() {
    return this.#apiUrl || '';
  }

  initTernSecureAuth() {
    if (this._mode !== 'browser' || this.isReady) {
      return;
    }

    const tern = TernSecureAuthImpl.initialize(this.options);
    this.loadTernSecureAuth(tern);
  }

  private loadTernSecureAuth = (ternauth: TernSecureAuthProps | undefined) => {
    if (!ternauth) {
      throw new Error('TernAuth instance is not initialized');
    }

    this.ternauth = ternauth;
    this.preAddListener.forEach((listenerHandlers, listener) => {
      listenerHandlers.unsubscribe = ternauth.addListener(listener);
    });

    this.#eventBus.getListeners('status').forEach(listener => {
      this.on('status', listener, { notify: true });
    });

    if (typeof this.ternauth.status === 'undefined') {
      console.log(
        '[IsoTernSecureAuth] TernSecureAuth has no status, setting internal status to ready',
      );
      this.#status = 'ready';
      this.#eventBus.emit(ternEvents.Status, 'ready');
    }

    return this.ternauth;
  };

  public on: TernSecureAuth['on'] = (...args) => {
    if (this.ternauth?.on) {
      return this.ternauth.on(...args);
    } else {
      return this.#eventBus.on(...args);
    }
  };

  public off: TernSecureAuth['off'] = (...args) => {
    if (this.ternauth?.off) {
      return this.ternauth.off(...args);
    } else {
      return this.#eventBus.off(...args);
    }
  };

  addListener = (listener: ListenerCallback): UnsubscribeCallback => {
    if (this.ternauth) {
      return this.ternauth.addListener(listener);
    } else {
      const unsubscribe = () => {
        const listenerHandlers = this.preAddListener.get(listener);
        if (listenerHandlers) {
          listenerHandlers.unsubscribe();
          this.preAddListener.delete(listener);
        }
      };
      this.preAddListener.set(listener, { unsubscribe });
      return unsubscribe;
    }
  };

  createActiveSession = (params: CreateActiveSessionParams): Promise<void> => {
    if (this.ternauth) {
      return this.ternauth.createActiveSession(params);
    } else {
      return Promise.reject(new Error('TernSecureAuth not initialized'));
    }
  };

  signOut = async (options?: SignOutOptions): Promise<void> => {
    if (!this.ternauth) {
      throw new Error('TernSecureAuth not initialized');
    }
    await this.ternauth.signOut();
  };

  get currentSession(): SignedInSession | null {
    if (!this.ternauth) {
      return null;
    }
    return this.ternauth.currentSession;
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    if (!this.ternauth) {
      console.warn(
        '[IsoTernSecureAuth] TernAuth not initialized, cannot set up auth state listener',
      );
      return () => {};
    }
    return this.ternauth.onAuthStateChanged(callback);
  }

  getRedirectResult = async (): Promise<any> => {
    if (!this.ternauth?.getRedirectResult) {
      throw new Error('TernSecure instance not initialized');
    }
    return this.ternauth.getRedirectResult();
  };

  constructUrlWithAuthRedirect = (to: string): string => {
    if (this.ternauth && this.isReady) {
      return this.ternauth.constructUrlWithAuthRedirect(to);
    }
    return '';
  };

  navigate = (to: string) => {
    if (this.ternauth && this.isReady) {
      this.ternauth.navigate(to);
    }
  };

  redirectToSignIn = async (options?: SignInRedirectOptions) => {
    if (this.ternauth?.redirectToSignIn) {
      this.ternauth.redirectToSignIn(options);
    }
  };

  redirectToSignUp = async (options?: SignUpRedirectOptions) => {
    if (this.ternauth?.redirectToSignUp) {
      this.ternauth.redirectToSignUp();
    }
  };

  redirectAfterSignIn = (redirectUrl?: string): void => {
    if (this.ternauth?.redirectAfterSignIn) {
      this.ternauth.redirectAfterSignIn();
    }
  };

  redirectAfterSignUp = (redirectUrl?: string): void => {
    if (this.ternauth?.redirectAfterSignUp) {
      this.ternauth.redirectAfterSignUp();
    }
  };

  #awaitForTernSecureAuth(): Promise<TernSecureAuthProps> {
    return new Promise<TernSecureAuthProps>(resolve => {
      resolve(this.ternauth);
    });
  }

  initialize = async (): Promise<void> => {
    this.initTernSecureAuth();
    try {
      await this.#awaitForTernSecureAuth();
    } catch (error) {
      console.error('[IsomorphicTernSecure] Failed to initialize TernSecureAuth:', error);
      throw error;
    }
  };
}

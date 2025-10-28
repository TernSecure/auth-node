import type { NextRequest } from 'next/server';

/**
 * HTTP utilities
 */
export class HttpUtils {
  /**
   * Extract client IP address from various headers
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIP || clientIP || 'unknown';
  }

  /**
   * Parse URL path segments for routing
   */
  static parsePathSegments(url: URL): string[] {
    return url.pathname.split('/').filter(Boolean);
  }

  /**
   * Extract authentication headers
   */
  static extractAuthHeaders(request: NextRequest) {
    return {
      origin: request.headers.get('origin'),
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent') || '',
      authorization: request.headers.get('authorization'),
      xRequestedWith: request.headers.get('x-requested-with'),
    };
  }
}

/**
 * Configuration utilities
 */
export class ConfigUtils {
  /**
   * Deep merge handler options with defaults
   */
  static mergeWithDefaults(
    defaults: any,
    options?: any
  ): any {
    if (!options) return defaults;

    const result = { ...defaults };
    
    for (const key in options) {
      const value = options[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.mergeWithDefaults(defaults[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

/**
 * Cookie utilities
 */
export class CookieUtils {
  static extractSessionCookies(request: NextRequest) {
    return {
      sessionCookie: request.cookies.get('_session_cookie')?.value,
      csrfCookie: request.cookies.get('_session_terncf')?.value,
      mainSession: request.cookies.get('__session')?.value,
    };
  }
}

/**
 * Logging utilities for debugging
 */
export class LoggingUtils {
  static logRequest(request: NextRequest, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TernSecure${context ? ` ${context}` : ''}] ${request.method} ${request.url}`);
    }
  }

  static logError(error: any, context?: string) {
    console.error(`[TernSecure${context ? ` ${context}` : ''} Error]`, error);
  }

  static logWarning(message: string, context?: string) {
    console.warn(`[TernSecure${context ? ` ${context}` : ''} Warning]`, message);
  }
}
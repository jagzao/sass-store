/**
 * Cache Headers Utility - SEC-011 Security Fix
 * 
 * Provides functions to add security-compliant cache headers
 * to API responses containing sensitive data.
 * 
 * Headers applied:
 * - Cache-Control: private, no-store, max-age=0, must-revalidate
 * - Pragma: no-cache
 * - Expires: 0
 */

import { NextResponse } from 'next/server';

/**
 * Cache header constants for sensitive API responses
 */
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

/**
 * Headers for responses that can be cached privately (e.g., user-specific but not sensitive)
 */
export const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60, stale-while-revalidate=30',
} as const;

/**
 * Headers for public static assets that can be cached
 */
export const PUBLIC_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
} as const;

/**
 * Apply no-cache headers to a NextResponse object
 * 
 * @param response - The NextResponse to modify
 * @returns The same response with no-cache headers added
 * 
 * @example
 * ```typescript
 * const response = NextResponse.json({ user: userData });
 * return withNoCache(response);
 * ```
 */
export function withNoCache<T extends NextResponse>(response: T): T {
  // Clone headers to avoid mutation
  Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a JSON response with no-cache headers pre-applied
 * 
 * @param data - Data to serialize as JSON
 * @param init - Additional response options (status, etc.)
 * @returns NextResponse with JSON body and no-cache headers
 * 
 * @example
 * ```typescript
 * return noCacheJson({ user: userData }, { status: 200 });
 * ```
 */
export function noCacheJson(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...init?.headers,
      ...NO_CACHE_HEADERS,
    },
  });
}

/**
 * Create an error response with no-cache headers
 * 
 * @param error - Error object or message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error JSON and no-cache headers
 * 
 * @example
 * ```typescript
 * return noCacheError(new Error('Unauthorized'), 401);
 * ```
 */
export function noCacheError(error: Error | string, status = 500): NextResponse {
  const message = typeof error === 'string' ? error : error.message;
  return noCacheJson(
    { 
      success: false, 
      error: message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Check if a request path should have no-cache headers
 * 
 * @param pathname - The request pathname
 * @returns true if the path contains sensitive data
 */
export function shouldHaveNoCache(pathname: string): boolean {
  const SENSITIVE_PATTERNS = [
    /\/api\/auth\//,           // Authentication endpoints
    /\/api\/users\//,          // User data
    /\/api\/tenants\//,        // Tenant data
    /\/api\/customers\//,      // Customer PII
    /\/api\/finance\//,        // Financial data
    /\/api\/profile/,          // User profile
    /\/api\/inventory\//,      // Business inventory
    /\/api\/advances\//,       // Financial advances
    /\/api\/visits\//,         // Customer visits
    /\/api\/retouch\//,        // Customer retouch data
    /\/api\/v1\/social\//,     // Social media data
    /\/api\/upload/,           // Uploaded files metadata
  ];

  return SENSITIVE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Middleware helper to add no-cache headers to sensitive API responses
 * 
 * @param request - The incoming request
 * @param response - The response to modify
 * @returns The response with appropriate cache headers
 */
export function applyCacheHeaders(
  request: { nextUrl: { pathname: string } },
  response: NextResponse
): NextResponse {
  if (shouldHaveNoCache(request.nextUrl.pathname)) {
    return withNoCache(response);
  }
  return response;
}

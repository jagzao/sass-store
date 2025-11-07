/**
 * CSRF Token utilities for protecting against Cross-Site Request Forgery attacks
 * Uses Web Crypto API for Edge Runtime compatibility
 */

/**
 * Generate a cryptographically secure CSRF token
 * @returns A random 32-byte token as hex string
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Hash a CSRF token for storage
 * @param token The raw CSRF token
 * @returns SHA-256 hash of the token
 */
export async function hashCsrfToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Synchronous version of hashCsrfToken for backward compatibility
 * Note: This uses a simpler hash for environments that don't support async
 * @param token The raw CSRF token
 * @returns Simple hash of the token
 */
export function hashCsrfTokenSync(token: string): string {
  // Simple hash for backward compatibility in sync contexts
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Validate a CSRF token against a hash
 * @param token The token to validate
 * @param hash The expected hash
 * @returns True if the token matches the hash
 */
export async function validateCsrfToken(
  token: string,
  hash: string,
): Promise<boolean> {
  if (!token || !hash) {
    return false;
  }

  const tokenHash = await hashCsrfToken(token);

  // Use timing-safe comparison to prevent timing attacks
  if (tokenHash.length !== hash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < tokenHash.length; i++) {
    result |= tokenHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF token cookie name
 */
export const CSRF_COOKIE_NAME = "csrf-token";

/**
 * CSRF token header name
 */
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Methods that require CSRF protection
 */
export const CSRF_PROTECTED_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

/**
 * Paths that are exempt from CSRF protection
 * (e.g., public APIs, webhooks)
 */
export const CSRF_EXEMPT_PATHS = [
  "/api/payments/webhook",
  "/api/mercadopago/callback",
  "/api/auth/signin",
  "/api/auth/callback",
];

/**
 * Check if a path is exempt from CSRF protection
 * @param path The request path
 * @returns True if the path is exempt
 */
export function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt));
}

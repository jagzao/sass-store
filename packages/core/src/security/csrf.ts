import crypto from 'crypto';

/**
 * CSRF Token utilities for protecting against Cross-Site Request Forgery attacks
 */

/**
 * Generate a cryptographically secure CSRF token
 * @returns A random 32-byte token as hex string
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a CSRF token for storage
 * @param token The raw CSRF token
 * @returns SHA-256 hash of the token
 */
export function hashCsrfToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validate a CSRF token against a hash
 * @param token The token to validate
 * @param hash The expected hash
 * @returns True if the token matches the hash
 */
export function validateCsrfToken(token: string, hash: string): boolean {
  if (!token || !hash) {
    return false;
  }

  const tokenHash = hashCsrfToken(token);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * CSRF token cookie name
 */
export const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * CSRF token header name
 */
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Methods that require CSRF protection
 */
export const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Paths that are exempt from CSRF protection
 * (e.g., public APIs, webhooks)
 */
export const CSRF_EXEMPT_PATHS = [
  '/api/payments/webhook',
  '/api/mercadopago/callback',
  '/api/auth/signin',
  '/api/auth/callback',
];

/**
 * Check if a path is exempt from CSRF protection
 * @param path The request path
 * @returns True if the path is exempt
 */
export function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some(exempt => path.startsWith(exempt));
}

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, hashCsrfToken, CSRF_COOKIE_NAME } from '@sass-store/core/security/csrf';

/**
 * API endpoint to get a CSRF token
 * This is used by the client to get a token for making protected requests
 */
export async function GET(request: NextRequest) {
  // Generate a new CSRF token
  const csrfToken = generateCsrfToken();
  const csrfHash = hashCsrfToken(csrfToken);

  // Create response with the token
  const response = NextResponse.json({
    token: csrfToken,
  });

  // Set the hashed token in a cookie
  response.cookies.set(CSRF_COOKIE_NAME, csrfHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

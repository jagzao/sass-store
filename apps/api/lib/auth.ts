import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sass-store-secret-key-change-in-production'
);

export interface AuthResult {
  success: boolean;
  userId?: string;
  tenantId?: string;
  role?: string;
}

export async function validateApiKey(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false };
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      success: true,
      userId: payload.sub as string,
      tenantId: payload.tenantId as string,
      role: payload.role as string
    };

  } catch (error) {
    console.error('Auth validation failed:', error);
    return { success: false };
  }
}

export async function createApiToken(
  userId: string,
  tenantId: string,
  role: string = 'user'
): Promise<string> {
  const token = await new SignJWT({
    userId,
    tenantId,
    role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

// Simple API key validation for development
export function validateSimpleApiKey(request: NextRequest): AuthResult {
  const apiKey = request.headers.get('x-api-key');

  // For development, accept any API key that matches the pattern
  if (apiKey && apiKey.startsWith('sass_')) {
    return {
      success: true,
      userId: 'dev-user',
      tenantId: 'unknown',
      role: 'admin'
    };
  }

  return { success: false };
}

// Rate limiting aware auth - combines auth with rate limit checks
export async function validateAuthWithRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<AuthResult & { rateLimited: boolean }> {
  const authResult = await validateApiKey(request);

  if (!authResult.success) {
    return { ...authResult, rateLimited: false };
  }

  // Check rate limits for authenticated user
  const { checkRateLimit } = await import('./rate-limit');
  const rateLimitResult = await checkRateLimit(
    authResult.tenantId || 'unknown',
    endpoint
  );

  return {
    ...authResult,
    rateLimited: !rateLimitResult.success
  };
}

// Middleware to add auth headers to response
export function addAuthHeaders(
  response: Response,
  authResult: AuthResult
): Response {
  if (authResult.success && authResult.userId) {
    response.headers.set('X-User-ID', authResult.userId);
    if (authResult.tenantId) {
      response.headers.set('X-Tenant-ID', authResult.tenantId);
    }
    if (authResult.role) {
      response.headers.set('X-User-Role', authResult.role);
    }
  }

  return response;
}
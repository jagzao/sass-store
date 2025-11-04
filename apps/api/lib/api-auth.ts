import { NextRequest } from 'next/server';
import { auth } from '@sass-store/config';

/**
 * Extracts the authenticated user information from the request
 * @param request The Next.js API request object
 * @returns User object with id, role, and tenantSlug, or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  // Extract the session from the request
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }
  
  return {
    id: session.user.id,
    role: session.user.role,
    tenantSlug: session.user.tenantSlug,
  };
}

/**
 * Gets the actor ID from the authenticated user or returns a default value
 * @param request The Next.js API request object
 * @returns The actor ID or 'system' if not authenticated
 */
export async function getActorId(request: NextRequest): Promise<string> {
  const user = await getAuthenticatedUser(request);
  return user?.id || 'system';
}

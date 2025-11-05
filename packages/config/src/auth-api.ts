import { NextRequest } from 'next/server';
import { db } from '@sass-store/database';
import { tenants, apiKeys } from '@sass-store/database/schema';
import { eq, and, or, gt, isNull } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Hash an API key using SHA-256
 * @param apiKey The raw API key
 * @returns The hashed API key
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validates the API key provided in the request headers
 * @param request The Next.js API request object
 * @returns An object with success status and tenant info if valid
 */
export async function validateApiKey(request: NextRequest) {
  // Extract API key from the request headers
  const apiKey = request.headers.get('X-API-Key');
  const tenantSlug = request.headers.get('X-Tenant');

  // Check if API key is present
  if (!apiKey) {
    return {
      success: false,
      error: 'API key is required',
      tenant: null
    };
  }

  // Check if tenant slug is provided
  if (!tenantSlug) {
    return {
      success: false,
      error: 'Tenant slug is required',
      tenant: null
    };
  }

  try {
    // Hash the provided API key
    const hashedKey = hashApiKey(apiKey);

    // Query for the API key with tenant validation
    const result = await db
      .select({
        apiKeyId: apiKeys.id,
        apiKeyStatus: apiKeys.status,
        apiKeyExpiresAt: apiKeys.expiresAt,
        apiKeyPermissions: apiKeys.permissions,
        tenantId: tenants.id,
        tenantSlug: tenants.slug,
        tenantName: tenants.name,
      })
      .from(apiKeys)
      .innerJoin(tenants, eq(apiKeys.tenantId, tenants.id))
      .where(
        and(
          eq(apiKeys.key, hashedKey),
          eq(tenants.slug, tenantSlug),
          eq(apiKeys.status, 'active'),
          or(
            isNull(apiKeys.expiresAt),
            gt(apiKeys.expiresAt, new Date())
          )
        )
      )
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: 'Invalid API key or tenant',
        tenant: null
      };
    }

    const apiKeyRecord = result[0];

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKeyRecord.apiKeyId))
      .then(() => {})
      .catch((err) => console.error('[API Auth] Failed to update lastUsedAt:', err));

    return {
      success: true,
      error: null,
      tenant: {
        id: apiKeyRecord.tenantId,
        slug: apiKeyRecord.tenantSlug,
        name: apiKeyRecord.tenantName
      },
      permissions: apiKeyRecord.apiKeyPermissions as string[]
    };
  } catch (error) {
    console.error('[API Auth] Error validating API key:', error);
    return {
      success: false,
      error: 'Internal server error',
      tenant: null
    };
  }
}

/**
 * Validates the API key provided in the request headers without tenant validation
 * @param request The Next.js API request object
 * @returns A boolean indicating if the API key is valid
 */
export async function validateSimpleApiKey(request: NextRequest) {
  // Extract API key from the request headers
  const apiKey = request.headers.get('X-API-Key');

  // Check if API key is present
  if (!apiKey) {
    return {
      success: false,
      error: 'API key is required'
    };
  }

  try {
    // Hash the provided API key
    const hashedKey = hashApiKey(apiKey);

    // Query for the API key (no tenant validation)
    const result = await db
      .select({
        id: apiKeys.id,
        status: apiKeys.status,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.key, hashedKey),
          eq(apiKeys.status, 'active'),
          or(
            isNull(apiKeys.expiresAt),
            gt(apiKeys.expiresAt, new Date())
          )
        )
      )
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: 'Invalid API key'
      };
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, result[0].id))
      .then(() => {})
      .catch((err) => console.error('[Simple API Auth] Failed to update lastUsedAt:', err));

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('[Simple API Auth] Error validating API key:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}
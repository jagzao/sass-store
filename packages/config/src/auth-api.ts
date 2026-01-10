import { db } from "@sass-store/database";
import { tenants, apiKeys } from "@sass-store/database/schema";
import { eq, and, or, gt, isNull, sql } from "@sass-store/database";

/**
 * Generic request interface to avoid Next.js version dependency issues
 */
export interface RequestWithHeaders {
  headers: {
    get(name: string): string | null;
  };
}

/**
 * Hash an API key using SHA-256
 * @param apiKey The raw API key
 * @returns The hashed API key
 */
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Validates the API key provided in the request headers
 * @param request Any request object with a headers property
 * @returns An object with success status and tenant info if valid
 */
export async function validateApiKey(request: RequestWithHeaders) {
  // Extract API key from the request headers
  const apiKey = request.headers.get("X-API-Key");
  const tenantSlug = request.headers.get("X-Tenant");

  // Check if API key is present
  if (!apiKey) {
    return {
      success: false,
      error: "API key is required",
      tenant: null,
    };
  }

  // Check if tenant slug is provided
  if (!tenantSlug) {
    return {
      success: false,
      error: "Tenant slug is required",
      tenant: null,
    };
  }

  try {
    // Hash the provided API key
    const hashedKey = await hashApiKey(apiKey);

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
          eq(apiKeys.status, "active"),
          or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date())),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: "Invalid API key or tenant",
        tenant: null,
      };
    }

    const apiKeyRecord = result[0];

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKeyRecord.apiKeyId))
      .then(() => {})
      .catch((err) =>
        console.error("[API Auth] Failed to update lastUsedAt:", err),
      );

    return {
      success: true,
      error: null,
      tenant: {
        id: apiKeyRecord.tenantId,
        slug: apiKeyRecord.tenantSlug,
        name: apiKeyRecord.tenantName,
      },
      permissions: apiKeyRecord.apiKeyPermissions as string[],
    };
  } catch (error) {
    console.error("[API Auth] Error validating API key:", error);
    return {
      success: false,
      error: "Internal server error",
      tenant: null,
    };
  }
}

/**
 * Validates the API key provided in the request headers without tenant validation
 * @param request The Next.js API request object
 * @returns A boolean indicating if the API key is valid
 */
export async function validateSimpleApiKey(request: RequestWithHeaders) {
  // Extract API key from the request headers
  const apiKey = request.headers.get("X-API-Key");

  // Check if API key is present
  if (!apiKey) {
    return {
      success: false,
      error: "API key is required",
    };
  }

  try {
    // Hash the provided API key
    const hashedKey = await hashApiKey(apiKey);

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
          eq(apiKeys.status, "active"),
          or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date())),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        error: "Invalid API key",
      };
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, result[0].id))
      .then(() => {})
      .catch((err) =>
        console.error("[Simple API Auth] Failed to update lastUsedAt:", err),
      );

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("[Simple API Auth] Error validating API key:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

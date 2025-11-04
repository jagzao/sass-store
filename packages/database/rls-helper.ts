/**
 * Row Level Security (RLS) Helper
 * Ensures all database queries respect tenant isolation
 */

import { sql } from 'drizzle-orm';
import type { Database } from './connection';

/**
 * Set the tenant context for RLS policies
 * MUST be called before any database queries in multi-tenant context
 * NOTE: This sets context for the current transaction only (local=TRUE)
 */
export async function setTenantContext(db: any, tenantId: string): Promise<void> {
  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required for RLS');
  }

  // Set the app.current_tenant_id session variable
  // TRUE = local to current transaction (persists for the transaction only)
  await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`);
}

/**
 * Get the current tenant from RLS context
 */
export async function getCurrentTenant(db: Database): Promise<string | null> {
  try {
    const result: any = await db.execute(sql`SELECT get_current_tenant_id() as tenant_id`);
    return (result[0]?.tenant_id as string) || null;
  } catch (error) {
    console.error('Failed to get current tenant:', error);
    return null;
  }
}

/**
 * Execute a query with automatic tenant isolation using transactions
 *
 * DEFENSE IN DEPTH STRATEGY:
 * 1. Sets RLS context in database (database-level protection)
 * 2. Requires manual filters in queries (application-level protection)
 *
 * IMPORTANT: Always add manual .where(eq(table.tenantId, tenantId)) filters
 * in your queries. This provides double protection against data leakage.
 *
 * Example:
 * ```typescript
 * await withTenantContext(db, tenantId, async (db) => {
 *   return await db
 *     .select()
 *     .from(products)
 *     .where(eq(products.tenantId, tenantId)); // ← Manual filter required!
 * });
 * ```
 */
export async function withTenantContext<T>(
  db: Database,
  tenantId: string,
  user: { id: string; role: string } | null,
  queryFn: (db: any) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required for RLS');
  }

  // Use a transaction to ensure context persists
  return await db.transaction(async (tx) => {
    // Set tenant context within transaction (local=TRUE)
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`);

    // Set user context if provided
    if (user?.id && user?.role) {
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${user.id}, TRUE)`);
      await tx.execute(sql`SELECT set_config('app.current_user_role', ${user.role}, TRUE)`);
    }

    // Execute query with both RLS and manual filters applied
    return await queryFn(tx);
  });
}

/**
 * Example usage:
 *
 * import { db } from './db';
 * import { withTenantContext } from './rls-helper';
 * import { products } from './schema';
 *
 * // Get products for a specific tenant
 * const tenantProducts = await withTenantContext(db, tenantId, async (db) => {
 *   return await db.select().from(products);
 * });
 * // This will ONLY return products for the specified tenant
 * // RLS policies enforce this at the database level
 */

/**
 * Middleware to set tenant context from request
 * Use this in API routes to automatically set RLS context
 */
export function createTenantMiddleware(getTenantId: (req: any) => string) {
  return async function tenantMiddleware(req: any, db: any, next: () => Promise<any>) {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      throw new Error('SECURITY: Missing tenant context');
    }

    await setTenantContext(db, tenantId);

    return await next();
  };
}

/**
 * Validate that query results only contain data from the current tenant
 * Use in development/testing to catch RLS bypass attempts
 */
export function validateTenantIsolation<T extends { tenantId?: string }>(
  results: T[],
  expectedTenantId: string
): void {
  for (const result of results) {
    if (result.tenantId && result.tenantId !== expectedTenantId) {
      throw new Error(
        `SECURITY VIOLATION: Query returned data from different tenant! ` +
        `Expected: ${expectedTenantId}, Got: ${result.tenantId}`
      );
    }
  }
}

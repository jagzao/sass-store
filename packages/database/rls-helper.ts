/**
 * Row Level Security (RLS) Helper
 * Ensures all database queries respect tenant isolation
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

/**
 * Set the tenant context for RLS policies
 * MUST be called before any database queries in multi-tenant context
 */
export async function setTenantContext(db: any, tenantId: string): Promise<void> {
  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required for RLS');
  }

  // Set the app.current_tenant_id session variable
  // This is used by RLS policies to filter data
  await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, FALSE)`);
}

/**
 * Get the current tenant from RLS context
 */
export async function getCurrentTenant(db: any): Promise<string | null> {
  try {
    const result = await db.execute(sql`SELECT get_current_tenant()`);
    return result.rows[0]?.get_current_tenant || null;
  } catch (error) {
    console.error('Failed to get current tenant:', error);
    return null;
  }
}

/**
 * Execute a query with automatic tenant isolation
 * Use this wrapper to ensure RLS is always applied
 */
export async function withTenantContext<T>(
  db: any,
  tenantId: string,
  queryFn: (db: any) => Promise<T>
): Promise<T> {
  // Set tenant context
  await setTenantContext(db, tenantId);

  // Execute query (RLS policies will automatically filter by tenant)
  const result = await queryFn(db);

  return result;
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

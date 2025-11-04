import { NextRequest } from 'next/server';
import { db } from '@sass-store/database';
import { tenants } from '@sass-store/database';
import { eq } from 'drizzle-orm';
import { tenantCache } from './cache';

export interface ResolvedTenant {
  id: string;
  slug: string;
  name: string;
  mode: 'catalog' | 'booking';
  status: 'active' | 'inactive' | 'suspended';
}

/**
 * Resolve tenant following priority order:
 * 1. X-Tenant header
 * 2. Subdomain (from host header)
 * 3. Path parameter (handled by middleware)
 * 4. Default fallback (zo-system)
 */
export async function resolveTenant(request: NextRequest): Promise<ResolvedTenant | null> {
  // 1. Check X-Tenant header
  const tenantHeader = request.headers.get('x-tenant');
  if (tenantHeader) {
    const tenant = await fetchTenantBySlug(tenantHeader);
    if (tenant) return tenant;
  }

  // 2. Check query parameter 'tenant' (CRITICAL FIX)
  const url = new URL(request.url);
  const tenantParam = url.searchParams.get('tenant');
  if (tenantParam) {
    const tenant = await fetchTenantBySlug(tenantParam);
    if (tenant) {
      return tenant;
    }
  }

  // 3. Check subdomain from host
  const host = request.headers.get('host');
  if (host) {
    const subdomain = extractSubdomain(host);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      const tenant = await fetchTenantBySlug(subdomain);
      if (tenant) return tenant;
    }
  }

  // 4. Check path parameter (set by middleware)
  const tenantPath = request.headers.get('x-tenant-path');
  if (tenantPath) {
    const tenant = await fetchTenantBySlug(tenantPath);
    if (tenant) return tenant;
  }

  // 5. Default fallback
  return await fetchTenantBySlug('zo-system');
}

function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');

  // For localhost development
  if (hostWithoutPort === 'localhost' || hostWithoutPort.includes('127.0.0.1')) {
    return null;
  }

  // For production domains like tenant.sassstore.com
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

async function fetchTenantBySlug(slug: string): Promise<ResolvedTenant | null> {
  try {
    // Verificar cache primero
    const cached = tenantCache.get(slug);
    if (cached) {
      return cached as ResolvedTenant;
    }

    const tenant = await db
      .select({
        id: tenants.id,
        slug: tenants.slug,
        name: tenants.name,
        mode: tenants.mode,
        status: tenants.status
      })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (tenant.length === 0) {
      return null;
    }

    const resolvedTenant = {
      id: tenant[0].id,
      slug: tenant[0].slug,
      name: tenant[0].name,
      mode: tenant[0].mode as 'catalog' | 'booking',
      status: tenant[0].status as 'active' | 'inactive' | 'suspended'
    };

    // Cachear el resultado
    tenantCache.set(slug, resolvedTenant);

    return resolvedTenant;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

export function getTenantContext(request: NextRequest): string {
  // Check various sources for tenant context
  const tenantHeader = request.headers.get('x-tenant');
  if (tenantHeader) return tenantHeader;

  const host = request.headers.get('host');
  if (host) {
    const subdomain = extractSubdomain(host);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
  }

  return 'zo-system';
}

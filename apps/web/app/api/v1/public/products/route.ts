import { NextRequest, NextResponse } from 'next/server';
import { db } from '@sass-store/database';
import { products, tenants } from '@sass-store/database/schema';
import { eq, desc } from 'drizzle-orm';
import { getOrSetCache, CacheKeys } from '@/lib/cache/redis';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from URL query
    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get('tenant');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Max 100
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    if (!tenantSlug) {
      return NextResponse.json({ error: 'Tenant slug required' }, { status: 400 });
    }

    // Use Redis cache for product data (5 minute TTL)
    const cacheKey = CacheKeys.products(tenantSlug, limit, offset);
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        // Get tenant ID
        const [tenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, tenantSlug))
          .limit(1);

        if (!tenant) {
          throw new Error('Tenant not found');
        }

        // Fetch products with pagination (public access - no RLS needed)
        // Ordered by featured first, then by creation date
        const productList = await db
          .select()
          .from(products)
          .where(eq(products.tenantId, tenant.id))
          .orderBy(desc(products.featured), desc(products.createdAt))
          .limit(limit)
          .offset(offset);

        // Get total count for pagination metadata
        const [countResult] = await db
          .select({ count: products.id })
          .from(products)
          .where(eq(products.tenantId, tenant.id));

        return {
          data: productList,
          pagination: {
            limit,
            offset,
            total: countResult?.count || productList.length,
            hasMore: productList.length === limit,
          },
        };
      },
      300 // 5 minutes TTL
    );

    // Add cache headers for browser caching
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error('[Products API] Error:', error);

    // Return 404 for tenant not found
    if (error instanceof Error && error.message === 'Tenant not found') {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

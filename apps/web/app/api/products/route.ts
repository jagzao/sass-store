import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, withTenantContext } from '@sass-store/database';
import { products, tenants } from '@sass-store/database/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant from URL query
    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get('tenant');

    if (!tenantSlug) {
      return NextResponse.json({ error: 'Tenant slug required' }, { status: 400 });
    }

    // Get tenant ID
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Fetch products using RLS context
    const productList = await withTenantContext(db, tenant.id, { id: session.user.id, role: session.user.role || 'Cliente' }, async (db) => {
      return await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant.id))
        .orderBy(products.createdAt);
    });

    return NextResponse.json({ data: productList });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, withTenantContext } from '@sass-store/database';
import { services, tenants } from '@sass-store/database/schema';
import { eq } from 'drizzle-orm';

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

    // Fetch services using RLS context
    const serviceList = await withTenantContext(db, tenant.id, { id: session.user.id, role: session.user.role || 'Cliente' }, async (db) => {
      return await db
        .select()
        .from(services)
        .where(eq(services.tenantId, tenant.id))
        .orderBy(services.createdAt);
    });

    return NextResponse.json({ data: serviceList });
  } catch (error) {
    console.error('Services GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@sass-store/database';
import { services, tenants } from '@sass-store/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
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

    // Fetch services directly without RLS context (public endpoint)
    const serviceList = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, tenant.id))
      .orderBy(services.createdAt);

    return NextResponse.json({ data: serviceList });
  } catch (error) {
    console.error('Services GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

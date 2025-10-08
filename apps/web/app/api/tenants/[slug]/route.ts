import { NextRequest, NextResponse } from 'next/server';
import { getTenantDataForPage } from '@/lib/db/tenant-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tenantData = await getTenantDataForPage(slug);

    return NextResponse.json(tenantData, { status: 200 });
  } catch (error) {
    console.error('Error fetching tenant:', error);

    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }
}

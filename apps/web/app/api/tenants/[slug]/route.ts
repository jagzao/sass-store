import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/db/tenant-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Use TenantService directly to avoid notFound() error
    const tenantData = await TenantService.getTenantWithData(slug);

    if (!tenantData) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Add cache headers for browser caching
    const response = NextResponse.json(tenantData, { status: 200 });
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');

    return response;
  } catch (error) {
    console.error('Error fetching tenant:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { mediaAssets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantIdForRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdForRequest(request);
    const { searchParams } = new URL(request.url);

    const assetType = searchParams.get('asset_type');
    const entityId = searchParams.get('entity_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(mediaAssets.tenantId, tenantId)];

    if (assetType) {
      conditions.push(eq(mediaAssets.assetType, assetType));
    }

    if (entityId) {
      conditions.push(eq(mediaAssets.entityId, entityId));
    }

    const assets = await db
      .select({
        id: mediaAssets.id,
        assetType: mediaAssets.assetType,
        entityId: mediaAssets.entityId,
        filename: mediaAssets.filename,
        contentHash: mediaAssets.contentHash,
        originalSize: mediaAssets.originalSize,
        totalSize: mediaAssets.totalSize,
        mimeType: mediaAssets.mimeType,
        width: mediaAssets.width,
        height: mediaAssets.height,
        dominantColor: mediaAssets.dominantColor,
        blurhash: mediaAssets.blurhash,
        variants: mediaAssets.variants,
        metadata: mediaAssets.metadata,
        createdAt: mediaAssets.createdAt
      })
      .from(mediaAssets)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(mediaAssets.createdAt);

    // Get total count
    const [{ count }] = await db
      .select({ count: mediaAssets.id })
      .from(mediaAssets)
      .where(and(...conditions));

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: assets,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching media assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdForRequest(request);

    // This is a simplified implementation
    // In production, you'd integrate with Cloudflare R2 or similar storage
    return NextResponse.json(
      {
        message: 'Media upload endpoint - integration with storage service needed',
        note: 'This endpoint should handle file uploads to R2/S3 and create database records'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
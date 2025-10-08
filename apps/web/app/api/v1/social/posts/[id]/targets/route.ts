import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { socialPosts, socialPostTargets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantIdForRequest } from '@/lib/tenant/resolver';

const SUPPORTED_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'gbp', 'threads'];
const VALID_STATUSES = ['draft', 'scheduled', 'published', 'failed', 'canceled'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const postId = id;

    // Verify post belongs to tenant
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.tenantId, tenantId)
      ));

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get targets
    const targets = await db
      .select()
      .from(socialPostTargets)
      .where(eq(socialPostTargets.postId, postId));

    return NextResponse.json({
      data: targets
    });

  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const postId = id;
    const body = await request.json();

    const {
      platform,
      publishAtUtc,
      variantText,
      assetIds = []
    } = body;

    // Verify post belongs to tenant
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.tenantId, tenantId)
      ));

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Validation
    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform is required' },
        { status: 400 }
      );
    }

    if (variantText && variantText.length > 2000) {
      return NextResponse.json(
        { error: 'Variant text must be less than 2000 characters' },
        { status: 400 }
      );
    }

    if (publishAtUtc && new Date(publishAtUtc) < new Date()) {
      return NextResponse.json(
        { error: 'Publish time must be in the future' },
        { status: 400 }
      );
    }

    // Check if target already exists for this platform
    const [existingTarget] = await db
      .select()
      .from(socialPostTargets)
      .where(and(
        eq(socialPostTargets.postId, postId),
        eq(socialPostTargets.platform, platform)
      ));

    if (existingTarget) {
      return NextResponse.json(
        { error: 'Target already exists for this platform' },
        { status: 409 }
      );
    }

    // Create target
    const [target] = await db
      .insert(socialPostTargets)
      .values({
        postId,
        platform,
        publishAtUtc: publishAtUtc ? new Date(publishAtUtc) : null,
        variantText,
        assetIds,
        status: publishAtUtc ? 'scheduled' : 'draft'
      })
      .returning();

    return NextResponse.json(
      { data: target, message: 'Target created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating target:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
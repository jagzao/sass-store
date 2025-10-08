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

    // Get post with targets
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

    // Get targets for this post
    const targets = await db
      .select()
      .from(socialPostTargets)
      .where(eq(socialPostTargets.postId, postId));

    return NextResponse.json({
      data: {
        ...post,
        targets
      }
    });

  } catch (error) {
    console.error('Error fetching social post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const postId = id;
    const body = await request.json();

    const {
      title,
      baseText,
      status,
      scheduledAtUtc,
      timezone,
      updatedBy
    } = body;

    // Check if post exists and belongs to tenant
    const [existingPost] = await db
      .select()
      .from(socialPosts)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.tenantId, tenantId)
      ));

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Validation
    if (baseText && typeof baseText !== 'string') {
      return NextResponse.json(
        { error: 'Base text must be a string' },
        { status: 400 }
      );
    }

    if (baseText && baseText.length > 2000) {
      return NextResponse.json(
        { error: 'Base text must be less than 2000 characters' },
        { status: 400 }
      );
    }

    if (title && title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (scheduledAtUtc && new Date(scheduledAtUtc) < new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Update post
    const updateData: any = {
      updatedBy: updatedBy || 'system',
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (baseText !== undefined) updateData.baseText = baseText;
    if (status !== undefined) updateData.status = status;
    if (scheduledAtUtc !== undefined) updateData.scheduledAtUtc = scheduledAtUtc ? new Date(scheduledAtUtc) : null;
    if (timezone !== undefined) updateData.timezone = timezone;

    const [updatedPost] = await db
      .update(socialPosts)
      .set(updateData)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.tenantId, tenantId)
      ))
      .returning();

    return NextResponse.json({
      data: updatedPost,
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Error updating social post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const postId = id;

    // Check if post exists and belongs to tenant
    const [existingPost] = await db
      .select()
      .from(socialPosts)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.tenantId, tenantId)
      ));

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete targets first (CASCADE should handle this, but let's be explicit)
    await db
      .delete(socialPostTargets)
      .where(eq(socialPostTargets.postId, postId));

    // Delete post
    await db
      .delete(socialPosts)
      .where(and(
        eq(socialPosts.id, postId),
        eq(socialPosts.tenantId, tenantId)
      ));

    return NextResponse.json({
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting social post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
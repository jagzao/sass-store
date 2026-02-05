import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  socialPosts,
  socialPostTargets,
  tenants,
} from "@sass-store/database/schema";
import { eq, and, desc, sql, inArray, or, like } from "drizzle-orm";

/**
 * GET /api/v1/social/library
 * Get content library items (saved templates/successful posts)
 *
 * Query params:
 * - tenant: tenant slug (required)
 * - search: search in title and content
 * - format: filter by format (post, reel, story, video)
 * - platform: filter by platform
 * - sortBy: recent | name | usage (default: recent)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenant");
    const search = searchParams.get("search");
    const format = searchParams.get("format");
    const platform = searchParams.get("platform");
    const sortBy = searchParams.get("sortBy") || "recent";

    if (!tenantSlug) {
      return NextResponse.json(
        { success: false, error: "Tenant slug is required" },
        { status: 400 },
      );
    }

    // Get tenant ID from slug
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    // Set tenant context for RLS
    await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

    // Build query conditions
    // Library items are either:
    // 1. Posts marked as "library" in metadata
    // 2. Published posts that can be reused
    const conditions = [
      eq(socialPosts.tenantId, tenant.id),
      or(
        sql`COALESCE(${socialPosts.metadata}->>'isLibrary', 'false') = 'true'`,
        eq(socialPosts.status, "published"),
      ),
    ];

    // Search in title and content
    if (search) {
      conditions.push(
        or(
          like(socialPosts.title, `%${search}%`),
          like(socialPosts.baseText, `%${search}%`),
        ),
      );
    }

    // Filter by format (stored in metadata)
    if (format) {
      conditions.push(
        sql`COALESCE(${socialPosts.metadata}->>'format', '') = ${format}`,
      );
    }

    // Fetch posts
    let query = db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        content: socialPosts.baseText,
        status: socialPosts.status,
        metadata: socialPosts.metadata,
        createdAt: socialPosts.createdAt,
        updatedAt: socialPosts.updatedAt,
      })
      .from(socialPosts)
      .where(and(...conditions));

    // Apply sorting
    switch (sortBy) {
      case "name":
        query = query.orderBy(socialPosts.title);
        break;
      case "usage":
        query = query.orderBy(
          desc(
            sql`CAST(COALESCE(${socialPosts.metadata}->>'usageCount', '0') AS INTEGER)`,
          ),
        );
        break;
      case "recent":
      default:
        query = query.orderBy(desc(socialPosts.updatedAt));
        break;
    }

    const posts = await query;

    // Get targets for all posts
    const postIds = posts.map((p) => p.id);
    let targets: any[] = [];

    if (postIds.length > 0) {
      targets = await db
        .select({
          postId: socialPostTargets.postId,
          platform: socialPostTargets.platform,
        })
        .from(socialPostTargets)
        .where(
          inArray(
            socialPostTargets.postId,
            postIds as unknown as [string, ...string[]],
          ),
        );
    }

    // Build library items
    let libraryItems = posts.map((post) => {
      const postTargets = targets.filter((t) => t.postId === post.id);
      const platforms = [...new Set(postTargets.map((t) => t.platform))];

      // Extract metadata
      const metadata = (post.metadata as any) || {};
      const format = metadata.format || "post";
      const usageCount = metadata.usageCount || 0;
      const mediaUrl = metadata.mediaUrl || null;

      return {
        id: post.id,
        title: post.title || "Untitled",
        content: post.content,
        format,
        platforms,
        mediaUrl,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        usageCount,
      };
    });

    // Filter by platform if specified
    if (platform) {
      libraryItems = libraryItems.filter((item) =>
        item.platforms.includes(platform),
      );
    }

    return NextResponse.json({
      success: true,
      data: libraryItems,
      count: libraryItems.length,
    });
  } catch (error) {
    console.error("Error fetching library content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch library content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/social/library
 * Save content to library
 *
 * Body:
 * - tenant: string (required)
 * - title: string (required)
 * - content: string (required)
 * - format: post | reel | story | video
 * - platforms: string[]
 * - mediaUrl?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenant: tenantSlug,
      title,
      content,
      format = "post",
      platforms = [],
      mediaUrl,
    } = body;

    if (!tenantSlug || !title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant slug, title and content are required",
        },
        { status: 400 },
      );
    }

    // Get tenant ID from slug
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    // Set tenant context for RLS
    await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

    // Create post marked as library content
    const [newPost] = await db
      .insert(socialPosts)
      .values({
        tenantId: tenant.id,
        title,
        baseText: content,
        status: "draft", // Library items start as drafts
        metadata: {
          isLibrary: true,
          format,
          usageCount: 0,
          mediaUrl,
        },
        createdBy: "user",
        updatedBy: "user",
      })
      .returning();

    // Create targets for each platform
    if (platforms.length > 0) {
      await db.insert(socialPostTargets).values(
        platforms.map((platform: string) => ({
          postId: newPost.id,
          platform,
          variantText: content,
          status: "draft",
        })),
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newPost.id,
        title: newPost.title,
        content: newPost.baseText,
        format,
        platforms,
        mediaUrl,
        createdAt: newPost.createdAt,
        updatedAt: newPost.updatedAt,
        usageCount: 0,
      },
    });
  } catch (error) {
    console.error("Error saving content to library:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save content to library",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/v1/social/library
 * Update library content
 *
 * Body:
 * - id: string (required)
 * - tenant: string (required)
 * - title?: string
 * - content?: string
 * - format?: string
 * - platforms?: string[]
 * - mediaUrl?: string
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      tenant: tenantSlug,
      title,
      content,
      format,
      platforms,
      mediaUrl,
    } = body;

    if (!id || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: "Content ID and tenant slug are required" },
        { status: 400 },
      );
    }

    // Get tenant ID from slug
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    // Set tenant context for RLS
    await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

    // Get current metadata
    const [currentPost] = await db
      .select({ metadata: socialPosts.metadata })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, id), eq(socialPosts.tenantId, tenant.id)))
      .limit(1);

    if (!currentPost) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 },
      );
    }

    const currentMetadata = (currentPost.metadata as any) || {};

    // Update post
    const [updatedPost] = await db
      .update(socialPosts)
      .set({
        ...(title && { title }),
        ...(content && { baseText: content }),
        metadata: {
          ...currentMetadata,
          isLibrary: true,
          ...(format && { format }),
          ...(mediaUrl !== undefined && { mediaUrl }),
        },
        updatedBy: "user",
        updatedAt: new Date(),
      })
      .where(and(eq(socialPosts.id, id), eq(socialPosts.tenantId, tenant.id)))
      .returning();

    // Update targets if platforms provided
    if (platforms && platforms.length > 0) {
      // Delete existing targets
      await db
        .delete(socialPostTargets)
        .where(eq(socialPostTargets.postId, id));

      // Create new targets
      await db.insert(socialPostTargets).values(
        platforms.map((platform: string) => ({
          postId: id,
          platform,
          variantText: content || updatedPost.baseText,
          status: "draft",
        })),
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPost.id,
        title: updatedPost.title,
        content: updatedPost.baseText,
        updatedAt: updatedPost.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating library content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update library content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/social/library
 * Delete library content
 *
 * Query params:
 * - id: content ID (required)
 * - tenant: tenant slug (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("id");
    const tenantSlug = searchParams.get("tenant");

    if (!contentId || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: "Content ID and tenant slug are required" },
        { status: 400 },
      );
    }

    // Get tenant ID from slug
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    // Set tenant context for RLS
    await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

    // Delete targets first
    await db
      .delete(socialPostTargets)
      .where(eq(socialPostTargets.postId, contentId));

    // Delete post
    const [deletedPost] = await db
      .delete(socialPosts)
      .where(
        and(eq(socialPosts.id, contentId), eq(socialPosts.tenantId, tenant.id)),
      )
      .returning({ id: socialPosts.id });

    if (!deletedPost) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Content ${contentId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting library content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete library content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

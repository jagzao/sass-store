import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  socialPosts,
  socialPostTargets,
  tenants,
} from "@sass-store/database/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { withTenantContext } from "@/lib/db/tenant-context";
import { logger } from "@/lib/logger";

/**
 * GET /api/v1/social/queue
 * List all social media posts with filters
 *
 * Query params:
 * - tenant: tenant slug (required)
 * - status: filter by status (draft, scheduled, published, failed, canceled)
 * - platform: filter by platform
 * - start_date: filter posts from this date
 * - end_date: filter posts until this date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenant");
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

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
    const conditions = [eq(socialPosts.tenantId, tenant.id)];

    if (status) {
      conditions.push(eq(socialPosts.status, status));
    }

    if (startDate) {
      conditions.push(gte(socialPosts.scheduledAtUtc, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(socialPosts.scheduledAtUtc, new Date(endDate)));
    }

    // Fetch posts with their targets
    const posts = await db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        content: socialPosts.baseText,
        status: socialPosts.status,
        scheduledAt: socialPosts.scheduledAtUtc,
        timezone: socialPosts.timezone,
        createdBy: socialPosts.createdBy,
        createdAt: socialPosts.createdAt,
        updatedAt: socialPosts.updatedAt,
        metadata: socialPosts.metadata,
      })
      .from(socialPosts)
      .where(and(...conditions))
      .orderBy(desc(socialPosts.scheduledAtUtc));

    // For each post, get its targets
    const postsWithTargets = await Promise.all(
      posts.map(async (post) => {
        const targets = await db
          .select({
            id: socialPostTargets.id,
            platform: socialPostTargets.platform,
            status: socialPostTargets.status,
            variantText: socialPostTargets.variantText,
            publishAtUtc: socialPostTargets.publishAtUtc,
            platformPostId: socialPostTargets.platformPostId,
            error: socialPostTargets.error,
          })
          .from(socialPostTargets)
          .where(eq(socialPostTargets.postId, post.id));

        // Filter by platform if specified
        const filteredTargets = platform
          ? targets.filter((t) => t.platform === platform)
          : targets;

        // Skip this post if platform filter excludes all targets
        if (platform && filteredTargets.length === 0) {
          return null;
        }

        return {
          ...post,
          platforms: filteredTargets.map((t) => t.platform),
          targets: filteredTargets,
        };
      }),
    );

    // Remove null entries (posts filtered out by platform)
    const filteredPosts = postsWithTargets.filter((p) => p !== null);

    return NextResponse.json({
      success: true,
      data: filteredPosts,
      count: filteredPosts.length,
    });
  } catch (error) {
    console.error("Error fetching queue posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch queue posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/social/queue
 * Create or update a social media post
 *
 * Body:
 * - id?: string (if updating)
 * - tenant: string (required)
 * - title?: string
 * - baseText: string (required)
 * - status: string
 * - scheduledAtUtc?: Date
 * - timezone?: string
 * - platforms: Array<{platform: string, variantText?: string, publishAtUtc?: Date}>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      tenant: tenantSlug,
      title,
      baseText,
      status = "draft",
      scheduledAtUtc,
      timezone = "UTC",
      platforms = [],
      metadata,
      createdBy = "user",
    } = body;

    if (!tenantSlug || !baseText) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant slug and baseText are required",
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

    // If ID is provided, update existing post
    if (id) {
      // Update post
      const [updatedPost] = await db
        .update(socialPosts)
        .set({
          title,
          baseText,
          status,
          scheduledAtUtc: scheduledAtUtc ? new Date(scheduledAtUtc) : null,
          timezone,
          metadata,
          updatedBy: createdBy,
          updatedAt: new Date(),
        })
        .where(and(eq(socialPosts.id, id), eq(socialPosts.tenantId, tenant.id)))
        .returning();

      if (!updatedPost) {
        return NextResponse.json(
          { success: false, error: "Post not found" },
          { status: 404 },
        );
      }

      // Delete existing targets
      await db
        .delete(socialPostTargets)
        .where(eq(socialPostTargets.postId, id));

      // Create new targets
      if (platforms.length > 0) {
        await db.insert(socialPostTargets).values(
          platforms.map((p: any) => ({
            postId: id,
            platform: p.platform,
            variantText: p.variantText || baseText,
            publishAtUtc: p.publishAtUtc
              ? new Date(p.publishAtUtc)
              : scheduledAtUtc
                ? new Date(scheduledAtUtc)
                : null,
            status: p.status || status,
            timezone,
          })),
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...updatedPost,
          platforms: platforms.map((p: any) => p.platform),
        },
      });
    }

    // Create new post
    const [newPost] = await db
      .insert(socialPosts)
      .values({
        tenantId: tenant.id,
        title,
        baseText,
        status,
        scheduledAtUtc: scheduledAtUtc ? new Date(scheduledAtUtc) : null,
        timezone,
        createdBy,
        updatedBy: createdBy,
        metadata,
      })
      .returning();

    // Create targets for each platform
    if (platforms.length > 0) {
      await db.insert(socialPostTargets).values(
        platforms.map((p: any) => ({
          postId: newPost.id,
          platform: p.platform,
          variantText: p.variantText || baseText,
          publishAtUtc: p.publishAtUtc
            ? new Date(p.publishAtUtc)
            : scheduledAtUtc
              ? new Date(scheduledAtUtc)
              : null,
          status: p.status || status,
          timezone,
        })),
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newPost,
        platforms: platforms.map((p: any) => p.platform),
      },
    });
  } catch (error) {
    console.error("Error creating/updating post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create/update post",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/social/queue
 * Delete one or more posts
 *
 * Query params:
 * - ids: comma-separated list of post IDs
 * - tenant: tenant slug (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const tenantSlug = searchParams.get("tenant");

    if (!idsParam || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: "Post IDs and tenant slug are required" },
        { status: 400 },
      );
    }

    const postIds = idsParam.split(",").filter(Boolean);

    if (postIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No post IDs provided" },
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

    // Delete targets first (foreign key constraint)
    await db
      .delete(socialPostTargets)
      .where(
        inArray(
          socialPostTargets.postId,
          postIds as unknown as [string, ...string[]],
        ),
      );

    // Delete posts
    const deletedPosts = await db
      .delete(socialPosts)
      .where(
        and(
          inArray(socialPosts.id, postIds as unknown as [string, ...string[]]),
          eq(socialPosts.tenantId, tenant.id),
        ),
      )
      .returning({ id: socialPosts.id });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedPosts.length} post${deletedPosts.length !== 1 ? "s" : ""}`,
      deletedIds: deletedPosts.map((p) => p.id),
    });
  } catch (error) {
    console.error("Error deleting posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

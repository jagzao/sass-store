import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  socialPosts,
  socialPostTargets,
  tenants,
} from "@sass-store/database/schema";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";

/**
 * GET /api/v1/social/calendar
 * Get posts grouped by date for calendar view
 *
 * Query params:
 * - tenant: tenant slug (required)
 * - start_date: start of date range (required)
 * - end_date: end of date range (required)
 * - platforms: comma-separated list of platforms to filter
 * - statuses: comma-separated list of statuses to filter
 * - view: month | week | list (default: month)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenant");
    const view = searchParams.get("view") || "month";
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const platformsParam = searchParams.get("platforms");
    const statusesParam = searchParams.get("statuses");

    if (!tenantSlug || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant slug, start_date and end_date are required",
        },
        { status: 400 },
      );
    }

    const platforms = platformsParam?.split(",").filter(Boolean);
    const statuses = statusesParam?.split(",").filter(Boolean);

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

    // Build query conditions
    const conditions = [
      eq(socialPosts.tenantId, tenant.id),
      gte(socialPosts.scheduledAtUtc, new Date(startDate)),
      lte(socialPosts.scheduledAtUtc, new Date(endDate)),
    ];

    if (statuses && statuses.length > 0) {
      conditions.push(
        inArray(
          socialPosts.status,
          statuses as unknown as [string, ...string[]],
        ),
      );
    }

    // Fetch all posts in the date range
    const posts = await db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        content: socialPosts.baseText,
        status: socialPosts.status,
        scheduledAt: socialPosts.scheduledAtUtc,
        timezone: socialPosts.timezone,
        createdAt: socialPosts.createdAt,
      })
      .from(socialPosts)
      .where(and(...conditions));

    // Get targets for all posts
    const postIds = posts.map((p) => p.id);
    let targets: any[] = [];

    if (postIds.length > 0) {
      targets = await db
        .select({
          postId: socialPostTargets.postId,
          platform: socialPostTargets.platform,
          status: socialPostTargets.status,
          variantText: socialPostTargets.variantText,
          publishAtUtc: socialPostTargets.publishAtUtc,
        })
        .from(socialPostTargets)
        .where(
          inArray(
            socialPostTargets.postId,
            postIds as unknown as [string, ...string[]],
          ),
        );
    }

    // Filter by platforms if specified
    if (platforms && platforms.length > 0) {
      targets = targets.filter((t) => platforms.includes(t.platform));
    }

    // Group posts by date
    const postsByDate = new Map<
      string,
      {
        date: string;
        posts: any[];
        post_count: number;
        platforms: string[];
        statuses: string[];
        draft_count: number;
        scheduled_count: number;
        published_count: number;
        failed_count: number;
      }
    >();

    posts.forEach((post) => {
      // Get targets for this post
      const postTargets = targets.filter((t) => t.postId === post.id);

      // Skip if platform filter excludes this post
      if (platforms && platforms.length > 0 && postTargets.length === 0) {
        return;
      }

      // Extract date (YYYY-MM-DD) from scheduledAt
      const date = post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().split("T")[0]
        : null;

      if (!date) return;

      const existing = postsByDate.get(date) || {
        date,
        posts: [],
        post_count: 0,
        platforms: [],
        statuses: [],
        draft_count: 0,
        scheduled_count: 0,
        published_count: 0,
        failed_count: 0,
      };

      // Add post with its targets
      existing.posts.push({
        ...post,
        platforms: postTargets.map((t) => t.platform),
        targets: postTargets,
      });
      existing.post_count++;

      // Track platforms
      postTargets.forEach((t) => {
        if (!existing.platforms.includes(t.platform)) {
          existing.platforms.push(t.platform);
        }
      });

      // Track statuses
      if (!existing.statuses.includes(post.status)) {
        existing.statuses.push(post.status);
      }

      // Count by status
      switch (post.status) {
        case "draft":
          existing.draft_count++;
          break;
        case "scheduled":
          existing.scheduled_count++;
          break;
        case "published":
          existing.published_count++;
          break;
        case "failed":
          existing.failed_count++;
          break;
      }

      postsByDate.set(date, existing);
    });

    // Convert map to array and sort by date
    const summary = Array.from(postsByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // For list view, include full post details
    if (view === "list") {
      return NextResponse.json({
        success: true,
        data: {
          summary,
          posts: summary.flatMap((day) => day.posts),
        },
      });
    }

    // For calendar views, return just the summary
    return NextResponse.json({
      success: true,
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calendar data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

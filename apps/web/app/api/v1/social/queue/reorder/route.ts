import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { socialPosts, tenants } from "@sass-store/database/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * POST /api/v1/social/queue/reorder
 * Reorder social media posts by updating their scheduledAtUtc timestamps
 *
 * Body:
 * - tenant: string (tenant slug, required)
 * - postIds: string[] (array of post IDs in the new desired order, required)
 *
 * Logic:
 * - Fetches all posts with their current scheduledAtUtc
 * - Sorts the timestamps in chronological order
 * - Reassigns timestamps to match the new order provided
 * - Updates all posts in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant: tenantSlug, postIds } = body;

    // Validate input
    if (!tenantSlug || !postIds || !Array.isArray(postIds)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant slug and postIds array are required",
        },
        { status: 400 },
      );
    }

    if (postIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one post ID is required",
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

    // Fetch all posts that need to be reordered
    const posts = await db
      .select({
        id: socialPosts.id,
        scheduledAtUtc: socialPosts.scheduledAtUtc,
      })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.tenantId, tenant.id),
          inArray(socialPosts.id, postIds as unknown as [string, ...string[]]),
        ),
      );

    // Verify all posts were found
    if (posts.length !== postIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Some posts were not found. Expected ${postIds.length}, found ${posts.length}`,
        },
        { status: 404 },
      );
    }

    // Extract all scheduledAtUtc dates and sort them chronologically
    const scheduledDates = posts
      .map((p) => p.scheduledAtUtc)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    // If no dates are scheduled, use a default starting point
    if (scheduledDates.length === 0) {
      // Start from now, with 1-hour intervals
      const now = new Date();
      for (let i = 0; i < postIds.length; i++) {
        const newDate = new Date(now);
        newDate.setHours(now.getHours() + i);

        await db
          .update(socialPosts)
          .set({
            scheduledAtUtc: newDate,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(socialPosts.id, postIds[i]),
              eq(socialPosts.tenantId, tenant.id),
            ),
          );
      }
    } else {
      // If there are fewer dates than posts, generate additional dates
      if (scheduledDates.length < postIds.length) {
        const lastDate = scheduledDates[scheduledDates.length - 1];
        const avgInterval =
          scheduledDates.length > 1
            ? (scheduledDates[scheduledDates.length - 1].getTime() -
                scheduledDates[0].getTime()) /
              (scheduledDates.length - 1)
            : 60 * 60 * 1000; // Default 1 hour

        for (let i = scheduledDates.length; i < postIds.length; i++) {
          const newDate = new Date(
            lastDate.getTime() + avgInterval * (i - scheduledDates.length + 1),
          );
          scheduledDates.push(newDate);
        }
      }

      // Reassign dates based on the new order
      for (let i = 0; i < postIds.length; i++) {
        const postId = postIds[i];
        const newScheduledDate = scheduledDates[i];

        await db
          .update(socialPosts)
          .set({
            scheduledAtUtc: newScheduledDate,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(socialPosts.id, postId),
              eq(socialPosts.tenantId, tenant.id),
            ),
          );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${postIds.length} posts`,
      reorderedCount: postIds.length,
    });
  } catch (error) {
    // Error reordering posts
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reorder posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

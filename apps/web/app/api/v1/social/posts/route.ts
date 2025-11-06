import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { socialPosts, socialPostTargets } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { getTenantIdForRequest } from "@/lib/tenant/resolver";

const SUPPORTED_PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "x",
  "tiktok",
  "gbp",
  "threads",
] as const;

const VALID_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "failed",
  "canceled",
] as const;

type PostStatus = typeof VALID_STATUSES[number];

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdForRequest(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        baseText: socialPosts.baseText,
        status: socialPosts.status,
        scheduledAtUtc: socialPosts.scheduledAtUtc,
        timezone: socialPosts.timezone,
        createdBy: socialPosts.createdBy,
        updatedBy: socialPosts.updatedBy,
        createdAt: socialPosts.createdAt,
        updatedAt: socialPosts.updatedAt,
      })
      .from(socialPosts)
      .where(eq(socialPosts.tenantId, tenantId))
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const conditions = [eq(socialPosts.tenantId, tenantId)];

    if (status && VALID_STATUSES.includes(status as PostStatus)) {
      conditions.push(eq(socialPosts.status, status as PostStatus));
    }

    if (startDate) {
      conditions.push(gte(socialPosts.scheduledAtUtc, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(socialPosts.scheduledAtUtc, new Date(endDate)));
    }

    const posts = await db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        baseText: socialPosts.baseText,
        status: socialPosts.status,
        scheduledAtUtc: socialPosts.scheduledAtUtc,
        timezone: socialPosts.timezone,
        createdBy: socialPosts.createdBy,
        updatedBy: socialPosts.updatedBy,
        createdAt: socialPosts.createdAt,
        updatedAt: socialPosts.updatedAt,
      })
      .from(socialPosts)
      .where(and(...conditions))
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: socialPosts.id })
      .from(socialPosts)
      .where(and(...conditions));

    const totalCount = Number(count);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: posts,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching social posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdForRequest(request);
    const body = await request.json();

    const {
      title,
      baseText,
      scheduledAtUtc,
      timezone = "UTC",
      targets = [],
      createdBy,
    } = body;

    // Validation
    if (!baseText || typeof baseText !== "string") {
      return NextResponse.json(
        { error: "Base text is required" },
        { status: 400 },
      );
    }

    if (baseText.length > 2000) {
      return NextResponse.json(
        { error: "Base text must be less than 2000 characters" },
        { status: 400 },
      );
    }

    if (title && title.length > 200) {
      return NextResponse.json(
        { error: "Title must be less than 200 characters" },
        { status: 400 },
      );
    }

    if (scheduledAtUtc && new Date(scheduledAtUtc) < new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 },
      );
    }

    // Validate targets
    if (targets && targets.length > 0) {
      for (const target of targets) {
        if (!SUPPORTED_PLATFORMS.includes(target.platform)) {
          return NextResponse.json(
            { error: `Unsupported platform: ${target.platform}` },
            { status: 400 },
          );
        }
        if (target.variantText && target.variantText.length > 2000) {
          return NextResponse.json(
            { error: "Variant text must be less than 2000 characters" },
            { status: 400 },
          );
        }
      }
    }

    // Create post
    const [post] = await db
      .insert(socialPosts)
      .values({
        tenantId,
        title: title || null,
        baseText,
        status: scheduledAtUtc ? "scheduled" : "draft",
        scheduledAtUtc: scheduledAtUtc ? new Date(scheduledAtUtc) : null,
        timezone,
        createdBy: createdBy || "system",
        updatedBy: createdBy || "system",
      })
      .returning();

    // Create targets if provided
    if (targets && targets.length > 0) {
      const targetInserts = targets.map((target: any) => ({
        postId: post.id,
        platform: target.platform,
        publishAtUtc: target.publishAtUtc
          ? new Date(target.publishAtUtc)
          : null,
        variantText: target.variantText || null,
        assetIds: target.assetIds || [],
        status: target.publishAtUtc ? "scheduled" : "draft",
      }));

      await db.insert(socialPostTargets).values(targetInserts);
    }

    return NextResponse.json(
      { data: post, message: "Social post created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating social post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

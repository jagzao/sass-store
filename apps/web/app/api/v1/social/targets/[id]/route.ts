import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { socialPosts, socialPostTargets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantIdForRequest } from "@/lib/tenant/resolver";

const SUPPORTED_PLATFORMS = [
  "facebook",
  "instagram",
  "linkedin",
  "x",
  "tiktok",
  "gbp",
  "threads",
];
const VALID_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "failed",
  "canceled",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const targetId = id;

    // Get target with post verification
    const [target] = await db
      .select({
        target: socialPostTargets,
        post: socialPosts,
      })
      .from(socialPostTargets)
      .innerJoin(socialPosts, eq(socialPostTargets.postId, socialPosts.id))
      .where(
        and(
          eq(socialPostTargets.id, targetId),
          eq(socialPosts.tenantId, tenantId),
        ),
      );

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: target.target,
    });
  } catch (error) {
    console.error("Error fetching target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const targetId = id;
    const body = await request.json();

    const {
      platform,
      publishAtUtc,
      variantText,
      assetIds,
      status,
      externalRef,
      error: errorMsg,
    } = body;

    // Verify target belongs to tenant
    const [existingTarget] = await db
      .select({
        target: socialPostTargets,
        post: socialPosts,
      })
      .from(socialPostTargets)
      .innerJoin(socialPosts, eq(socialPostTargets.postId, socialPosts.id))
      .where(
        and(
          eq(socialPostTargets.id, targetId),
          eq(socialPosts.tenantId, tenantId),
        ),
      );

    if (!existingTarget) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // Validation
    if (platform && !SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (variantText && variantText.length > 2000) {
      return NextResponse.json(
        { error: "Variant text must be less than 2000 characters" },
        { status: 400 },
      );
    }

    if (publishAtUtc && new Date(publishAtUtc) < new Date()) {
      return NextResponse.json(
        { error: "Publish time must be in the future" },
        { status: 400 },
      );
    }

    // Update target
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (platform !== undefined) updateData.platform = platform;
    if (publishAtUtc !== undefined)
      updateData.publishAtUtc = publishAtUtc ? new Date(publishAtUtc) : null;
    if (variantText !== undefined) updateData.variantText = variantText;
    if (assetIds !== undefined) updateData.assetIds = assetIds;
    if (status !== undefined) updateData.status = status;
    if (externalRef !== undefined) updateData.externalRef = externalRef;
    if (errorMsg !== undefined) updateData.error = errorMsg;

    const [updatedTarget] = await db
      .update(socialPostTargets)
      .set(updateData)
      .where(eq(socialPostTargets.id, targetId))
      .returning();

    return NextResponse.json({
      data: updatedTarget,
      message: "Target updated successfully",
    });
  } catch (error) {
    console.error("Error updating target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tenantId = getTenantIdForRequest(request);
    const targetId = id;

    // Verify target belongs to tenant
    const [existingTarget] = await db
      .select({
        target: socialPostTargets,
        post: socialPosts,
      })
      .from(socialPostTargets)
      .innerJoin(socialPosts, eq(socialPostTargets.postId, socialPosts.id))
      .where(
        and(
          eq(socialPostTargets.id, targetId),
          eq(socialPosts.tenantId, tenantId),
        ),
      );

    if (!existingTarget) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    // Delete target
    await db
      .delete(socialPostTargets)
      .where(eq(socialPostTargets.id, targetId));

    return NextResponse.json({
      message: "Target deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting target:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { eq, desc, and } from "drizzle-orm";

// Import video processing jobs from the correct schema file
import { videoProcessingJobs } from "@sass-store/database/video-processing-schema";

// Get tenant ID from request headers (set by middleware)
function getTenantId(request: NextRequest): string {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    throw new Error("Tenant ID required");
  }
  return tenantId;
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from headers
    const tenantId = getTenantId(request);

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // Build query conditions
    const conditions = [eq(videoProcessingJobs.tenantId, tenantId)];

    if (status) {
      conditions.push(eq(videoProcessingJobs.status, status));
    }

    // Get total count for pagination info
    const countQuery = db
      .select({ count: true })
      .from(videoProcessingJobs)
      .where(and(...conditions));

    const [{ count }] = await countQuery;

    // Get jobs with pagination
    const jobs = await db
      .select()
      .from(videoProcessingJobs)
      .where(and(...conditions))
      .orderBy(desc(videoProcessingJobs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      success: true,
      jobs: jobs.map((job) => ({
        id: job.id,
        status: job.status,
        priority: job.priority,
        imageIds: job.imageIds,
        audioFile: job.audioFile,
        textOverlay: job.textOverlay,
        overlayType: job.overlayType,
        qualityMode: job.qualityMode,
        durationTarget: job.durationTarget,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTimeMs: job.processingTimeMs,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        lastError: job.lastError,
        outputVideoUrl: job.outputVideoUrl,
        outputThumbnailUrl: job.outputThumbnailUrl,
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ List jobs error:", error);

    if (error.message.includes("Tenant ID required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

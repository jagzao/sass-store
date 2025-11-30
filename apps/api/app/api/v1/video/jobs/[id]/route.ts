import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { videoProcessingJobs } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

// Get tenant ID from request headers (set by middleware)
function getTenantId(request: NextRequest): string {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    throw new Error("Tenant ID required");
  }
  return tenantId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get tenant ID from headers
    const tenantId = getTenantId(request);

    // Get job details with tenant isolation
    const [job] = await db
      .select()
      .from(videoProcessingJobs)
      .where(
        and(
          eq(videoProcessingJobs.id, params.id),
          eq(videoProcessingJobs.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Calculate progress based on status
    let progress = 0;
    if (job.status === "processing") {
      progress = 50; // In progress
    } else if (job.status === "completed") {
      progress = 100; // Completed
    } else if (job.status === "failed") {
      progress = 0; // Failed
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress,
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
      },
    });
  } catch (error) {
    console.error("❌ Get job status error:", error);

    if (error.message.includes("Tenant ID required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}

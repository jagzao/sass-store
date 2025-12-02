import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@sass-store/database";
import { videoProcessingJobs, mediaAssets } from "@sass-store/database/schema";
import { eq, and, inArray } from "drizzle-orm";

// Validation schema for video processing requests
const videoProcessingSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1).max(10),
  audioFile: z.string().optional(),
  textOverlay: z.string().max(500).optional(),
  overlayType: z
    .enum(["golden-frame", "silver-frame", "no-frame"])
    .default("golden-frame"),
  qualityMode: z.enum(["normal", "eco", "freeze"]).default("normal"),
  durationTarget: z.number().min(5).max(120).optional().default(30),
  priority: z.number().min(0).max(100).default(0),
});

// Get tenant ID from request headers (set by middleware)
function getTenantId(request: NextRequest): string {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    throw new Error("Tenant ID required");
  }
  return tenantId;
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const validatedData = videoProcessingSchema.parse(body);

    // Get tenant ID from headers
    const tenantId = getTenantId(request);

    // Verify that all image assets exist and belong to the tenant
    const imageAssets = await db
      .select()
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.tenantId, tenantId),
          inArray(mediaAssets.id, validatedData.imageIds)
        )
      )
      .limit(validatedData.imageIds.length);

    if (imageAssets.length !== validatedData.imageIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more image assets not found or do not belong to tenant",
          missingAssets: validatedData.imageIds.filter(
            (id) => !imageAssets.some((asset) => asset.id === id)
          ),
        },
        { status: 404 }
      );
    }

    // Create video processing job
    const [job] = await db
      .insert(videoProcessingJobs)
      .values({
        tenantId,
        status: "pending",
        priority: validatedData.priority,
        imageIds: validatedData.imageIds,
        audioFile: validatedData.audioFile,
        textOverlay: validatedData.textOverlay,
        overlayType: validatedData.overlayType,
        qualityMode: validatedData.qualityMode,
        durationTarget: validatedData.durationTarget,
        maxAttempts: 3,
      })
      .returning();

    // Log the job creation for audit purposes
    console.log(
      `✨ Created video processing job ${job.id} for tenant ${tenantId}`
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: "pending",
      estimatedDuration: validatedData.durationTarget,
      message: "Video processing job created successfully",
    });
  } catch (error) {
    console.error("❌ Video processing request error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message.includes("Tenant ID required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create video processing job" },
      { status: 500 }
    );
  }
}

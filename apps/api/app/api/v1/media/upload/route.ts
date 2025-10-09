import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@sass-store/database";
import { mediaAssets, tenantQuotas } from "@sass-store/database";
import { eq, sql } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { validateApiKey } from "@/lib/auth";
import { checkRateLimit, checkTenantQuota } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { MediaProcessor, STANDARD_VARIANTS } from "@/lib/media/processor";

const uploadSchema = z.object({
  assetType: z.enum(["product", "staff", "service", "branding", "gallery"]),
  entityId: z.string().optional(),
  variants: z.array(z.string()).default(["thumb", "card", "hd"]),
  qualityMode: z.enum(["normal", "eco", "freeze"]).default("normal"),
});

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "media:upload");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadataJson = formData.get("metadata") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate metadata
    const metadata = uploadSchema.parse(JSON.parse(metadataJson || "{}"));

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize media processor
    const processor = new MediaProcessor();

    // Validate image
    const validation = processor.validateImage(buffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check storage quota before processing
    const quotaResult = await checkTenantQuota(
      tenant.id,
      "storage",
      buffer.length
    );
    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: "Storage quota exceeded",
          usage: quotaResult.usage,
          limit: quotaResult.limit,
          resetDate: quotaResult.resetDate,
        },
        { status: 429 }
      );
    }

    // Check for existing asset with same content hash
    const contentHash = processor["generateContentHash"](buffer);
    const existingAsset = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.contentHash, contentHash))
      .limit(1);

    if (existingAsset.length > 0) {
      // Check if it belongs to the same tenant
      if (existingAsset[0].tenantId === tenant.id) {
        return NextResponse.json({
          data: existingAsset[0],
          message: "File already exists for this tenant",
        });
      } else {
        // Create a reference to existing asset (deduplication)
        const reference = await db
          .insert(mediaAssets)
          .values({
            tenantId: tenant.id,
            assetType: metadata.assetType,
            entityId: metadata.entityId,
            filename: file.name,
            contentHash,
            originalSize: existingAsset[0].originalSize,
            totalSize: 0, // No additional storage used
            mimeType: file.type,
            width: existingAsset[0].width,
            height: existingAsset[0].height,
            dominantColor: existingAsset[0].dominantColor,
            blurhash: existingAsset[0].blurhash,
            variants: existingAsset[0].variants,
            metadata: {
              deduplicated: true,
              originalAssetId: existingAsset[0].id,
            },
          })
          .returning();

        return NextResponse.json({
          data: reference[0],
          message: "File deduplicated from existing asset",
        });
      }
    }

    // Process image
    const selectedVariants = STANDARD_VARIANTS.filter((v) =>
      metadata.variants.includes(v.name)
    );

    const processed = await processor.processImage(buffer, {
      variants: selectedVariants,
      stripExif: true,
      generateBlurhash: true,
      extractDominantColor: true,
      qualityMode: metadata.qualityMode,
    });

    // Store variants (in production, this would upload to R2)
    const variantKeys: string[] = [];
    for (const [key, variantBuffer] of processed.variants) {
      // For now, just collect the keys
      // In production: await uploadToR2(tenant.slug, metadata.assetType, key, variantBuffer)
      variantKeys.push(key);
    }

    // Save to database
    const newAsset = await db
      .insert(mediaAssets)
      .values({
        tenantId: tenant.id,
        assetType: metadata.assetType,
        entityId: metadata.entityId,
        filename: file.name,
        contentHash: processed.metadata.contentHash,
        originalSize: processed.metadata.originalSize,
        totalSize: processed.metadata.totalSize,
        mimeType: file.type,
        width: processed.metadata.width,
        height: processed.metadata.height,
        dominantColor: processed.metadata.dominantColor,
        blurhash: processed.metadata.blurhash,
        variants: variantKeys,
        metadata: {
          qualityMode: metadata.qualityMode,
          originalFilename: file.name,
        },
      })
      .returning();

    // Update tenant quota usage
    await db
      .update(tenantQuotas)
      .set({
        storageUsedBytes: quotaResult.usage + processed.metadata.totalSize,
        mediaCount: sql`media_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tenantQuotas.tenantId, tenant.id));

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: authResult.userId,
      action: "media:upload",
      targetTable: "media_assets",
      targetId: newAsset[0].id,
      data: {
        uploaded: {
          filename: file.name,
          size: processed.metadata.originalSize,
          variants: variantKeys.length,
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          ...newAsset[0],
          urls: generateAssetUrls(
            tenant.slug,
            metadata.assetType,
            newAsset[0].id,
            variantKeys
          ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Media upload error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid metadata", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateAssetUrls(
  tenantSlug: string,
  assetType: string,
  assetId: string,
  variants: string[]
): Record<string, string> {
  const baseUrl = process.env.MEDIA_CDN_URL || "https://media.sassstore.com";
  const urls: Record<string, string> = {};

  variants.forEach((variant) => {
    const [name, format] = variant.split(".");
    urls[variant] =
      `${baseUrl}/tenants/${tenantSlug}/${assetType}/${assetId}/${variant}`;
  });

  return urls;
}

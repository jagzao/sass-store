import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createHash } from "crypto";
import { db } from "@sass-store/database";
import {
  mediaAssets,
  tenantQuotas,
  tenants,
} from "@sass-store/database/schema";
import { eq, sql } from "drizzle-orm";

import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";

export const dynamic = "force-dynamic";

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

interface UploadRequestData {
  file: File;
  tenantSlug: string;
  assetType: string;
}

interface UploadResultData {
  mediaId: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  variants: Array<{
    preset: string;
    url: string;
    width?: number;
    height?: number;
    durationMs?: number;
  }>;
  isBase64?: boolean;
}

interface UploadPayload {
  url: string;
  width?: number;
  height?: number;
  durationMs?: number;
  isBase64: boolean;
}

const parseUploadRequest = async (
  request: NextRequest,
): Promise<Result<UploadRequestData, DomainError>> => {
  const formDataResult = await fromPromise(request.formData(), (error) =>
    ErrorFactories.validation(
      "Invalid multipart form data",
      "formData",
      undefined,
      error,
    ),
  );

  if (!formDataResult.success) {
    return formDataResult;
  }

  const formData = formDataResult.data;
  const file = formData.get("file");
  const tenantSlugValue = formData.get("tenant");
  const assetTypeValue = formData.get("assetType");

  if (!(file instanceof File)) {
    return Err(ErrorFactories.validation("File is required", "file"));
  }

  if (typeof tenantSlugValue !== "string" || !tenantSlugValue.trim()) {
    return Err(ErrorFactories.validation("Tenant is required", "tenant"));
  }

  const assetType =
    typeof assetTypeValue === "string" && assetTypeValue.trim()
      ? assetTypeValue.trim()
      : "social";

  return Ok({
    file,
    tenantSlug: tenantSlugValue.trim(),
    assetType,
  });
};

const validateFile = (
  file: File,
): Result<{ isVideo: boolean }, DomainError> => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return Err(
      ErrorFactories.validation("File must be an image or video", "file"),
    );
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return Err(
      ErrorFactories.validation(
        `File size must be less than ${isVideo ? "50MB" : "5MB"}`,
        "file",
        file.size,
      ),
    );
  }

  return Ok({ isVideo });
};

const getTenantId = async (
  tenantSlug: string,
): Promise<Result<string, DomainError>> => {
  const tenantResult = await fromPromise(
    db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "find_tenant",
        `Failed to find tenant ${tenantSlug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!tenantResult.success) {
    return tenantResult;
  }

  if (!tenantResult.data || tenantResult.data.length === 0) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }

  return Ok(tenantResult.data[0].id);
};

const setTenantContext = async (
  tenantId: string,
): Promise<Result<void, DomainError>> => {
  const contextResult = await fromPromise(
    db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`),
    (error) =>
      ErrorFactories.database(
        "set_tenant_context",
        "Failed to set tenant context",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!contextResult.success) {
    return contextResult;
  }

  return Ok(undefined);
};

const checkTenantQuota = async (
  tenantId: string,
  fileSize: number,
): Promise<Result<void, DomainError>> => {
  const quotaResult = await fromPromise(
    db
      .select({
        storageUsedBytes: tenantQuotas.storageUsedBytes,
        storageLimitBytes: tenantQuotas.storageLimitBytes,
        mediaCount: tenantQuotas.mediaCount,
        mediaLimit: tenantQuotas.mediaLimit,
      })
      .from(tenantQuotas)
      .where(eq(tenantQuotas.tenantId, tenantId))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "fetch_tenant_quota",
        "Failed to fetch tenant quota",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!quotaResult.success) {
    return quotaResult;
  }

  const quota = quotaResult.data[0];
  if (!quota) {
    return Ok(undefined);
  }

  const storageUsed = Number(quota.storageUsedBytes ?? 0);
  const storageLimit = Number(quota.storageLimitBytes ?? 0);
  const mediaCount = Number(quota.mediaCount ?? 0);
  const mediaLimit = Number(quota.mediaLimit ?? 0);

  if (storageLimit > 0 && storageUsed + fileSize > storageLimit) {
    return Err(
      ErrorFactories.businessRule(
        "tenant_storage_quota_exceeded",
        "Storage quota exceeded",
        "TENANT_STORAGE_QUOTA_EXCEEDED",
      ),
    );
  }

  if (mediaLimit > 0 && mediaCount + 1 > mediaLimit) {
    return Err(
      ErrorFactories.businessRule(
        "tenant_media_quota_exceeded",
        "Media count quota exceeded",
        "TENANT_MEDIA_QUOTA_EXCEEDED",
      ),
    );
  }

  return Ok(undefined);
};

const uploadToCloudinary = async (
  buffer: Buffer,
  file: File,
  tenantSlug: string,
): Promise<Result<UploadPayload, DomainError>> => {
  if (!cloudinaryConfigured) {
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    return Ok({ url: dataUrl, isBase64: true });
  }

  const uploadResult = await fromPromise(
    new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `sass-store/social/${tenantSlug}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Upload failed"));
          }
        },
      );

      uploadStream.end(buffer);
    }),
    (error) =>
      ErrorFactories.storage(
        "upload_cloudinary",
        "Failed to upload media to Cloudinary",
        file.name,
        "cloudinary",
        error instanceof Error ? error : undefined,
      ),
  );

  if (!uploadResult.success) {
    return uploadResult;
  }

  const result = uploadResult.data;
  return Ok({
    url: result.secure_url,
    width: result.width,
    height: result.height,
    durationMs: result.duration
      ? Math.round(result.duration * 1000)
      : undefined,
    isBase64: false,
  });
};

const findExistingMedia = async (
  contentHash: string,
): Promise<Result<UploadResultData | null, DomainError>> => {
  const existingResult = await fromPromise(
    db
      .select({
        id: mediaAssets.id,
        mimeType: mediaAssets.mimeType,
        width: mediaAssets.width,
        height: mediaAssets.height,
        variants: mediaAssets.variants,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.contentHash, contentHash))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "find_media",
        "Failed to check existing media",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!existingResult.success) {
    return existingResult;
  }

  const existing = existingResult.data[0];
  if (!existing) {
    return Ok(null);
  }

  const variants = Array.isArray(existing.variants)
    ? existing.variants
    : ([] as UploadResultData["variants"]);
  const primaryUrl =
    variants[0]?.url ||
    (typeof (existing as any).url === "string" ? (existing as any).url : "");

  return Ok({
    mediaId: existing.id,
    url: primaryUrl,
    mimeType: existing.mimeType,
    width: existing.width ?? undefined,
    height: existing.height ?? undefined,
    variants,
  });
};

const persistMediaAsset = async (params: {
  tenantId: string;
  assetType: string;
  file: File;
  contentHash: string;
  payload: UploadPayload;
}): Promise<Result<UploadResultData, DomainError>> => {
  const { tenantId, assetType, file, contentHash, payload } = params;
  const variants = [
    {
      preset: "original",
      url: payload.url,
      width: payload.width,
      height: payload.height,
      durationMs: payload.durationMs,
    },
  ];

  const insertResult = await fromPromise(
    db
      .insert(mediaAssets)
      .values({
        tenantId,
        assetType,
        entityId: null,
        filename: file.name,
        contentHash,
        originalSize: file.size,
        totalSize: file.size,
        mimeType: file.type,
        width: payload.width ?? null,
        height: payload.height ?? null,
        dominantColor: null,
        blurhash: null,
        variants,
        metadata: {
          source: "social_media_upload",
          isBase64: payload.isBase64,
        },
      })
      .returning({
        id: mediaAssets.id,
        mimeType: mediaAssets.mimeType,
        width: mediaAssets.width,
        height: mediaAssets.height,
      }),
    (error) =>
      ErrorFactories.database(
        "insert_media",
        "Failed to create media asset",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!insertResult.success) {
    return insertResult;
  }

  const inserted = insertResult.data[0];
  return Ok({
    mediaId: inserted.id,
    url: payload.url,
    mimeType: inserted.mimeType,
    width: inserted.width ?? undefined,
    height: inserted.height ?? undefined,
    durationMs: payload.durationMs,
    variants,
    isBase64: payload.isBase64,
  });
};

const updateTenantQuotaUsage = async (
  tenantId: string,
  fileSize: number,
): Promise<Result<void, DomainError>> => {
  const updateResult = await fromPromise(
    db
      .update(tenantQuotas)
      .set({
        storageUsedBytes: sql`${tenantQuotas.storageUsedBytes} + ${fileSize}`,
        mediaCount: sql`${tenantQuotas.mediaCount} + 1`,
      })
      .where(eq(tenantQuotas.tenantId, tenantId)),
    (error) =>
      ErrorFactories.database(
        "update_tenant_quota",
        "Failed to update tenant quota usage",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!updateResult.success) {
    return updateResult;
  }

  return Ok(undefined);
};

export const POST = withResultHandler(
  async (
    request: NextRequest,
  ): Promise<Result<UploadResultData, DomainError>> => {
    const requestResult = await parseUploadRequest(request);
    if (!requestResult.success) {
      return requestResult;
    }

    const { file, tenantSlug, assetType } = requestResult.data;

    const fileValidation = validateFile(file);
    if (!fileValidation.success) {
      return fileValidation;
    }

    const tenantIdResult = await getTenantId(tenantSlug);
    if (!tenantIdResult.success) {
      return tenantIdResult;
    }

    const tenantId = tenantIdResult.data;

    const contextResult = await setTenantContext(tenantId);
    if (!contextResult.success) {
      return contextResult;
    }

    const quotaResult = await checkTenantQuota(tenantId, file.size);
    if (!quotaResult.success) {
      return quotaResult;
    }

    const bufferResult = await fromPromise(file.arrayBuffer(), (error) =>
      ErrorFactories.storage(
        "read_media",
        "Failed to read media file",
        file.name,
        "memory",
        error instanceof Error ? error : undefined,
      ),
    );

    if (!bufferResult.success) {
      return bufferResult;
    }

    const buffer = Buffer.from(bufferResult.data);
    const contentHash = createHash("sha256").update(buffer).digest("hex");

    const existingMediaResult = await findExistingMedia(contentHash);
    if (!existingMediaResult.success) {
      return existingMediaResult;
    }

    if (existingMediaResult.data) {
      return Ok(existingMediaResult.data);
    }

    const uploadResult = await uploadToCloudinary(buffer, file, tenantSlug);
    if (!uploadResult.success) {
      return uploadResult;
    }

    const persistResult = await persistMediaAsset({
      tenantId,
      assetType,
      file,
      contentHash,
      payload: uploadResult.data,
    });

    if (!persistResult.success) {
      return persistResult;
    }

    const quotaUpdateResult = await updateTenantQuotaUsage(tenantId, file.size);
    if (!quotaUpdateResult.success) {
      return quotaUpdateResult;
    }

    return Ok(persistResult.data);
  },
);

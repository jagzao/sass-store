import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sass-store-media";

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID) {
  console.warn("R2 credentials not configured. Media uploads will fail.");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  etag?: string;
}

export class R2Storage {
  private bucketName: string;

  constructor(bucketName: string = R2_BUCKET_NAME) {
    this.bucketName = bucketName;
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    options: {
      cacheControl?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    if (!R2_ACCESS_KEY_ID) {
      throw new Error("R2 storage not configured");
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: options.cacheControl || "public, max-age=31536000", // 1 year
      Metadata: options.metadata,
    });

    const result = await s3Client.send(command);

    return {
      key,
      url: this.getPublicUrl(key),
      size: buffer.length,
      etag: result.ETag,
    };
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    if (!R2_ACCESS_KEY_ID) {
      throw new Error("R2 storage not configured");
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Check if a file exists in R2
   */
  async fileExists(key: string): Promise<boolean> {
    if (!R2_ACCESS_KEY_ID) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    // Use Cloudflare R2 public bucket URL or custom CDN
    const baseUrl =
      process.env.R2_PUBLIC_URL ||
      `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.bucketName}`;

    return `${baseUrl}/${key}`;
  }

  /**
   * Generate R2 key for media asset
   */
  static generateMediaKey(
    tenantSlug: string,
    assetType: string,
    assetId: string,
    variant: string
  ): string {
    return `tenants/${tenantSlug}/${assetType}/${assetId}/${variant}`;
  }

  /**
   * Upload media variants to R2
   */
  async uploadMediaVariants(
    tenantSlug: string,
    assetType: string,
    assetId: string,
    variants: Map<string, Buffer>
  ): Promise<Record<string, UploadResult>> {
    const results: Record<string, UploadResult> = {};

    for (const [variantKey, buffer] of variants) {
      const r2Key = R2Storage.generateMediaKey(
        tenantSlug,
        assetType,
        assetId,
        variantKey
      );

      // Determine content type from file extension
      const contentType = this.getContentTypeFromVariant(variantKey);

      const result = await this.uploadFile(r2Key, buffer, contentType, {
        cacheControl: "public, max-age=31536000", // 1 year cache for media
        metadata: {
          tenant: tenantSlug,
          assetType,
          assetId,
          variant: variantKey,
        },
      });

      results[variantKey] = result;
    }

    return results;
  }

  /**
   * Delete all variants of a media asset
   */
  async deleteMediaVariants(
    tenantSlug: string,
    assetType: string,
    assetId: string,
    variants: string[]
  ): Promise<void> {
    const deletePromises = variants.map((variant) => {
      const r2Key = R2Storage.generateMediaKey(
        tenantSlug,
        assetType,
        assetId,
        variant
      );
      return this.deleteFile(r2Key);
    });

    await Promise.allSettled(deletePromises);
  }

  private getContentTypeFromVariant(variant: string): string {
    if (variant.endsWith(".avif")) return "image/avif";
    if (variant.endsWith(".webp")) return "image/webp";
    if (variant.endsWith(".jpeg") || variant.endsWith(".jpg"))
      return "image/jpeg";
    if (variant.endsWith(".png")) return "image/png";
    return "application/octet-stream";
  }
}

// Export singleton instance
export const r2Storage = new R2Storage();

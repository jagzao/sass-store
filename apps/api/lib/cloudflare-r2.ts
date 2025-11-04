import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 Configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sass-store-media";

// Initialize R2 client
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to Cloudflare R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
  tenantId: string
): Promise<{ url: string; key: string }> {
  const tenantKey = `tenants/${tenantId}/${key}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: tenantKey,
    Body: file,
    ContentType: contentType,
    Metadata: {
      tenantId,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  // Generate public URL (assuming bucket is configured for public access)
  const publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${tenantKey}`;

  return {
    url: publicUrl,
    key: tenantKey,
  };
}

/**
 * Generate signed URL for private file access
 */
export async function getSignedR2Url(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Check if R2 is properly configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCOUNT_ID);
}

/**
 * Generate optimized image URLs with Cloudflare Image Resizing
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (!originalUrl.includes("r2.cloudflarestorage.com")) {
    return originalUrl;
  }

  const baseUrl = originalUrl.replace("https://", "https://images.");
  const params = new URLSearchParams();

  if (width) params.set("width", width.toString());
  if (height) params.set("height", height.toString());
  params.set("quality", quality.toString());
  params.set("format", "auto");

  return `${baseUrl}?${params.toString()}`;
}

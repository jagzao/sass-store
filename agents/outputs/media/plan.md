# Media Management Plan - Cloudflare R2 Structure

## Overview

Optimized media pipeline with pre-processing, multiple variants, and tenant-based organization for cost-effective storage under $5/month budget.

## R2 Storage Structure

### Directory Organization

```
tenants/
├── {tenant_slug}/
│   ├── branding/
│   │   ├── logo.{variant}.{ext}
│   │   ├── favicon.{variant}.{ext}
│   │   └── banner.{variant}.{ext}
│   ├── products/
│   │   └── {sku}/
│   │       ├── hero.{variant}.{ext}
│   │       ├── gallery-{n}.{variant}.{ext}
│   │       └── thumbnail.{variant}.{ext}
│   ├── services/
│   │   └── {service_id}/
│   │       └── image.{variant}.{ext}
│   ├── staff/
│   │   └── {staff_id}/
│   │       └── photo.{variant}.{ext}
│   └── gallery/
│       └── {asset_id}/
│           ├── thumb.{ext}
│           ├── card.{ext}
│           └── hd.{ext}
└── shared/
    ├── placeholders/
    └── templates/
```

### Example Paths

```
tenants/wondernails/branding/logo.thumb.avif
tenants/wondernails/branding/logo.card.webp
tenants/wondernails/branding/logo.hd.jpg
tenants/wondernails/products/wn-polish-sunset/hero.thumb.avif
tenants/wondernails/products/wn-polish-sunset/gallery-1.card.webp
tenants/wondernails/staff/maria-gonzalez/photo.card.avif
tenants/vigistudio/services/haircut-style/image.thumb.webp
```

## Image Variants & Quality Settings

### Variant Sizes

| Variant   | Dimensions | Use Case                  | Quality |
| --------- | ---------- | ------------------------- | ------- |
| **thumb** | 150x150    | Lists, avatars, icons     | 70%     |
| **card**  | 400x300    | Product cards, grid views | 80%     |
| **hd**    | 1200x900   | Detail views, hero images | 85%     |

### Format Priority (Best to Fallback)

1. **AVIF** - Next-gen format, 50% smaller than JPEG
2. **WebP** - Modern format, 30% smaller than JPEG
3. **JPEG** - Universal fallback, optimized quality

### Quality Settings by Mode

```javascript
const qualitySettings = {
  normal: { avif: 85, webp: 80, jpeg: 85 },
  eco: { avif: 70, webp: 65, jpeg: 70 }, // 50% budget threshold
  freeze: { avif: 60, webp: 55, jpeg: 60 }, // 90% budget threshold
};
```

## Processing Pipeline

### Upload Flow

```
1. Upload → 2. Validate → 3. EXIF Strip → 4. Generate Variants → 5. Store → 6. Index
```

### Pre-Processing Steps

1. **EXIF Removal**: Strip metadata for privacy and size reduction
2. **Format Detection**: Validate image type and dimensions
3. **Content Hash**: Generate SHA-256 for deduplication
4. **Dominant Color**: Extract primary color for placeholders
5. **Blurhash**: Generate blur placeholder for loading states

### Variant Generation

```javascript
async function generateVariants(imageBuffer, options) {
  const variants = {};

  for (const [variantName, size] of Object.entries(VARIANT_SIZES)) {
    // Resize image
    const resized = await sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: "cover",
        position: "center",
      })
      .toBuffer();

    // Generate formats
    variants[`${variantName}.avif`] = await sharp(resized)
      .avif({ quality: options.quality.avif })
      .toBuffer();

    variants[`${variantName}.webp`] = await sharp(resized)
      .webp({ quality: options.quality.webp })
      .toBuffer();

    variants[`${variantName}.jpg`] = await sharp(resized)
      .jpeg({ quality: options.quality.jpeg, mozjpeg: true })
      .toBuffer();
  }

  return variants;
}
```

## Database Schema

### Media Assets Table

```sql
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    asset_type VARCHAR(50) NOT NULL, -- 'product', 'staff', 'service', 'branding'
    entity_id VARCHAR(100), -- SKU, staff_id, service_id, etc.
    filename VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 for deduplication
    original_size INTEGER NOT NULL,
    total_size INTEGER NOT NULL, -- Sum of all variants
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    dominant_color VARCHAR(7), -- Hex color
    blurhash VARCHAR(255),
    variants JSONB NOT NULL, -- Array of available variants
    metadata JSONB, -- Additional metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_asset_type CHECK (asset_type IN ('product', 'staff', 'service', 'branding', 'gallery'))
);

-- Indexes
CREATE INDEX idx_media_assets_tenant_type ON media_assets(tenant_id, asset_type);
CREATE INDEX idx_media_assets_entity ON media_assets(tenant_id, entity_id);
CREATE INDEX idx_media_assets_hash ON media_assets(content_hash);
```

### Quota Tracking Table

```sql
CREATE TABLE tenant_quotas (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    storage_used_bytes BIGINT DEFAULT 0,
    storage_limit_bytes BIGINT DEFAULT 5368709120, -- 5GB default
    media_count INTEGER DEFAULT 0,
    media_limit INTEGER DEFAULT 1000,
    bandwidth_used_bytes BIGINT DEFAULT 0,
    bandwidth_limit_bytes BIGINT DEFAULT 53687091200, -- 50GB default
    reset_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Deduplication Strategy

### Content-Based Deduplication

```javascript
async function handleUpload(file, tenantId, entityId) {
  // 1. Generate content hash
  const contentHash = crypto
    .createHash("sha256")
    .update(file.buffer)
    .digest("hex");

  // 2. Check for existing asset
  const existing = await db.mediaAssets.findOne({
    where: { contentHash },
  });

  if (existing && existing.tenantId === tenantId) {
    // Same tenant, same file - return existing
    return {
      success: true,
      asset: existing,
      message: "File already exists",
    };
  }

  if (existing && existing.tenantId !== tenantId) {
    // Different tenant, same file - create reference
    const reference = await db.mediaAssets.create({
      tenantId,
      entityId,
      contentHash,
      filename: file.originalname,
      // Copy metadata from existing
      originalSize: existing.originalSize,
      totalSize: 0, // No additional storage used
      variants: existing.variants,
      dominantColor: existing.dominantColor,
      blurhash: existing.blurhash,
    });

    return {
      success: true,
      asset: reference,
      message: "Deduplicated from existing file",
    };
  }

  // New file - process and store
  return await processNewFile(file, tenantId, entityId, contentHash);
}
```

## Quota Management

### Storage Quotas by Tenant Tier

```javascript
const TENANT_TIERS = {
  starter: {
    storageGB: 5,
    monthlyBandwidthGB: 50,
    mediaCount: 1000,
  },
  professional: {
    storageGB: 20,
    monthlyBandwidthGB: 200,
    mediaCount: 5000,
  },
  enterprise: {
    storageGB: 100,
    monthlyBandwidthGB: 1000,
    mediaCount: 25000,
  },
};
```

### Quota Enforcement

```javascript
async function enforceQuotas(tenantId, uploadSize) {
  const quota = await getQuotaUsage(tenantId);
  const limits = TENANT_TIERS[quota.tier];

  // Check storage limit
  if (quota.storageUsed + uploadSize > limits.storageGB * 1024 * 1024 * 1024) {
    throw new QuotaExceededError("Storage limit exceeded");
  }

  // Check media count limit
  if (quota.mediaCount >= limits.mediaCount) {
    throw new QuotaExceededError("Media count limit exceeded");
  }

  // Check monthly bandwidth (for CDN serving)
  if (quota.bandwidthUsed > limits.monthlyBandwidthGB * 1024 * 1024 * 1024) {
    throw new QuotaExceededError("Monthly bandwidth limit exceeded");
  }

  return true;
}
```

## CDN & Caching Strategy

### R2 Custom Domain Setup

```
media.sassstore.com → Cloudflare R2 bucket
```

### Cache Headers

```javascript
const cacheHeaders = {
  "Cache-Control": "public, max-age=31536000, immutable", // 1 year
  ETag: contentHash,
  Vary: "Accept", // For format negotiation
};
```

### Format Negotiation

```javascript
// Cloudflare Worker for format negotiation
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = request.headers.get("accept") || "";

    // Determine best format
    let format = "jpg"; // fallback
    if (accept.includes("image/avif")) {
      format = "avif";
    } else if (accept.includes("image/webp")) {
      format = "webp";
    }

    // Rewrite URL to include format
    const newPath = url.pathname.replace(
      /\.(jpg|jpeg|webp|avif)$/,
      `.${format}`,
    );
    const newUrl = new URL(newPath, url.origin);

    return fetch(newUrl.toString(), {
      headers: request.headers,
    });
  },
};
```

## Backup & Versioning

### Versioning Strategy

```
tenants/{slug}/products/{sku}/hero.v1.card.avif
tenants/{slug}/products/{sku}/hero.v2.card.avif
tenants/{slug}/products/{sku}/hero.current.card.avif → symlink to latest
```

### Cleanup Policy

```javascript
const CLEANUP_POLICIES = {
  // Keep last 3 versions for 30 days
  productImages: { versions: 3, days: 30 },

  // Keep last 5 versions for 90 days
  brandingImages: { versions: 5, days: 90 },

  // Keep last 2 versions for 14 days
  staffPhotos: { versions: 2, days: 14 },
};
```

## Cost Optimization

### Cost Breakdown (Target: <$1/month)

- **R2 Storage**: $0.015/GB/month (5GB = $0.075)
- **R2 Operations**: $0.36/million (estimate 100k/month = $0.036)
- **R2 Egress**: $0.09/GB (estimate 10GB/month = $0.90)
- **Total Estimated**: ~$1.00/month per tenant

### Cost Monitoring

```javascript
// Daily cost check worker
export default {
  async scheduled(event, env, ctx) {
    const usage = await calculateR2Usage(env);
    const cost = calculateCost(usage);

    if (cost > MONTHLY_BUDGET * 0.8) {
      await enableEcoMode(env);
      await sendAlert("80% budget consumed");
    }

    if (cost > MONTHLY_BUDGET * 0.9) {
      await enableFreezeMode(env);
      await sendAlert("90% budget consumed - freeze mode");
    }
  },
};
```

## Error Handling & Graceful Degradation

### Upload Failures

```javascript
async function handleUploadError(error, file, tenantId) {
  switch (error.type) {
    case "QUOTA_EXCEEDED":
      return {
        success: false,
        error: "Storage quota exceeded. Please upgrade your plan.",
        suggestedAction: "upgrade",
      };

    case "FILE_TOO_LARGE":
      return {
        success: false,
        error: "File size exceeds maximum limit of 10MB.",
        suggestedAction: "resize",
      };

    case "INVALID_FORMAT":
      return {
        success: false,
        error: "Unsupported file format. Please use JPEG, PNG, or WebP.",
        suggestedAction: "convert",
      };

    default:
      await logError(error, { file: file.originalname, tenantId });
      return {
        success: false,
        error: "Upload failed. Please try again.",
        suggestedAction: "retry",
      };
  }
}
```

### Serving Fallbacks

```javascript
// If variant doesn't exist, serve next best option
const FALLBACK_CHAIN = {
  "thumb.avif": ["thumb.webp", "thumb.jpg", "card.webp", "card.jpg"],
  "card.avif": ["card.webp", "card.jpg", "hd.webp", "hd.jpg"],
  "hd.avif": ["hd.webp", "hd.jpg", "card.webp", "card.jpg"],
};

async function serveWithFallback(path, variants) {
  for (const fallback of FALLBACK_CHAIN[path] || []) {
    if (variants.includes(fallback)) {
      return await fetch(`/media/${fallback}`);
    }
  }

  // Ultimate fallback - placeholder
  return await fetch("/media/placeholders/default.svg");
}
```

## Security Considerations

### Upload Validation

```javascript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSIONS = { width: 4000, height: 4000 };

async function validateUpload(file) {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError("Invalid file type");
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File too large");
  }

  // Check image dimensions
  const metadata = await sharp(file.buffer).metadata();
  if (
    metadata.width > MAX_DIMENSIONS.width ||
    metadata.height > MAX_DIMENSIONS.height
  ) {
    throw new ValidationError("Image dimensions too large");
  }

  // Scan for malicious content
  await scanForMalware(file.buffer);

  return true;
}
```

### Access Control

```javascript
// R2 bucket policy - deny direct access, require signed URLs
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sass-store-media/*",
      "Condition": {
        "Bool": {
          "aws:ViaCloudFront": "false"
        }
      }
    }
  ]
}
```

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] R2 bucket setup with custom domain
- [ ] Cloudflare Worker for format negotiation
- [ ] Database schema for media assets
- [ ] Basic upload/processing pipeline

### Phase 2: Optimization

- [ ] Variant generation system
- [ ] Deduplication logic
- [ ] Quota enforcement
- [ ] Blurhash/dominant color extraction

### Phase 3: Advanced Features

- [ ] Cost monitoring and alerts
- [ ] Cleanup/versioning system
- [ ] Performance monitoring
- [ ] Graceful degradation

### Phase 4: Polish

- [ ] Error handling improvements
- [ ] Security hardening
- [ ] Documentation and testing
- [ ] Monitoring and alerting

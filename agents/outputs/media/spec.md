# Image Optimization Pipeline Specifications

## Overview

Comprehensive specifications for the pre-processing image optimization pipeline that processes all images before storage in Cloudflare R2. The system is designed for cost efficiency (≤$5/month), performance, and graceful degradation.

## 1. Variant Specifications

### 1.1 Exact Dimensions and Aspect Ratios

```javascript
const VARIANT_SPECIFICATIONS = {
  thumb: {
    width: 150,
    height: 150,
    aspectRatio: "1:1",
    fit: "cover",
    position: "center",
    purpose: "Lists, avatars, icons, quick previews",
    maxFileSize: "15KB", // Target size
  },
  card: {
    width: 400,
    height: 300,
    aspectRatio: "4:3",
    fit: "cover",
    position: "center",
    purpose: "Product cards, grid views, gallery thumbnails",
    maxFileSize: "50KB", // Target size
  },
  hd: {
    width: 1200,
    height: 900,
    aspectRatio: "4:3",
    fit: "inside", // Preserve aspect ratio for detail views
    position: "center",
    purpose: "Detail views, hero images, full-screen display",
    maxFileSize: "200KB", // Target size
  },
};
```

### 1.2 Smart Cropping Algorithm

```javascript
async function smartCrop(imageBuffer, targetWidth, targetHeight) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  // Calculate crop area using entropy-based smart cropping
  const cropArea = await image
    .extract({
      left: Math.max(0, Math.floor((metadata.width - targetWidth) / 2)),
      top: Math.max(0, Math.floor((metadata.height - targetHeight) / 2)),
      width: Math.min(targetWidth, metadata.width),
      height: Math.min(targetHeight, metadata.height),
    })
    .resize(targetWidth, targetHeight, {
      fit: "cover",
      position: sharp.strategy.entropy, // Focus on areas with most detail
    });

  return cropArea;
}
```

## 2. Quality Settings

### 2.1 Quality Modes with Specific Compression Levels

```javascript
const QUALITY_SETTINGS = {
  normal: {
    description: "Default quality for standard operations",
    threshold: "Usage < 50% of monthly budget",
    settings: {
      avif: {
        quality: 85,
        effort: 4,
        chromaSubsampling: "4:2:0",
      },
      webp: {
        quality: 80,
        effort: 4,
        method: 6,
      },
      jpeg: {
        quality: 85,
        progressive: true,
        mozjpeg: true,
        optimizeScans: true,
      },
    },
  },

  eco: {
    description: "Reduced quality to conserve bandwidth/storage",
    threshold: "Usage 50-90% of monthly budget",
    settings: {
      avif: {
        quality: 70,
        effort: 3,
        chromaSubsampling: "4:2:0",
      },
      webp: {
        quality: 65,
        effort: 3,
        method: 4,
      },
      jpeg: {
        quality: 70,
        progressive: true,
        mozjpeg: true,
        optimizeScans: false,
      },
    },
  },

  freeze: {
    description: "Minimal quality for budget preservation",
    threshold: "Usage > 90% of monthly budget",
    settings: {
      avif: {
        quality: 60,
        effort: 2,
        chromaSubsampling: "4:2:0",
      },
      webp: {
        quality: 55,
        effort: 2,
        method: 3,
      },
      jpeg: {
        quality: 60,
        progressive: false,
        mozjpeg: true,
        optimizeScans: false,
      },
    },
  },
};
```

### 2.2 Dynamic Quality Adjustment

```javascript
async function getDynamicQualityMode(tenantId) {
  const usage = await calculateMonthlyUsage(tenantId);
  const budget = await getTenantBudget(tenantId);
  const usagePercent = (usage.totalCost / budget) * 100;

  if (usagePercent < 50) return "normal";
  if (usagePercent < 90) return "eco";
  return "freeze";
}
```

## 3. AVIF/WebP Fallback Pipeline

### 3.1 Format Detection and Priority

```javascript
const FORMAT_PRIORITIES = {
  primary: "avif", // Best compression, modern browsers
  secondary: "webp", // Good compression, wide support
  fallback: "jpeg", // Universal compatibility
};

const BROWSER_SUPPORT = {
  avif: ["Chrome >= 85", "Firefox >= 93", "Safari >= 16"],
  webp: ["Chrome >= 23", "Firefox >= 65", "Safari >= 14"],
  jpeg: ["All browsers"],
};
```

### 3.2 Conversion Pipeline Implementation

```javascript
async function generateAllFormats(imageBuffer, variant, qualityMode) {
  const quality = QUALITY_SETTINGS[qualityMode].settings;
  const results = {};

  try {
    // Generate AVIF (highest priority)
    results.avif = await sharp(imageBuffer)
      .avif({
        quality: quality.avif.quality,
        effort: quality.avif.effort,
        chromaSubsampling: quality.avif.chromaSubsampling,
      })
      .toBuffer();

    // Generate WebP (fallback)
    results.webp = await sharp(imageBuffer)
      .webp({
        quality: quality.webp.quality,
        effort: quality.webp.effort,
        method: quality.webp.method,
      })
      .toBuffer();

    // Generate JPEG (universal fallback)
    results.jpeg = await sharp(imageBuffer)
      .jpeg({
        quality: quality.jpeg.quality,
        progressive: quality.jpeg.progressive,
        mozjpeg: quality.jpeg.mozjpeg,
        optimizeScans: quality.jpeg.optimizeScans,
      })
      .toBuffer();
  } catch (error) {
    console.error(`Format conversion error for ${variant}:`, error);
    // Ensure at least JPEG fallback exists
    if (!results.jpeg) {
      results.jpeg = await sharp(imageBuffer).jpeg({ quality: 80 }).toBuffer();
    }
  }

  return results;
}
```

### 3.3 Format Selection Logic

```javascript
function selectOptimalFormat(userAgent, acceptHeader) {
  // Check Accept header first
  if (acceptHeader) {
    if (acceptHeader.includes("image/avif")) return "avif";
    if (acceptHeader.includes("image/webp")) return "webp";
  }

  // Fallback to user agent detection
  const ua = userAgent.toLowerCase();

  // AVIF support detection
  if (ua.includes("chrome/") && extractVersion(ua, "chrome/") >= 85)
    return "avif";
  if (ua.includes("firefox/") && extractVersion(ua, "firefox/") >= 93)
    return "avif";
  if (ua.includes("safari/") && extractVersion(ua, "version/") >= 16)
    return "avif";

  // WebP support detection
  if (ua.includes("chrome/") && extractVersion(ua, "chrome/") >= 23)
    return "webp";
  if (ua.includes("firefox/") && extractVersion(ua, "firefox/") >= 65)
    return "webp";
  if (ua.includes("safari/") && extractVersion(ua, "version/") >= 14)
    return "webp";

  // Universal fallback
  return "jpeg";
}
```

## 4. EXIF Removal Process

### 4.1 Privacy and Size Optimization

```javascript
async function stripEXIFData(imageBuffer) {
  try {
    // Extract useful metadata before stripping
    const metadata = await sharp(imageBuffer).metadata();
    const preservedData = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      orientation: metadata.orientation,
      colorSpace: metadata.space,
    };

    // Strip all EXIF data including:
    // - GPS coordinates
    // - Camera settings
    // - Software information
    // - Timestamps
    // - Device information
    const cleanImage = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .withMetadata(false) // Remove all metadata
      .toBuffer();

    return {
      buffer: cleanImage,
      metadata: preservedData,
      sizeSavings: imageBuffer.length - cleanImage.length,
    };
  } catch (error) {
    console.error("EXIF stripping failed:", error);
    // Return original if stripping fails
    return {
      buffer: imageBuffer,
      metadata: {},
      sizeSavings: 0,
    };
  }
}
```

### 4.2 Metadata Preservation Strategy

```javascript
const METADATA_WHITELIST = {
  technical: ["width", "height", "format", "colorSpace", "density"],
  orientation: ["orientation"], // For proper display
  quality: ["quality", "compression"],
  // Privacy-sensitive data ALWAYS removed:
  // - GPS coordinates
  // - Camera make/model
  // - Software versions
  // - Timestamps
  // - User comments
};
```

## 5. Blurhash and Dominant Color Generation

### 5.1 Blurhash Implementation

```javascript
async function generateBlurhash(imageBuffer) {
  try {
    // Resize to small size for blurhash processing (faster)
    const smallImage = await sharp(imageBuffer)
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Generate blurhash with 4x3 components (good balance of detail/size)
    const blurhash = encode(
      new Uint8ClampedArray(smallImage.data),
      smallImage.info.width,
      smallImage.info.height,
      4, // X components
      3, // Y components
    );

    return blurhash;
  } catch (error) {
    console.error("Blurhash generation failed:", error);
    return "L6PZfSi_.AyE_3t7t7R**0o#DgR4"; // Default gray blurhash
  }
}
```

### 5.2 Dominant Color Extraction

```javascript
async function extractDominantColor(imageBuffer) {
  try {
    // Resize and reduce to get dominant color more efficiently
    const stats = await sharp(imageBuffer)
      .resize(1, 1, { kernel: "cubic" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const [r, g, b] = stats.data;

    // Convert to hex
    const dominantColor = `#${[r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")}`;

    // Alternative: Use k-means clustering for more accurate color
    const palette = await sharp(imageBuffer)
      .resize(50, 50)
      .png()
      .toBuffer()
      .then((buffer) => extractPalette(buffer, 5));

    return {
      primary: dominantColor,
      palette: palette.slice(0, 3), // Top 3 colors
      contrast: calculateContrastColor(dominantColor),
    };
  } catch (error) {
    console.error("Dominant color extraction failed:", error);
    return {
      primary: "#808080", // Gray fallback
      palette: ["#808080"],
      contrast: "#ffffff",
    };
  }
}

function calculateContrastColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
```

## 6. Deduplication Logic

### 6.1 Content Hash Strategy

```javascript
async function calculateContentHash(imageBuffer) {
  // Use perceptual hash for similar image detection
  const phash = await generatePerceptualHash(imageBuffer);

  // Use SHA-256 for exact duplicate detection
  const sha256 = crypto.createHash("sha256").update(imageBuffer).digest("hex");

  return {
    exact: sha256,
    perceptual: phash,
    similarity: await calculateSimilarityScore(imageBuffer),
  };
}

async function generatePerceptualHash(imageBuffer) {
  // Convert to 8x8 grayscale for perceptual hashing
  const smallGray = await sharp(imageBuffer)
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  // Calculate DCT and generate hash
  const dctValues = discreteCosineTransform(smallGray);
  const median = calculateMedian(dctValues);

  let hash = "";
  for (let i = 0; i < dctValues.length; i++) {
    hash += dctValues[i] > median ? "1" : "0";
  }

  return hash;
}
```

### 6.2 Deduplication Workflow

```javascript
async function handleDeduplication(imageBuffer, tenantId, entityId) {
  const hashes = await calculateContentHash(imageBuffer);

  // Check for exact duplicates first
  const exactMatch = await db.mediaAssets.findOne({
    where: { contentHash: hashes.exact },
  });

  if (exactMatch) {
    if (exactMatch.tenantId === tenantId) {
      // Same tenant, same file - return existing reference
      return {
        type: "exact_duplicate",
        asset: exactMatch,
        storageSaved: exactMatch.totalSize,
      };
    } else {
      // Cross-tenant deduplication - create reference without duplicating storage
      return await createCrossTenantReference(exactMatch, tenantId, entityId);
    }
  }

  // Check for similar images using perceptual hash
  const similarImages = await findSimilarImages(hashes.perceptual, tenantId);

  if (similarImages.length > 0) {
    // Notify user about potential duplicates but don't auto-deduplicate
    return {
      type: "similar_found",
      suggestions: similarImages,
      action: "process_new", // Let user decide
    };
  }

  // New unique image
  return {
    type: "unique",
    action: "process_new",
  };
}

async function findSimilarImages(perceptualHash, tenantId, threshold = 0.85) {
  const allHashes = await db.mediaAssets.findAll({
    where: { tenantId },
    attributes: ["id", "filename", "perceptualHash"],
    raw: true,
  });

  const similar = [];
  for (const record of allHashes) {
    const similarity = calculateHammingDistance(
      perceptualHash,
      record.perceptualHash,
    );
    if (similarity >= threshold) {
      similar.push({
        id: record.id,
        filename: record.filename,
        similarity: similarity,
      });
    }
  }

  return similar;
}
```

## 7. Database Metadata Schema

### 7.1 Enhanced Media Assets Table

```sql
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    asset_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,

    -- Hashing and deduplication
    content_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256
    perceptual_hash VARCHAR(64), -- For similarity detection

    -- Size and format information
    original_size INTEGER NOT NULL,
    original_format VARCHAR(20) NOT NULL,
    total_processed_size INTEGER NOT NULL, -- Sum of all variants

    -- Image dimensions and metadata
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio DECIMAL(5,3), -- Calculated as width/height

    -- Visual characteristics
    dominant_color VARCHAR(7), -- Primary hex color
    color_palette JSONB, -- Array of top colors
    blurhash VARCHAR(255),

    -- Processing metadata
    quality_mode VARCHAR(20) DEFAULT 'normal', -- normal/eco/freeze
    variants JSONB NOT NULL, -- Available formats and sizes
    processing_metadata JSONB, -- Sharp processing details

    -- References and relationships
    reference_to UUID REFERENCES media_assets(id), -- For deduplicated assets
    reference_count INTEGER DEFAULT 0, -- How many assets reference this

    -- Audit and lifecycle
    upload_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP,
    access_count INTEGER DEFAULT 0,

    CONSTRAINT valid_asset_type CHECK (asset_type IN ('product', 'staff', 'service', 'branding', 'gallery')),
    CONSTRAINT valid_quality_mode CHECK (quality_mode IN ('normal', 'eco', 'freeze'))
);

-- Indexes for performance
CREATE INDEX idx_media_assets_tenant_type ON media_assets(tenant_id, asset_type);
CREATE INDEX idx_media_assets_entity ON media_assets(tenant_id, entity_id);
CREATE INDEX idx_media_assets_content_hash ON media_assets(content_hash);
CREATE INDEX idx_media_assets_perceptual_hash ON media_assets(perceptual_hash);
CREATE INDEX idx_media_assets_references ON media_assets(reference_to) WHERE reference_to IS NOT NULL;
CREATE INDEX idx_media_assets_size ON media_assets(total_processed_size);
CREATE INDEX idx_media_assets_created ON media_assets(created_at);
```

### 7.2 Processing Queue Table

```sql
CREATE TABLE media_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    asset_id UUID REFERENCES media_assets(id),
    original_file_path TEXT NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_processing_status CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed', 'retrying')
    )
);

CREATE INDEX idx_processing_queue_status ON media_processing_queue(processing_status);
CREATE INDEX idx_processing_queue_tenant ON media_processing_queue(tenant_id);
CREATE INDEX idx_processing_queue_created ON media_processing_queue(created_at);
```

### 7.3 Variant Tracking Table

```sql
CREATE TABLE media_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    variant_name VARCHAR(20) NOT NULL, -- thumb, card, hd
    format VARCHAR(10) NOT NULL, -- avif, webp, jpeg
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    quality_used INTEGER,
    compression_ratio DECIMAL(5,3), -- original_size / variant_size
    generated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(asset_id, variant_name, format)
);

CREATE INDEX idx_variants_asset ON media_variants(asset_id);
CREATE INDEX idx_variants_size ON media_variants(file_size);
```

## 8. Quota Enforcement

### 8.1 Real-time Quota Checking

```javascript
class QuotaEnforcer {
  async checkUploadQuota(tenantId, uploadSize, fileCount = 1) {
    const [quota, currentUsage] = await Promise.all([
      this.getTenantQuota(tenantId),
      this.getCurrentUsage(tenantId),
    ]);

    const checks = {
      storage: this.checkStorageQuota(
        currentUsage.storage,
        uploadSize,
        quota.storageLimit,
      ),
      bandwidth: this.checkBandwidthQuota(
        currentUsage.bandwidth,
        quota.bandwidthLimit,
      ),
      fileCount: this.checkFileCountQuota(
        currentUsage.fileCount,
        fileCount,
        quota.fileLimit,
      ),
      rateLimit: await this.checkRateLimit(tenantId),
    };

    const violations = Object.entries(checks)
      .filter(([_, check]) => !check.allowed)
      .map(([type, check]) => ({ type, ...check }));

    if (violations.length > 0) {
      throw new QuotaViolationError(violations);
    }

    return {
      allowed: true,
      quotaInfo: {
        storageUsed: currentUsage.storage,
        storageRemaining: quota.storageLimit - currentUsage.storage,
        filesUsed: currentUsage.fileCount,
        filesRemaining: quota.fileLimit - currentUsage.fileCount,
      },
    };
  }

  checkStorageQuota(currentStorage, uploadSize, limit) {
    const estimatedTotalSize = uploadSize * 3.5; // Estimate with variants
    const afterUpload = currentStorage + estimatedTotalSize;

    return {
      allowed: afterUpload <= limit,
      current: currentStorage,
      after: afterUpload,
      limit: limit,
      utilizationPercent: (afterUpload / limit) * 100,
    };
  }

  async checkRateLimit(tenantId) {
    const key = `rate_limit:${tenantId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 3600); // 1 hour window
    }

    const limit = 100; // 100 uploads per hour
    return {
      allowed: count <= limit,
      current: count,
      limit: limit,
      resetIn: await redis.ttl(key),
    };
  }
}
```

### 8.2 Graceful Quota Degradation

```javascript
async function handleQuotaExceeded(tenantId, violationType, currentUsage) {
  switch (violationType) {
    case "storage":
      // Suggest cleanup or upgrade
      const suggestions = await generateCleanupSuggestions(tenantId);
      return {
        error: "Storage quota exceeded",
        action: "cleanup_or_upgrade",
        suggestions: suggestions,
        upgradeOptions: await getUpgradeOptions(tenantId),
      };

    case "bandwidth":
      // Enable eco mode automatically
      await enableEcoMode(tenantId);
      return {
        error: "Bandwidth quota exceeded",
        action: "eco_mode_enabled",
        message: "Upload quality reduced to preserve bandwidth quota",
      };

    case "fileCount":
      return {
        error: "File count limit reached",
        action: "upgrade_required",
        current: currentUsage.fileCount,
        upgradeOptions: await getUpgradeOptions(tenantId),
      };

    case "rateLimit":
      return {
        error: "Upload rate limit exceeded",
        action: "retry_later",
        retryAfter: 3600, // seconds
      };
  }
}

async function generateCleanupSuggestions(tenantId) {
  const [duplicates, unused, lowQuality] = await Promise.all([
    findDuplicateAssets(tenantId),
    findUnusedAssets(tenantId),
    findLowQualityAssets(tenantId),
  ]);

  return {
    duplicates: {
      count: duplicates.length,
      potentialSavings: duplicates.reduce((sum, d) => sum + d.size, 0),
      items: duplicates.slice(0, 10),
    },
    unused: {
      count: unused.length,
      potentialSavings: unused.reduce((sum, u) => sum + u.size, 0),
      items: unused.slice(0, 10),
    },
    lowQuality: {
      count: lowQuality.length,
      improvementPotential: lowQuality.reduce(
        (sum, l) => sum + l.wastedSpace,
        0,
      ),
      items: lowQuality.slice(0, 10),
    },
  };
}
```

## 9. Error Handling and Recovery

### 9.1 Processing Error Categories

```javascript
class ProcessingError extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.type = type;
    this.details = details;
    this.recoverable = this.isRecoverable(type);
  }

  isRecoverable(type) {
    const recoverableTypes = [
      "TEMPORARY_NETWORK_ERROR",
      "RATE_LIMIT_EXCEEDED",
      "STORAGE_TEMPORARILY_UNAVAILABLE",
      "PROCESSING_TIMEOUT",
    ];
    return recoverableTypes.includes(type);
  }
}

const ERROR_TYPES = {
  // Validation errors (not recoverable)
  INVALID_FILE_FORMAT: "Unsupported file format",
  FILE_TOO_LARGE: "File exceeds maximum size limit",
  INVALID_DIMENSIONS: "Image dimensions exceed limits",
  CORRUPTED_FILE: "File appears to be corrupted",

  // Quota errors (not recoverable without action)
  STORAGE_QUOTA_EXCEEDED: "Storage quota exceeded",
  BANDWIDTH_QUOTA_EXCEEDED: "Bandwidth quota exceeded",
  FILE_COUNT_LIMIT_EXCEEDED: "File count limit exceeded",

  // Processing errors (potentially recoverable)
  PROCESSING_FAILED: "Image processing failed",
  VARIANT_GENERATION_FAILED: "Failed to generate image variant",
  METADATA_EXTRACTION_FAILED: "Failed to extract image metadata",

  // Infrastructure errors (recoverable)
  STORAGE_UPLOAD_FAILED: "Failed to upload to storage",
  DATABASE_ERROR: "Database operation failed",
  NETWORK_ERROR: "Network connectivity issue",
};
```

### 9.2 Retry Logic and Circuit Breaker

```javascript
class ProcessingRetryManager {
  constructor() {
    this.circuitBreakers = new Map(); // Per-tenant circuit breakers
    this.retryConfigs = {
      PROCESSING_FAILED: { maxRetries: 3, backoffMs: 1000 },
      STORAGE_UPLOAD_FAILED: { maxRetries: 5, backoffMs: 2000 },
      DATABASE_ERROR: { maxRetries: 3, backoffMs: 500 },
      NETWORK_ERROR: { maxRetries: 4, backoffMs: 1500 },
    };
  }

  async executeWithRetry(operation, errorType, context = {}) {
    const config = this.retryConfigs[errorType] || {
      maxRetries: 1,
      backoffMs: 1000,
    };

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (!error.recoverable || attempt === config.maxRetries) {
          throw error;
        }

        const backoffTime = config.backoffMs * Math.pow(2, attempt - 1);
        await this.sleep(backoffTime);
      }
    }
  }

  async checkCircuitBreaker(tenantId, operation) {
    const key = `${tenantId}:${operation}`;
    const breaker = this.circuitBreakers.get(key);

    if (breaker && breaker.isOpen()) {
      throw new ProcessingError(
        "CIRCUIT_BREAKER_OPEN",
        `Circuit breaker open for ${operation}`,
        { resetTime: breaker.resetTime },
      );
    }
  }

  recordFailure(tenantId, operation, error) {
    const key = `${tenantId}:${operation}`;
    let breaker = this.circuitBreakers.get(key);

    if (!breaker) {
      breaker = new CircuitBreaker();
      this.circuitBreakers.set(key, breaker);
    }

    breaker.recordFailure(error);
  }
}
```

### 9.3 Graceful Degradation Strategies

```javascript
async function processWithGracefulDegradation(imageBuffer, tenantId, options) {
  const results = {
    success: false,
    asset: null,
    warnings: [],
    fallbacks: [],
  };

  try {
    // Attempt full processing
    results.asset = await processImageFully(imageBuffer, tenantId, options);
    results.success = true;
  } catch (error) {
    console.error("Full processing failed:", error);

    // Fallback 1: Reduce quality and retry
    if (error.type === "PROCESSING_FAILED") {
      try {
        const degradedOptions = {
          ...options,
          qualityMode: "eco",
          skipFormats: ["avif"], // Skip newest format
        };

        results.asset = await processImageFully(
          imageBuffer,
          tenantId,
          degradedOptions,
        );
        results.success = true;
        results.warnings.push(
          "Processed with reduced quality due to processing constraints",
        );
        results.fallbacks.push("quality_degraded");
      } catch (fallbackError) {
        // Fallback 2: Generate only essential variants
        try {
          results.asset = await processImageMinimal(imageBuffer, tenantId);
          results.success = true;
          results.warnings.push("Only essential variants generated");
          results.fallbacks.push("minimal_processing");
        } catch (minimalError) {
          // Fallback 3: Store original only
          results.asset = await storeOriginalOnly(imageBuffer, tenantId);
          results.success = true;
          results.warnings.push(
            "Stored as original only - processing will be attempted later",
          );
          results.fallbacks.push("original_only");
        }
      }
    }
  }

  return results;
}

async function processImageMinimal(imageBuffer, tenantId) {
  // Generate only JPEG variants for maximum compatibility
  const variants = {};

  for (const [variantName, spec] of Object.entries(VARIANT_SPECIFICATIONS)) {
    try {
      variants[`${variantName}.jpg`] = await sharp(imageBuffer)
        .resize(spec.width, spec.height, { fit: spec.fit })
        .jpeg({ quality: 75, progressive: true })
        .toBuffer();
    } catch (error) {
      console.error(`Failed to generate ${variantName} variant:`, error);
      // Continue with other variants
    }
  }

  if (Object.keys(variants).length === 0) {
    throw new ProcessingError(
      "MINIMAL_PROCESSING_FAILED",
      "Could not generate any variants",
    );
  }

  return await storeVariants(variants, tenantId);
}
```

## 10. Performance Optimization

### 10.1 Parallel Processing Pipeline

```javascript
async function processImageOptimized(imageBuffer, tenantId, options) {
  const processingStart = performance.now();

  // Start metadata extraction and validation in parallel
  const [metadata, validationResult, contentHash] = await Promise.all([
    extractImageMetadata(imageBuffer),
    validateImageFile(imageBuffer),
    calculateContentHash(imageBuffer),
  ]);

  if (!validationResult.valid) {
    throw new ProcessingError("VALIDATION_FAILED", validationResult.error);
  }

  // Check for deduplication early
  const deduplicationResult = await handleDeduplication(
    imageBuffer,
    tenantId,
    contentHash,
  );

  if (deduplicationResult.type === "exact_duplicate") {
    return deduplicationResult.asset;
  }

  // Process variants in parallel using worker threads
  const variantPromises = Object.entries(VARIANT_SPECIFICATIONS).map(
    ([variantName, spec]) =>
      processVariantWorker(imageBuffer, variantName, spec, options.qualityMode),
  );

  // Generate visual characteristics in parallel
  const [variants, blurhash, dominantColor] = await Promise.all([
    Promise.all(variantPromises),
    generateBlurhash(imageBuffer),
    extractDominantColor(imageBuffer),
  ]);

  const processingTime = performance.now() - processingStart;

  return {
    variants: variants.flat(),
    metadata: {
      ...metadata,
      blurhash,
      dominantColor,
      processingTime: Math.round(processingTime),
    },
  };
}

// Worker thread for CPU-intensive variant generation
async function processVariantWorker(
  imageBuffer,
  variantName,
  spec,
  qualityMode,
) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./variant-processor-worker.js", {
      workerData: {
        imageBuffer,
        variantName,
        spec,
        qualityMode,
      },
    });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
```

### 10.2 Memory Management

```javascript
class MemoryEfficientProcessor {
  constructor(maxConcurrent = 3) {
    this.semaphore = new Semaphore(maxConcurrent);
    this.memoryUsage = new Map();
  }

  async processWithMemoryControl(imageBuffer, processingId) {
    await this.semaphore.acquire();

    try {
      this.trackMemoryUsage(processingId, imageBuffer.length);

      // Use streaming for large images
      if (imageBuffer.length > 50 * 1024 * 1024) {
        // 50MB
        return await this.processLargeImageStream(imageBuffer);
      } else {
        return await this.processImageBuffer(imageBuffer);
      }
    } finally {
      this.cleanupMemoryTracking(processingId);
      this.semaphore.release();
    }
  }

  async processLargeImageStream(imageBuffer) {
    // Process in chunks to avoid memory overflow
    const tempFile = path.join(os.tmpdir(), `processing-${Date.now()}.tmp`);

    try {
      await fs.writeFile(tempFile, imageBuffer);

      const variants = {};
      for (const [variantName, spec] of Object.entries(
        VARIANT_SPECIFICATIONS,
      )) {
        variants[variantName] = await sharp(tempFile)
          .resize(spec.width, spec.height, { fit: spec.fit })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      return variants;
    } finally {
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        console.warn("Failed to cleanup temp file:", error);
      }
    }
  }

  trackMemoryUsage(processingId, size) {
    this.memoryUsage.set(processingId, {
      size,
      startTime: Date.now(),
      peakMemory: process.memoryUsage().heapUsed,
    });
  }

  async enforceMemoryLimits() {
    const usage = process.memoryUsage();
    const maxHeapSize = 1024 * 1024 * 1024; // 1GB limit

    if (usage.heapUsed > maxHeapSize * 0.8) {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // If still high memory usage, reject new processing
      if (process.memoryUsage().heapUsed > maxHeapSize * 0.9) {
        throw new ProcessingError(
          "MEMORY_LIMIT_EXCEEDED",
          "Processing temporarily unavailable due to memory constraints",
        );
      }
    }
  }
}
```

## 11. Monitoring and Metrics

### 11.1 Processing Metrics Collection

```javascript
class ProcessingMetrics {
  async recordProcessingMetrics(tenantId, metrics) {
    const record = {
      tenant_id: tenantId,
      processing_time_ms: metrics.processingTime,
      original_size_bytes: metrics.originalSize,
      total_variant_size_bytes: metrics.totalVariantSize,
      compression_ratio: metrics.originalSize / metrics.totalVariantSize,
      variants_generated: metrics.variantsGenerated,
      formats_generated: metrics.formatsGenerated,
      quality_mode: metrics.qualityMode,
      error_count: metrics.errorCount,
      fallback_used: metrics.fallbackUsed,
      created_at: new Date(),
    };

    await db.processingMetrics.create(record);

    // Update aggregated stats
    await this.updateTenantStats(tenantId, metrics);
  }

  async generateProcessingReport(tenantId, timeRange = "7d") {
    const metrics = await db.processingMetrics.findAll({
      where: {
        tenant_id: tenantId,
        created_at: {
          [Op.gte]: new Date(Date.now() - this.parseTimeRange(timeRange)),
        },
      },
    });

    return {
      totalProcessed: metrics.length,
      averageProcessingTime: this.average(
        metrics.map((m) => m.processing_time_ms),
      ),
      averageCompressionRatio: this.average(
        metrics.map((m) => m.compression_ratio),
      ),
      totalStorageSaved: metrics.reduce(
        (sum, m) => sum + (m.original_size_bytes - m.total_variant_size_bytes),
        0,
      ),
      errorRate:
        metrics.filter((m) => m.error_count > 0).length / metrics.length,
      fallbackRate:
        metrics.filter((m) => m.fallback_used).length / metrics.length,
      qualityModeDistribution: this.groupBy(metrics, "quality_mode"),
    };
  }
}
```

This comprehensive specification provides detailed technical parameters, processing workflows, and implementation details for the image optimization pipeline. The system is designed to be cost-effective, performant, and resilient with graceful degradation capabilities.

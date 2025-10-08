import sharp from 'sharp';
import crypto from 'crypto';

export interface MediaVariant {
  name: string;
  width: number;
  height: number;
  quality: {
    avif: number;
    webp: number;
    jpeg: number;
  };
}

export interface ProcessedMedia {
  variants: Map<string, Buffer>;
  metadata: {
    originalSize: number;
    totalSize: number;
    width: number;
    height: number;
    format: string;
    contentHash: string;
    dominantColor: string;
    blurhash: string;
  };
}

export interface ProcessingOptions {
  variants: MediaVariant[];
  stripExif: boolean;
  generateBlurhash: boolean;
  extractDominantColor: boolean;
  qualityMode: 'normal' | 'eco' | 'freeze';
}

// Standard variant configurations
export const STANDARD_VARIANTS: MediaVariant[] = [
  {
    name: 'thumb',
    width: 150,
    height: 150,
    quality: { avif: 85, webp: 80, jpeg: 85 }
  },
  {
    name: 'card',
    width: 400,
    height: 300,
    quality: { avif: 85, webp: 80, jpeg: 85 }
  },
  {
    name: 'hd',
    width: 1200,
    height: 900,
    quality: { avif: 85, webp: 80, jpeg: 85 }
  }
];

// Quality adjustments based on budget mode
const QUALITY_ADJUSTMENTS = {
  normal: { avif: 0, webp: 0, jpeg: 0 },
  eco: { avif: -15, webp: -15, jpeg: -15 },
  freeze: { avif: -25, webp: -25, jpeg: -25 }
};

export class MediaProcessor {
  async processImage(
    inputBuffer: Buffer,
    options: ProcessingOptions
  ): Promise<ProcessedMedia> {
    // 1. Strip EXIF data and get metadata
    const { cleanBuffer, metadata } = await this.prepareImage(inputBuffer, options.stripExif);

    // 2. Generate content hash for deduplication
    const contentHash = this.generateContentHash(inputBuffer);

    // 3. Generate variants in parallel
    const variants = await this.generateVariants(cleanBuffer, options);

    // 4. Extract visual metadata
    const dominantColor = options.extractDominantColor
      ? await this.extractDominantColor(cleanBuffer)
      : '#000000';

    const blurhash = options.generateBlurhash
      ? await this.generateBlurhash(cleanBuffer)
      : '';

    // 5. Calculate sizes
    const totalSize = Array.from(variants.values()).reduce(
      (sum, buffer) => sum + buffer.length,
      0
    );

    return {
      variants,
      metadata: {
        originalSize: inputBuffer.length,
        totalSize,
        width: metadata.width!,
        height: metadata.height!,
        format: metadata.format!,
        contentHash,
        dominantColor,
        blurhash
      }
    };
  }

  private async prepareImage(
    inputBuffer: Buffer,
    stripExif: boolean
  ): Promise<{ cleanBuffer: Buffer; metadata: sharp.Metadata }> {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    if (stripExif) {
      // Strip EXIF but preserve essential technical metadata
      const cleanBuffer = await image
        .rotate() // Auto-rotate based on EXIF orientation
        .withMetadata({
          exif: {}, // Remove EXIF data
          icc: metadata.icc?.toString('latin1'), // Preserve color profile, convert Buffer to string
        })
        .toBuffer();

      return { cleanBuffer, metadata };
    }

    return { cleanBuffer: inputBuffer, metadata };
  }

  private generateContentHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async generateVariants(
    inputBuffer: Buffer,
    options: ProcessingOptions
  ): Promise<Map<string, Buffer>> {
    const variants = new Map<string, Buffer>();
    const qualityAdjustment = QUALITY_ADJUSTMENTS[options.qualityMode];

    // Process variants in parallel for better performance
    const variantPromises = options.variants.flatMap(variant =>
      [
        this.generateVariant(inputBuffer, variant, 'avif', qualityAdjustment),
        this.generateVariant(inputBuffer, variant, 'webp', qualityAdjustment),
        this.generateVariant(inputBuffer, variant, 'jpeg', qualityAdjustment)
      ]
    );

    const results = await Promise.allSettled(variantPromises);

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        variants.set(result.value.key, result.value.buffer);
      }
    });

    return variants;
  }

  private async generateVariant(
    inputBuffer: Buffer,
    variant: MediaVariant,
    format: 'avif' | 'webp' | 'jpeg',
    qualityAdjustment: { avif: number; webp: number; jpeg: number }
  ): Promise<{ key: string; buffer: Buffer } | null> {
    try {
      const image = sharp(inputBuffer);
      const quality = Math.max(10, Math.min(100, variant.quality[format] + qualityAdjustment[format]));

      // Smart cropping using entropy for better results
      const resized = image.resize(variant.width, variant.height, {
        fit: 'cover',
        position: 'entropy' // Focus on the most interesting part of the image
      });

      let buffer: Buffer;
      const key = `${variant.name}.${format}`;

      switch (format) {
        case 'avif':
          buffer = await resized
            .avif({
              quality,
              effort: 6, // Higher effort for better compression
              chromaSubsampling: '4:2:0'
            })
            .toBuffer();
          break;

        case 'webp':
          buffer = await resized
            .webp({
              quality,
              effort: 6,
              smartSubsample: true
            })
            .toBuffer();
          break;

        case 'jpeg':
          buffer = await resized
            .jpeg({
              quality,
              mozjpeg: true, // Better compression
              progressive: true
            })
            .toBuffer();
          break;
      }

      return { key, buffer };

    } catch (error) {
      console.error(`Failed to generate ${format} variant for ${variant.name}:`, error);
      return null;
    }
  }

  private async extractDominantColor(buffer: Buffer): Promise<string> {
    try {
      // Resize to small image for faster color analysis
      const { data, info } = await sharp(buffer)
        .resize(50, 50, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple dominant color extraction using k-means-like approach
      const pixels: [number, number, number][] = [];
      for (let i = 0; i < data.length; i += info.channels) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
      }

      // Find the most common color
      const colorCounts = new Map<string, number>();
      pixels.forEach(([r, g, b]) => {
        // Group similar colors (reduce precision)
        const color = `${Math.floor(r / 16) * 16},${Math.floor(g / 16) * 16},${Math.floor(b / 16) * 16}`;
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      });

      const dominantRgb = Array.from(colorCounts.entries())
        .sort(([, a], [, b]) => b - a)[0][0]
        .split(',')
        .map(Number);

      // Convert to hex
      return `#${dominantRgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;

    } catch (error) {
      console.error('Failed to extract dominant color:', error);
      return '#000000';
    }
  }

  private async generateBlurhash(buffer: Buffer): Promise<string> {
    try {
      // For now, return a placeholder blurhash
      // In production, you would use the 'blurhash' npm package
      const { data, info } = await sharp(buffer)
        .resize(32, 32, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple blurhash-like placeholder
      const avgColor = this.calculateAverageColor(data, info.channels);
      return `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="rgb(${avgColor.join(',')})"/>
        </svg>
      `).toString('base64')}`;

    } catch (error) {
      console.error('Failed to generate blurhash:', error);
      return '';
    }
  }

  private calculateAverageColor(data: Buffer, channels: number): [number, number, number] {
    let r = 0, g = 0, b = 0;
    const pixelCount = data.length / channels;

    for (let i = 0; i < data.length; i += channels) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    return [
      Math.floor(r / pixelCount),
      Math.floor(g / pixelCount),
      Math.floor(b / pixelCount)
    ];
  }

  // Deduplication helper
  async checkDuplication(contentHash: string): Promise<boolean> {
    // This would check the database for existing assets with the same hash
    // For now, return false (no duplication found)
    return false;
  }

  // Validate image before processing
  validateImage(buffer: Buffer): { valid: boolean; error?: string } {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const MIN_SIZE = 1024; // 1KB

    if (buffer.length > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    if (buffer.length < MIN_SIZE) {
      return { valid: false, error: 'File size too small' };
    }

    // Check if it's a valid image by trying to read metadata
    try {
      sharp(buffer);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid image format' };
    }
  }
}
# Agente Visual

## Misión

Generar assets visuales usando Nano Banana API y optimizar recursos gráficos del proyecto.

## Capacidades

### 1. Generación de Imágenes

- Product mockups
- Hero images
- Backgrounds
- Icons y logos
- Marketing materials

### 2. Optimización

- Compresión de imágenes
- Conversión de formatos
- Responsive images
- WebP/AVIF generation

### 3. Procesamiento

- Resize images
- Crop y ajuste
- Filters y effects
- Batch processing

## Nano Banana API Integration

### Configuration

```typescript
const NANO_BANANA_API = {
  url: "https://api.nanobanana.com/v1",
  key: process.env.NANO_BANANA_API_KEY,
};
```

### Generate Image

```typescript
async function generateProductImage(prompt: string) {
  const response = await fetch(`${NANO_BANANA_API.url}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NANO_BANANA_API.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024,
      style: "realistic",
      quality: "high",
    }),
  });

  const data = await response.json();
  return data.image_url;
}
```

### Image Variations

```typescript
async function createVariations(imageUrl: string) {
  return fetch(`${NANO_BANANA_API.url}/variations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NANO_BANANA_API.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      n: 4, // Generate 4 variations
    }),
  });
}
```

## Use Cases

### 1. Product Images

```typescript
const productPrompts = {
  tshirt:
    "High-quality t-shirt mockup on white background, professional product photography",
  laptop: "Modern laptop on minimalist desk setup, natural lighting",
  shoes: "Running shoes product shot, dynamic angle, studio lighting",
};

async function generateProductAssets(productType: string) {
  const prompt = productPrompts[productType];
  const imageUrl = await generateProductImage(prompt);

  // Generate multiple sizes
  await Promise.all([
    optimizeImage(imageUrl, { width: 800, height: 800 }), // Large
    optimizeImage(imageUrl, { width: 400, height: 400 }), // Medium
    optimizeImage(imageUrl, { width: 200, height: 200 }), // Thumbnail
  ]);
}
```

### 2. Hero Sections

```typescript
async function generateHeroImage(theme: string) {
  const prompt = `Modern e-commerce hero image, ${theme}, clean design, professional`;
  const imageUrl = await generateProductImage(prompt);

  // Save to public assets
  await downloadAndSave(imageUrl, "public/images/hero.jpg");

  // Generate WebP version
  await convertToWebP("public/images/hero.jpg");
}
```

### 3. Marketing Materials

```typescript
async function generateMarketingAssets(campaign: string) {
  const prompts = [
    `Social media banner for ${campaign}, eye-catching, modern`,
    `Email header for ${campaign}, professional, clean`,
    `Instagram post for ${campaign}, vibrant, engaging`,
  ];

  const images = await Promise.all(
    prompts.map((prompt) => generateProductImage(prompt)),
  );

  return images;
}
```

## Image Optimization

### Compression

```typescript
import sharp from "sharp";

async function optimizeImage(
  input: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  },
) {
  await sharp(input)
    .resize(options.width, options.height, { fit: "cover" })
    .jpeg({ quality: options.quality || 80 })
    .toFile(input.replace(".jpg", "-optimized.jpg"));
}
```

### Format Conversion

```typescript
async function convertToWebP(input: string) {
  await sharp(input)
    .webp({ quality: 80 })
    .toFile(input.replace(/\.(jpg|png)$/, ".webp"));
}

async function convertToAVIF(input: string) {
  await sharp(input)
    .avif({ quality: 75 })
    .toFile(input.replace(/\.(jpg|png)$/, ".avif"));
}
```

### Responsive Images

```typescript
async function generateResponsiveSet(input: string) {
  const sizes = [
    { width: 320, suffix: "sm" },
    { width: 640, suffix: "md" },
    { width: 1024, suffix: "lg" },
    { width: 1920, suffix: "xl" },
  ];

  for (const size of sizes) {
    await sharp(input)
      .resize(size.width)
      .toFile(input.replace(".jpg", `-${size.suffix}.jpg`));
  }
}
```

## Asset Management

### Directory Structure

```
public/
  images/
    products/       # Product images
    heroes/         # Hero sections
    marketing/      # Marketing materials
    icons/          # Icons and logos
    optimized/      # Optimized versions
```

### Naming Convention

```
{category}-{name}-{size}.{format}
Examples:
- product-tshirt-lg.jpg
- hero-homepage-xl.webp
- icon-cart-sm.svg
```

### Metadata Tracking

```typescript
interface ImageAsset {
  id: string;
  url: string;
  prompt: string;
  dimensions: { width: number; height: number };
  fileSize: number;
  format: "jpg" | "png" | "webp" | "avif";
  createdAt: Date;
  usage: string[];
}

const assetRegistry: ImageAsset[] = [];
```

## Batch Processing

### Generate Multiple Products

```typescript
async function batchGenerateProducts(products: string[]) {
  const results = await Promise.allSettled(
    products.map((product) => generateProductAssets(product)),
  );

  const successful = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  logger.visual(`Generated ${successful.length}/${products.length} products`);

  return { successful, failed };
}
```

### Optimize All Images

```typescript
import { glob } from "glob";

async function optimizeAllImages() {
  const images = await glob("public/images/**/*.{jpg,png}");

  for (const image of images) {
    await optimizeImage(image, { quality: 80 });
    await convertToWebP(image);
  }

  logger.success(`Optimized ${images.length} images`);
}
```

## Performance Guidelines

- **Max file size**: 500KB for hero images
- **Max file size**: 200KB for product images
- **Max file size**: 50KB for thumbnails
- **Formats**: Prefer WebP > AVIF > JPEG
- **Lazy loading**: Enable for all images below fold
- **CDN**: Serve all images from CloudFlare CDN

## Output Format

```json
{
  "generated": 10,
  "optimized": 10,
  "failed": 0,
  "totalSize": "2.5MB",
  "averageSize": "250KB",
  "assets": [
    {
      "file": "product-tshirt-lg.jpg",
      "size": "320KB",
      "dimensions": "800x800",
      "url": "https://cdn.example.com/products/tshirt-lg.jpg"
    }
  ]
}
```

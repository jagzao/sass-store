const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const heroDir = path.join(__dirname, '../apps/web/public/tenants/wondernails/hero');

async function convertToWebP() {
  const files = fs.readdirSync(heroDir).filter(f => f.endsWith('.png'));

  console.log(`Converting ${files.length} images to WebP...`);

  for (const file of files) {
    const inputPath = path.join(heroDir, file);
    const outputPath = path.join(heroDir, file.replace('.png', '.webp'));

    try {
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);

      const originalSize = fs.statSync(inputPath).size;
      const newSize = fs.statSync(outputPath).size;
      const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

      console.log(`✓ ${file} → ${path.basename(outputPath)} (${savings}% smaller)`);
    } catch (err) {
      console.error(`✗ Failed to convert ${file}:`, err.message);
    }
  }

  console.log('\nDone!');
}

convertToWebP().catch(console.error);

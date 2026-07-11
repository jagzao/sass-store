/**
 * Generates PWA PNG icons (192, 512, maskable, apple-touch) for all tenants.
 * Creates square SVGs with tenant branding, then converts to PNG via sharp.
 *
 * Run: node scripts/generate-pwa-icons.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "apps", "web", "public");

// Tenant brand configs: slug -> { bg, fg, label, sublabel? }
const TENANTS = [
  {
    slug: "wondernails",
    bg: "#FF4F8B",
    fg: "#ffffff",
    label: "W",
    name: "Wonder Nails",
  },
  {
    slug: "centro-tenistico",
    bg: "#059669",
    fg: "#ffffff",
    label: "CT",
    name: "Centro Deportivo",
  },
  {
    slug: "zo-system",
    bg: "#0f172a",
    fg: "#FF8000",
    label: "Z",
    name: "Zo System",
  },
  {
    slug: "manada-juma",
    bg: "#1b4332",
    fg: "#40d090",
    label: "MJ",
    name: "Manada Juma",
  },
  {
    slug: "delirios",
    bg: "#7c3aed",
    fg: "#ffffff",
    label: "D",
    name: "Delirios",
  },
  {
    slug: "nom-nom",
    bg: "#f59e0b",
    fg: "#ffffff",
    label: "N",
    name: "Nom Nom",
  },
  {
    slug: "vigistudio",
    bg: "#1e40af",
    fg: "#ffffff",
    label: "V",
    name: "VigiStudio",
  },
];

// Also generate a default icon for tenants without specific config
const DEFAULT_TENANT = {
  bg: "#6366f1",
  fg: "#ffffff",
  label: "?",
  name: "App",
};

function buildIconSvg(tenant, size, maskable = false) {
  const padding = maskable ? size * 0.2 : size * 0.1; // safe zone for maskable
  const inner = size - padding * 2;
  const fontSize = inner * 0.5;
  const subFontSize = inner * 0.12;
  const cx = size / 2;
  const cy = size / 2;

  // For maskable, add full-bleed background (no transparent corners)
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${tenant.bg}"/>
  ${maskable ? "" : `<rect x="${padding * 0.5}" y="${padding * 0.5}" width="${size - padding}" height="${size - padding}" rx="${size * 0.15}" fill="${tenant.bg}" opacity="0.15"/>`}
  <text x="${cx}" y="${cy}" font-family="Arial Black, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="${tenant.fg}" text-anchor="middle" dominant-baseline="central">${tenant.label}</text>
</svg>`;
}

async function generateForTenant(tenant) {
  const dir = path.join(PUBLIC_DIR, "tenants", tenant.slug, "logo");
  fs.mkdirSync(dir, { recursive: true });

  // Generate SVG sources
  const sizes = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "icon-192-maskable.png", size: 192, maskable: true },
    { name: "icon-512-maskable.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
    { name: "icon-32.png", size: 32, maskable: false },
    { name: "icon-16.png", size: 16, maskable: false },
  ];

  for (const { name, size, maskable } of sizes) {
    const svg = Buffer.from(buildIconSvg(tenant, size, maskable));
    const outPath = path.join(dir, name);
    await sharp(svg).png().toFile(outPath);
  }

  console.log(`✓ ${tenant.slug}: 7 PNG icons generated`);
}

// Also generate favicon.ico equivalent (just use icon-32 as favicon)
async function generateDefaultIcons() {
  const dir = path.join(PUBLIC_DIR);
  const svg = Buffer.from(buildIconSvg(DEFAULT_TENANT, 512, false));
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile(path.join(dir, "favicon-32.png"));
  await sharp(svg)
    .resize(16, 16)
    .png()
    .toFile(path.join(dir, "favicon-16.png"));
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile(path.join(dir, "apple-touch-icon-default.png"));
  console.log("✓ Default icons generated");
}

async function main() {
  console.log("Generating PWA icons...\n");
  for (const tenant of TENANTS) {
    await generateForTenant(tenant);
  }
  await generateDefaultIcons();
  console.log("\nDone! All PWA icons generated.");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});

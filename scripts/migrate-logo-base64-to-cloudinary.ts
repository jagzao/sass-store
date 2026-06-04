/**
 * STRY-022 PERF-NEW-001 — Migrar logos base64 de la BD a Cloudinary
 *
 * Problema: centro-tenistico almacena su logo como base64 PNG (2.2MB en DB).
 * Al renderizar la página, el HTML pesa 3.6MB solo por ese logo.
 *
 * Solución: subir a Cloudinary y guardar la URL resultante en la DB.
 *
 * Uso: npx tsx scripts/migrate-logo-base64-to-cloudinary.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { v2 as cloudinary } from "cloudinary";
import postgres from "postgres";

// Cargar .env.local
config({ path: resolve(process.cwd(), "apps/web/.env.local") });

const DATABASE_URL = process.env.DATABASE_URL!;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

if (!DATABASE_URL || !CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("❌ Faltan variables de entorno. Verifica .env.local");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function uploadBase64ToCloudinary(
  base64DataUrl: string,
  tenantSlug: string,
): Promise<string> {
  console.log(`  📤 Subiendo logo de ${tenantSlug} a Cloudinary...`);
  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: `sass-store/tenants/logos`,
    public_id: `${tenantSlug}-logo-${Date.now()}`,
    resource_type: "image",
    format: "png",
    quality: "auto:good",
    fetch_format: "auto",
  });
  console.log(`  ✅ Subido: ${result.secure_url}`);
  console.log(
    `     Tamaño original: ${Math.round((base64DataUrl.length * 0.75) / 1024)} KB`,
  );
  console.log(
    `     Tamaño Cloudinary: ${result.bytes ? Math.round(result.bytes / 1024) + " KB" : "N/A"}`,
  );
  return result.secure_url;
}

async function main() {
  console.log("🔍 Buscando tenants con logos base64 grandes...\n");

  const tenants = await sql<Array<{ id: string; slug: string; branding: any }>>`
    SELECT id, slug, branding
    FROM tenants
    WHERE
      branding IS NOT NULL
      AND (branding->>'logoUrl' LIKE 'data:image%' OR branding->>'logo' LIKE 'data:image%')
    ORDER BY pg_column_size(branding) DESC
  `;

  if (tenants.length === 0) {
    console.log("✅ No hay tenants con logos base64. Nada que migrar.");
    await sql.end();
    return;
  }

  console.log(`Encontrados ${tenants.length} tenant(s) con logos base64:\n`);

  for (const tenant of tenants) {
    const branding = tenant.branding as Record<string, any>;
    const base64Logo = branding.logoUrl || branding.logo;
    const sizeMB = ((base64Logo.length * 0.75) / 1024 / 1024).toFixed(2);

    console.log(`📁 Tenant: ${tenant.slug} (${sizeMB} MB como base64)`);

    try {
      const cloudinaryUrl = await uploadBase64ToCloudinary(
        base64Logo,
        tenant.slug,
      );

      // Actualizar en DB
      const updatedBranding = {
        ...branding,
        logoUrl: cloudinaryUrl,
        logo: cloudinaryUrl,
      };

      await sql`
        UPDATE tenants
        SET
          branding = ${JSON.stringify(updatedBranding)}::jsonb,
          updated_at = NOW()
        WHERE id = ${tenant.id}
      `;

      console.log(`  ✅ DB actualizada para ${tenant.slug}\n`);
    } catch (err) {
      console.error(`  ❌ Error procesando ${tenant.slug}:`, err);
    }
  }

  console.log("🎉 Migración completada.");
  await sql.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, tenants, userRoles } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// STRY-022 PERF-NEW-001: Límite de tamaño para logos.
// Un logo base64 de 1.15MB se multiplicaba x3 en HTML = 3.45MB por página.
// Ahora: rechazar base64 > 200KB. Las URLs de Cloudinary son ilimitadas.
const MAX_BASE64_LOGO_BYTES = 200 * 1024; // 200 KB

/**
 * Detecta si un string es una imagen base64 y valida su tamaño.
 * Retorna null si pasa validación, o mensaje de error si falla.
 */
function validateLogoSize(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("data:image")) return null; // URL externa — OK

  // base64 string: cada 4 chars de base64 = 3 bytes
  const base64Part = value.split(",")[1] ?? "";
  const approxBytes = Math.ceil((base64Part.length * 3) / 4);

  if (approxBytes > MAX_BASE64_LOGO_BYTES) {
    const kb = Math.round(approxBytes / 1024);
    return `Logo demasiado grande (${kb} KB). Máximo permitido: 200 KB. Usa Cloudinary para logos grandes.`;
  }
  return null;
}

const updateBrandingSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  // Legacy compatibility
  logo: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenant: slug } = await params;

    // Verify tenant exists and get ID
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify user is Admin for this tenant
    const userRole = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.tenantId, tenant.id),
        eq(userRoles.role, "Admin"),
      ),
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can update tenant branding" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const result = updateBrandingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.errors },
        { status: 400 },
      );
    }

    const {
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      logo,
      favicon,
    } = result.data;

    const resolvedLogoUrl = logoUrl !== undefined ? logoUrl : logo;
    const resolvedFaviconUrl = faviconUrl !== undefined ? faviconUrl : favicon;

    // STRY-022 PERF-NEW-001: Validar tamaño del logo antes de guardar en DB.
    // Un logo base64 grande se renderiza inline en cada página (×N veces).
    // Cloudinary o S3 son la alternativa correcta para logos pesados.
    const logoSizeError = validateLogoSize(resolvedLogoUrl);
    if (logoSizeError) {
      return NextResponse.json({ error: logoSizeError }, { status: 413 });
    }

    const faviconSizeError = validateLogoSize(resolvedFaviconUrl);
    if (faviconSizeError) {
      return NextResponse.json(
        { error: `Favicon: ${faviconSizeError}` },
        { status: 413 },
      );
    }

    // Merge with existing branding (careful not to overwrite other fields)
    const existingBranding = (tenant.branding as any) || {};
    const updatedBranding = {
      ...existingBranding,
      ...(resolvedLogoUrl !== undefined
        ? {
            logoUrl: resolvedLogoUrl,
            logo: resolvedLogoUrl,
          }
        : {}),
      ...(resolvedFaviconUrl !== undefined
        ? {
            faviconUrl: resolvedFaviconUrl,
            favicon: resolvedFaviconUrl,
          }
        : {}),
      ...(primaryColor !== undefined ? { primaryColor } : {}),
      ...(secondaryColor !== undefined ? { secondaryColor } : {}),
      ...(accentColor !== undefined ? { accentColor } : {}),
    };

    await db
      .update(tenants)
      .set({
        branding: updatedBranding,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id));

    return NextResponse.json({ success: true, branding: updatedBranding });
  } catch (error) {
    console.error("Error updating tenant branding:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

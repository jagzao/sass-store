import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, tenants, userRoles } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

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
    const resolvedFaviconUrl =
      faviconUrl !== undefined ? faviconUrl : favicon;

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

    // Clean up undefined/null keys if we want to remove them?
    // JSON spec allows null. Let's keep it simple.

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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db } from "@sass-store/database";
import { posTerminals } from "@sass-store/database/schema";
import { and, eq, ne, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenant");
    const active = searchParams.get("active");

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 },
      );
    }

    // Obtener tenant ID desde el slug
    const tenantResult = await db.execute(
      sql`SELECT id FROM tenants WHERE slug = ${tenantSlug}`,
    );

    if (!tenantResult || (tenantResult as any[]).length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = (tenantResult as any[])[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    const filters =
      active === "true"
        ? and(
            eq(posTerminals.tenantId, tenantId),
            eq(posTerminals.status, "active"),
          )
        : active === "false"
          ? and(
              eq(posTerminals.tenantId, tenantId),
              ne(posTerminals.status, "active"),
            )
          : eq(posTerminals.tenantId, tenantId);

    const rows = await db
      .select({
        id: posTerminals.id,
        tenantId: posTerminals.tenantId,
        name: posTerminals.name,
        terminalId: posTerminals.terminalId,
        status: posTerminals.status,
        location: posTerminals.location,
        lastSync: posTerminals.lastSync,
        metadata: posTerminals.metadata,
        createdAt: posTerminals.createdAt,
        updatedAt: posTerminals.updatedAt,
      })
      .from(posTerminals)
      .where(filters)
      .orderBy(posTerminals.name);

    const terminals = rows.map((row) => ({
      ...row,
      isActive: row.status === "active",
    }));

    // Retornar terminales
    return NextResponse.json({
      data: terminals,
    });
  } catch (error) {
    console.error("Error fetching POS terminals:", error);
    return NextResponse.json(
      { error: "Failed to fetch POS terminals" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener datos del body
    const body = await request.json();
    const { name, description, location, isActive = true, tenantSlug } = body;

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 },
      );
    }

    // Validar datos
    if (!name) {
      return NextResponse.json(
        { error: "Terminal name is required" },
        { status: 400 },
      );
    }

    // Obtener tenant ID desde el slug
    const tenantResult = await db.execute(
      sql`SELECT id FROM tenants WHERE slug = ${tenantSlug}`,
    );

    if (!tenantResult || (tenantResult as any[]).length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = (tenantResult as any[])[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    const terminalIdValue =
      (body.terminalId as string | undefined)?.trim() ||
      `web-${crypto.randomUUID?.() ?? `${Date.now()}`}`;

    const status = isActive !== false ? "active" : "inactive";

    const [inserted] = await db
      .insert(posTerminals)
      .values({
        tenantId,
        name,
        terminalId: terminalIdValue,
        status,
        location: (location as string | undefined) || null,
        metadata: description ? { description } : undefined,
      })
      .returning({ id: posTerminals.id });

    return NextResponse.json({
      success: true,
      message: "POS terminal created successfully",
      data: {
        id: inserted?.id,
        name,
        terminalId: terminalIdValue,
        location: location || null,
        isActive: status === "active",
      },
    });
  } catch (error) {
    console.error("Error creating POS terminal:", error);
    return NextResponse.json(
      { error: "Failed to create POS terminal" },
      { status: 500 },
    );
  }
}

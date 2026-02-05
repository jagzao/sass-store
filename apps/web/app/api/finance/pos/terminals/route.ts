import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

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

    if (!tenantResult.rows || tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult.rows[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    // Construir query
    const conditions = [];

    if (active !== null) {
      conditions.push(sql`is_active = ${active === "true"}`);
    }

    const whereClause =
      conditions.length > 0 ? sql`WHERE ${conditions.join(" AND ")}` : sql``;

    // Consultar terminales POS
    const terminalsResult = await db.execute(
      sql`
        SELECT 
          id,
          tenant_id as "tenantId",
          name,
          description,
          location,
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM pos_terminals
        WHERE tenant_id = ${tenantId}
          ${whereClause}
        ORDER BY name
      `,
    );

    const terminals = terminalsResult.rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description,
      location: row.location,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
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

    if (!tenantResult.rows || tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult.rows[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    // Crear terminal POS
    const terminalResult = await db.execute(
      sql`
        INSERT INTO pos_terminals (
          tenant_id,
          name,
          description,
          location,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${tenantId},
          ${name},
          ${description || null},
          ${location || null},
          ${isActive},
          NOW(),
          NOW()
        ) RETURNING id
      `,
    );

    const terminalId = terminalResult.rows[0].id;

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: "POS terminal created successfully",
      data: {
        id: terminalId,
        name,
        description,
        location,
        isActive,
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

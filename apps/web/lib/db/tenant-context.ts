import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * Middleware para establecer el contexto de tenant en las operaciones de base de datos.
 * Este middleware se encarga de:
 * 1. Obtener el tenantSlug de la sesión del usuario o de la URL
 * 2. Verificar que el tenant existe
 * 3. Establecer el contexto de tenant en la base de datos usando set_tenant_context
 * 4. Ejecutar el handler con el contexto de tenant establecido
 */
export async function withTenantContext(
  request: NextRequest,
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>,
  options?: {
    getTenantSlugFromSession?: boolean;
    getTenantSlugFromUrl?: boolean;
    requireAuth?: boolean;
    logLevel?: LogLevel;
  },
) {
  const tenantLogger = logger.withContext("TenantContext");
  const logLevel = options?.logLevel || "info";
  const startTime = Date.now();

  // Configurar nivel de logging para esta instancia
  (tenantLogger as any).level = logLevel;

  try {
    // Obtener tenantSlug de la sesión o de la URL
    let tenantSlug: string | null = null;

    if (options?.getTenantSlugFromUrl) {
      // Extraer tenantSlug de la URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const tenantIndex = pathParts.findIndex((part) => part === "t");
      if (tenantIndex !== -1 && tenantIndex + 1 < pathParts.length) {
        tenantSlug = pathParts[tenantIndex + 1];
      }
      tenantLogger.debug(`Extracted tenant slug from URL: ${tenantSlug}`);
    } else if (
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test") &&
      request.headers.get("x-tenant-slug")
    ) {
      // Allow overriding tenant context via header in dev/test for easier testing
      tenantSlug = request.headers.get("x-tenant-slug");
      tenantLogger.debug(`Extracted tenant slug from header: ${tenantSlug}`);
    } else {
      // Por defecto, obtener de la sesión
      if (options?.requireAuth !== false) {
        const session = await auth();
        tenantSlug = session?.user?.tenantSlug || null;
        tenantLogger.debug(`Extracted tenant slug from session: ${tenantSlug}`);
      }
    }

    if (!tenantSlug) {
      tenantLogger.error("Tenant slug not found");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    tenantLogger.info(`Using tenant slug: ${tenantSlug}`);

    // Verificar que el tenant existe
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenantResult || tenantResult.length === 0) {
      tenantLogger.error(`Tenant not found in database: ${tenantSlug}`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult[0].id;
    tenantLogger.info(`Tenant found: ${tenantSlug} (${tenantId})`);

    // Establecer contexto de tenant en la base de datos
    try {
      await db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`);
      tenantLogger.info(`Tenant context set successfully for ${tenantSlug}`);
    } catch (error) {
      tenantLogger.error("Error setting tenant context", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Ejecutar el handler con el contexto de tenant establecido
    const response = await handler(request, tenantId.toString());

    const duration = Date.now() - startTime;
    tenantLogger.info(
      `Request completed in ${duration}ms for tenant ${tenantSlug}`,
    );

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    tenantLogger.error(
      `Error in tenant context middleware after ${duration}ms`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Versión simplificada para rutas que obtienen el tenantSlug de los parámetros de la URL
 */
export async function withTenantContextFromParams(
  request: NextRequest,
  params: { tenant: string },
  handler: (request: NextRequest, tenantId: string) => Promise<NextResponse>,
) {
  const tenantLogger = logger.withContext("TenantContext");
  const startTime = Date.now();

  try {
    const tenantSlug = params.tenant;

    if (!tenantSlug) {
      tenantLogger.error("Tenant slug not found in params");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    tenantLogger.info(`Using tenant slug from params: ${tenantSlug}`);

    // Verificar que el tenant existe
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenantResult || tenantResult.length === 0) {
      tenantLogger.error(`Tenant not found in database: ${tenantSlug}`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult[0].id;
    tenantLogger.info(`Tenant found: ${tenantSlug} (${tenantId})`);

    // Establecer contexto de tenant en la base de datos
    try {
      await db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`);
      tenantLogger.info(`Tenant context set successfully for ${tenantSlug}`);
    } catch (error) {
      tenantLogger.error("Error setting tenant context", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    // Ejecutar el handler con el contexto de tenant establecido
    const response = await handler(request, tenantId.toString());

    const duration = Date.now() - startTime;
    tenantLogger.info(
      `Request completed in ${duration}ms for tenant ${tenantSlug}`,
    );

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    tenantLogger.error(
      `Error in tenant context middleware after ${duration}ms`,
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

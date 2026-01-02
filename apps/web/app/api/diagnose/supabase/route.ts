import { NextRequest, NextResponse } from "next/server";
import {
  db,
  checkDatabaseConnection,
  getDatabaseDebugInfo,
} from "@sass-store/database";
import {
  tenants,
  products,
  services,
  staff,
  bookings,
  customers,
} from "@sass-store/database/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      connection: {},
      database: {},
      tables: {},
      tenants: {},
      errors: [] as string[],
    };

    // 1. Verificar configuración de conexión
    try {
      const debugInfo = getDatabaseDebugInfo();
      results.connection = {
        ...debugInfo,
        status: "configured",
      };
    } catch (error) {
      results.errors.push(
        `Error en configuración de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.connection = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 2. Verificar conexión básica a la base de datos
    try {
      const isConnected = await checkDatabaseConnection();
      results.database = {
        connected: isConnected,
        status: isConnected ? "connected" : "disconnected",
      };
    } catch (error) {
      results.errors.push(
        `Error en conexión básica: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.database = {
        connected: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 3. Verificar estructura de tablas principales
    try {
      const tablesToCheck = [
        { name: "tenants", schema: tenants },
        { name: "products", schema: products },
        { name: "services", schema: services },
        { name: "staff", schema: staff },
        { name: "bookings", schema: bookings },
        { name: "customers", schema: customers },
      ];

      for (const table of tablesToCheck) {
        try {
          // Intentar contar registros en la tabla
          const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(table.schema);
          results.tables[table.name] = {
            exists: true,
            count: countResult[0]?.count || 0,
            status: "ok",
          };
        } catch (error) {
          results.errors.push(
            `Error al verificar tabla ${table.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          results.tables[table.name] = {
            exists: false,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    } catch (error) {
      results.errors.push(
        `Error general al verificar tablas: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.tables = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 4. Verificar tenant wondernails específicamente
    try {
      const tenantResult = await db
        .select()
        .from(tenants)
        .where(sql`${tenants.slug} = 'wondernails'`);

      if (tenantResult.length > 0) {
        const tenant = tenantResult[0];
        results.tenants = {
          wondernails: {
            exists: true,
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            mode: tenant.mode,
            status: tenant.status,
            branding: tenant.branding,
            contact: tenant.contact,
            location: tenant.location,
            quotas: tenant.quotas,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
          },
          status: "found",
        };

        // 5. Verificar datos relacionados con el tenant wondernails
        try {
          // Verificar productos del tenant
          const productsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(sql`${products.tenantId} = ${tenant.id}`);

          // Verificar servicios del tenant
          const servicesCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(services)
            .where(sql`${services.tenantId} = ${tenant.id}`);

          // Verificar staff del tenant
          const staffCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(staff)
            .where(sql`${staff.tenantId} = ${tenant.id}`);

          // Verificar bookings del tenant
          const bookingsCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(sql`${bookings.tenantId} = ${tenant.id}`);

          // Verificar customers del tenant
          const customersCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(customers)
            .where(sql`${customers.tenantId} = ${tenant.id}`);

          results.tenants.wondernails = {
            ...results.tenants.wondernails,
            productsCount: productsCount[0]?.count || 0,
            servicesCount: servicesCount[0]?.count || 0,
            staffCount: staffCount[0]?.count || 0,
            bookingsCount: bookingsCount[0]?.count || 0,
            customersCount: customersCount[0]?.count || 0,
          };
        } catch (error) {
          results.errors.push(
            `Error al verificar datos del tenant wondernails: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          results.tenants.wondernails = {
            ...results.tenants.wondernails,
            dataError: error instanceof Error ? error.message : "Unknown error",
          };
        }
      } else {
        results.tenants = {
          wondernails: {
            exists: false,
          },
          status: "not_found",
        };
        results.errors.push(
          "Tenant wondernails no encontrado en la base de datos",
        );
      }
    } catch (error) {
      results.errors.push(
        `Error al buscar tenant wondernails: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.tenants = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 6. Verificar configuración de RLS (Row Level Security)
    try {
      // Verificar si RLS está habilitado para la tabla tenants
      const rlsCheck = await db.execute(sql`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'tenants'
      `);

      const rlsEnabled = rlsCheck[0]?.relrowsecurity || false;

      results.database = {
        ...results.database,
        rlsEnabled,
        rlsStatus: rlsEnabled ? "enabled" : "disabled",
      };
    } catch (error) {
      results.errors.push(
        `Error al verificar RLS: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.database = {
        ...results.database,
        rlsStatus: "error",
        rlsError: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 7. Verificar información de la conexión y pooler
    try {
      const poolerInfo = await db.execute(sql`
        SELECT version(),
               current_database(),
               current_user,
               inet_server_addr(),
               inet_server_port(),
               inet_client_addr(),
               inet_client_port()
      `);

      results.database = {
        ...results.database,
        serverInfo: poolerInfo[0] || {},
      };
    } catch (error) {
      results.errors.push(
        `Error al obtener información del servidor: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.database = {
        ...results.database,
        serverInfo: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }

    // Determinar estado general
    const hasErrors = results.errors.length > 0;
    const isConnected = results.database.connected === true;
    const tenantExists = results.tenants.wondernails?.exists === true;

    return NextResponse.json({
      success: !hasErrors && isConnected && tenantExists,
      status: hasErrors
        ? "error"
        : isConnected && tenantExists
          ? "ok"
          : "warning",
      errorCount: results.errors.length,
      ...results,
    });
  } catch (error) {
    console.error("[DIAGNOSE] Error en diagnóstico de Supabase:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: "Error general en diagnóstico de Supabase",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

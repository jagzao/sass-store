import { NextRequest, NextResponse } from "next/server";
import { db, checkDatabaseConnection } from "@sass-store/database";
import { sql } from "drizzle-orm";

interface TableInfo {
  name: string;
  exists: boolean;
  columns?: any[];
  indexes?: any[];
  foreignKeys?: any[];
  rowCount?: number;
  status: string;
  error?: string;
}

interface SchemaInfo {
  connected: boolean;
  tables: Record<string, TableInfo>;
  rlsEnabled: boolean;
  errors: string[];
}

export async function GET() {
  try {
    const results: SchemaInfo = {
      connected: false,
      tables: {},
      rlsEnabled: false,
      errors: [],
    };

    // 1. Verificar conexión a la base de datos
    try {
      const isConnected = await checkDatabaseConnection();
      results.connected = isConnected;

      if (!isConnected) {
        results.errors.push(
          "No se pudo establecer conexión con la base de datos",
        );
        return NextResponse.json({
          success: false,
          ...results,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      results.errors.push(
        `Error al verificar conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return NextResponse.json({
        success: false,
        ...results,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Verificar RLS (Row Level Security)
    try {
      const rlsResult = await db.execute(sql`
        SELECT 
          t.relname as table_name,
          t.relrowsecurity as rls_enabled
        FROM pg_class t
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.relkind = 'r'
        ORDER BY t.relname
      `);

      const rlsTables = rlsResult as any[];
      const hasRlsEnabled = rlsTables.some((table: any) => table.rls_enabled);

      results.rlsEnabled = hasRlsEnabled;

      // Agregar información de RLS a cada tabla
      rlsTables.forEach((table: any) => {
        if (results.tables[table.table_name]) {
          results.tables[table.table_name].rlsEnabled = table.rls_enabled;
        }
      });
    } catch (error) {
      results.errors.push(
        `Error al verificar RLS: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // 3. Listar todas las tablas del esquema público
    try {
      const tablesResult = await db.execute(sql`
        SELECT 
          t.relname as table_name,
          obj_description(t.oid) as table_comment
        FROM pg_class t
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.relkind = 'r'
        ORDER BY t.relname
      `);

      const tables = tablesResult as any[];

      // Inicializar información de tablas
      for (const table of tables) {
        results.tables[table.table_name] = {
          name: table.table_name,
          exists: true,
          status: "pending",
        };
      }
    } catch (error) {
      results.errors.push(
        `Error al listar tablas: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    // 4. Verificar estructura de tablas principales
    const mainTables = [
      "tenants",
      "products",
      "services",
      "staff",
      "bookings",
      "customers",
      "users",
      "accounts",
      "sessions",
      "orders",
      "payments",
      "media_assets",
      "social_posts",
      "campaigns",
      "reels",
    ];

    for (const tableName of mainTables) {
      try {
        // Verificar si la tabla existe
        const tableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          )
        `);

        const exists = (tableExists[0] as any).exists;

        if (!exists) {
          results.tables[tableName] = {
            name: tableName,
            exists: false,
            status: "missing",
          };
          continue;
        }

        // Obtener información de columnas
        const columnsResult = await db.execute(sql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
          ORDER BY ordinal_position
        `);

        // Obtener información de índices
        const indexesResult = await db.execute(sql`
          SELECT 
            i.relname as index_name,
            am.amname as index_type,
            ix.indisunique as is_unique,
            ix.indisprimary as is_primary,
            array_agg(a.attname ORDER BY c.ordinality) as column_names
          FROM pg_index ix
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN pg_am am ON am.oid = i.relam
          JOIN unnest(ix.indkey) WITH ORDINALITY AS c(attnum, ordinality) 
            ON c.attnum = ANY(ix.indkey)
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.attnum
          WHERE n.nspname = 'public'
          AND t.relname = ${tableName}
          GROUP BY i.relname, am.amname, ix.indisunique, ix.indisprimary
          ORDER BY i.relname
        `);

        // Obtener información de claves foráneas
        const foreignKeysResult = await db.execute(sql`
          SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND tc.table_name = ${tableName}
        `);

        // Obtener conteo de registros
        const countResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM ${sql.raw(tableName)}
        `);

        results.tables[tableName] = {
          name: tableName,
          exists: true,
          columns: columnsResult,
          indexes: indexesResult,
          foreignKeys: foreignKeysResult,
          rowCount: (countResult[0] as any).count,
          status: "ok",
        };
      } catch (error) {
        results.errors.push(
          `Error al verificar tabla ${tableName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        results.tables[tableName] = {
          name: tableName,
          exists: false,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    // 5. Verificar tenant wondernails específicamente
    try {
      const tenantExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM tenants 
          WHERE slug = 'wondernails'
        )
      `);

      const exists = (tenantExists[0] as any).exists;

      if (exists) {
        // Obtener información completa del tenant
        const tenantInfo = await db.execute(sql`
          SELECT 
            id,
            name,
            slug,
            mode,
            status,
            timezone,
            branding,
            contact,
            location,
            quotas,
            google_calendar_connected,
            created_at,
            updated_at
          FROM tenants 
          WHERE slug = 'wondernails'
        `);

        results.tables["wondernails_tenant"] = {
          name: "wondernails_tenant",
          exists: true,
          tenantInfo: tenantInfo[0] || null,
          status: "found",
        };
      } else {
        results.tables["wondernails_tenant"] = {
          name: "wondernails_tenant",
          exists: false,
          status: "not_found",
        };
        results.errors.push("Tenant wondernails no encontrado");
      }
    } catch (error) {
      results.errors.push(
        `Error al buscar tenant wondernails: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.tables["wondernails_tenant"] = {
        name: "wondernails_tenant",
        exists: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    // 6. Verificar políticas RLS para el tenant
    try {
      const rlsPolicies = await db.execute(sql`
        SELECT 
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual
        FROM pg_policies
        WHERE tablename IN ('tenants', 'products', 'services', 'staff', 'bookings', 'customers')
        ORDER BY tablename, policyname
      `);

      results.tables["rls_policies"] = {
        name: "rls_policies",
        exists: true,
        policies: rlsPolicies,
        status: "ok",
      };
    } catch (error) {
      results.errors.push(
        `Error al verificar políticas RLS: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.tables["rls_policies"] = {
        name: "rls_policies",
        exists: false,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results,
      errorCount: results.errors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[DIAGNOSE] Error en diagnóstico de estructura de base de datos:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: "Error general en diagnóstico de estructura de base de datos",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

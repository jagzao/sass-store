import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

interface ConnectionTestResult {
  name: string;
  connectionString: string;
  success: boolean;
  error?: string;
  duration?: number;
  details?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionStrings } = body;

    if (!connectionStrings || !Array.isArray(connectionStrings)) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere un array de connectionStrings para probar",
        },
        { status: 400 },
      );
    }

    const results: ConnectionTestResult[] = [];

    for (const connString of connectionStrings) {
      const startTime = Date.now();
      let client: postgres.Sql | null = null;

      try {
        // Crear cliente con timeout corto para pruebas
        client = postgres(connString, {
          prepare: false,
          ssl: connString.includes("localhost") ? false : "require",
          max: 1,
          idle_timeout: 5,
          connect_timeout: 5,
          max_lifetime: 30,
        });

        // Probar conexión simple
        await client`SELECT 1`;

        const duration = Date.now() - startTime;

        // Obtener información del servidor
        const serverInfo = await client`
          SELECT 
            version(),
            current_database(),
            current_user,
            inet_server_addr(),
            inet_server_port()
        `;

        results.push({
          name: connString.name || `Connection ${results.length + 1}`,
          connectionString: connString,
          success: true,
          duration,
          details: {
            serverInfo: serverInfo[0] || {},
            maskedString: connString.replace(/:[^:@]*@/, ":****@"),
          },
        });

        // Cerrar conexión
        await client.end({ timeout: 2 });
      } catch (error) {
        const duration = Date.now() - startTime;

        results.push({
          name: connString.name || `Connection ${results.length + 1}`,
          connectionString: connString,
          success: false,
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
          details: {
            maskedString: connString.replace(/:[^:@]*@/, ":****@"),
          },
        });

        // Intentar cerrar conexión si existe
        if (client) {
          try {
            await client.end({ timeout: 1 });
          } catch (endError) {
            console.warn("Error closing connection:", endError);
          }
        }
      }
    }

    // Analizar resultados
    const successfulConnections = results.filter((r) => r.success);
    const failedConnections = results.filter((r) => !r.success);

    const fastestConnection =
      successfulConnections.length > 0
        ? successfulConnections.reduce((prev, current) =>
            (prev.duration || Infinity) < (current.duration || Infinity)
              ? prev
              : current,
          )
        : null;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successfulConnections.length,
        failed: failedConnections.length,
        fastest: fastestConnection?.name || null,
        fastestTime: fastestConnection?.duration || null,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DIAGNOSE] Error en pruebas de conexión:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error general en pruebas de conexión",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// GET endpoint para probar con configuraciones predefinidas
export async function GET() {
  // Configuraciones predefinidas para probar
  const predefinedConfigs = [
    {
      name: "Actual (desde .env)",
      connectionString: process.env.DATABASE_URL || "",
    },
    {
      name: "Directa (sin pooler)",
      connectionString:
        process.env.DIRECT_DATABASE_URL ||
        "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@db.jedryjmljffuvegggjmw.supabase.co:5432/postgres",
    },
    {
      name: "Pooler (actual)",
      connectionString:
        "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    },
    {
      name: "Pooler (sin pgbouncer)",
      connectionString:
        "postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
    },
    {
      name: "Local (desarrollo)",
      connectionString:
        "postgresql://postgres:postgres@localhost:5432/sass_store",
    },
  ];

  // Filtrar configuraciones vacías
  const validConfigs = predefinedConfigs.filter(
    (config) => config.connectionString.trim() !== "",
  );

  if (validConfigs.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "No hay configuraciones de conexión válidas para probar",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  // Extraer la lógica del POST para evitar duplicación
  const results: ConnectionTestResult[] = [];

  for (const connString of validConfigs) {
    const startTime = Date.now();
    let client: postgres.Sql | null = null;

    try {
      // Crear cliente con timeout corto para pruebas
      client = postgres(connString.connectionString, {
        prepare: false,
        ssl: connString.connectionString.includes("localhost")
          ? false
          : "require",
        max: 1,
        idle_timeout: 5,
        connect_timeout: 5,
        max_lifetime: 30,
      });

      // Probar conexión simple
      await client`SELECT 1`;

      const duration = Date.now() - startTime;

      // Obtener información del servidor - consulta simplificada
      const serverInfo = await client`
        SELECT version()
      `;

      results.push({
        name: connString.name,
        connectionString: connString.connectionString,
        success: true,
        duration,
        details: {
          serverInfo: serverInfo[0] || {},
          maskedString: connString.connectionString.replace(
            /:[^:@]*@/,
            ":****@",
          ),
        },
      });

      // Cerrar conexión
      await client.end({ timeout: 2 });
    } catch (error) {
      const duration = Date.now() - startTime;

      results.push({
        name: connString.name,
        connectionString: connString.connectionString,
        success: false,
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          maskedString: connString.connectionString.replace(
            /:[^:@]*@/,
            ":****@",
          ),
        },
      });

      // Intentar cerrar conexión si existe
      if (client) {
        try {
          await client.end({ timeout: 1 });
        } catch (endError) {
          console.warn("Error closing connection:", endError);
        }
      }
    }
  }

  // Analizar resultados
  const successfulConnections = results.filter((r) => r.success);
  const failedConnections = results.filter((r) => !r.success);

  const fastestConnection =
    successfulConnections.length > 0
      ? successfulConnections.reduce((prev, current) =>
          (prev.duration || Infinity) < (current.duration || Infinity)
            ? prev
            : current,
        )
      : null;

  return NextResponse.json({
    success: true,
    summary: {
      total: results.length,
      successful: successfulConnections.length,
      failed: failedConnections.length,
      fastest: fastestConnection?.name || null,
      fastestTime: fastestConnection?.duration || null,
    },
    results,
    timestamp: new Date().toISOString(),
  });
}

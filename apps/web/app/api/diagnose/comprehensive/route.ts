import { NextRequest, NextResponse } from "next/server";

interface DiagnosticResult {
  name: string;
  status: "ok" | "warning" | "error" | "pending";
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export async function GET() {
  try {
    const startTime = Date.now();
    const results: DiagnosticResult[] = [];
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";

    // 1. Verificar ping básico
    try {
      const pingStart = Date.now();
      const pingResponse = await fetch(`${baseUrl}/api/diagnose/ping`);
      const pingDuration = Date.now() - pingStart;

      if (pingResponse.ok) {
        const pingData = await pingResponse.json();
        results.push({
          name: "Ping básico",
          status: "ok",
          success: true,
          data: pingData,
          duration: pingDuration,
        });
      } else {
        results.push({
          name: "Ping básico",
          status: "error",
          success: false,
          error: `HTTP ${pingResponse.status}`,
          duration: pingDuration,
        });
      }
    } catch (error) {
      results.push({
        name: "Ping básico",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 2. Verificar diagnóstico de Supabase
    try {
      const supabaseStart = Date.now();
      const supabaseResponse = await fetch(`${baseUrl}/api/diagnose/supabase`);
      const supabaseDuration = Date.now() - supabaseStart;

      if (supabaseResponse.ok) {
        const supabaseData = await supabaseResponse.json();
        results.push({
          name: "Diagnóstico de Supabase",
          status: supabaseData.success ? "ok" : "error",
          success: supabaseData.success,
          data: supabaseData,
          duration: supabaseDuration,
        });
      } else {
        results.push({
          name: "Diagnóstico de Supabase",
          status: "error",
          success: false,
          error: `HTTP ${supabaseResponse.status}`,
          duration: supabaseDuration,
        });
      }
    } catch (error) {
      results.push({
        name: "Diagnóstico de Supabase",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 3. Verificar estructura de base de datos
    try {
      const structureStart = Date.now();
      const structureResponse = await fetch(
        `${baseUrl}/api/diagnose/database-structure`,
      );
      const structureDuration = Date.now() - structureStart;

      if (structureResponse.ok) {
        const structureData = await structureResponse.json();
        results.push({
          name: "Estructura de base de datos",
          status: structureData.success ? "ok" : "error",
          success: structureData.success,
          data: structureData,
          duration: structureDuration,
        });
      } else {
        results.push({
          name: "Estructura de base de datos",
          status: "error",
          success: false,
          error: `HTTP ${structureResponse.status}`,
          duration: structureDuration,
        });
      }
    } catch (error) {
      results.push({
        name: "Estructura de base de datos",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 4. Verificar pruebas de conexión
    try {
      const connectionStart = Date.now();
      const connectionResponse = await fetch(
        `${baseUrl}/api/diagnose/connection-test`,
      );
      const connectionDuration = Date.now() - connectionStart;

      if (connectionResponse.ok) {
        const connectionData = await connectionResponse.json();
        results.push({
          name: "Pruebas de conexión",
          status: connectionData.success ? "ok" : "error",
          success: connectionData.success,
          data: connectionData,
          duration: connectionDuration,
        });
      } else {
        results.push({
          name: "Pruebas de conexión",
          status: "error",
          success: false,
          error: `HTTP ${connectionResponse.status}`,
          duration: connectionDuration,
        });
      }
    } catch (error) {
      results.push({
        name: "Pruebas de conexión",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // 5. Verificar tenant wondernails específicamente
    try {
      const tenantStart = Date.now();
      const tenantResponse = await fetch(
        `${baseUrl}/api/diagnose/tenant/wondernails`,
      );
      const tenantDuration = Date.now() - tenantStart;

      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        results.push({
          name: "Tenant wondernails",
          status: tenantData.success ? "ok" : "error",
          success: tenantData.success,
          data: tenantData,
          duration: tenantDuration,
        });
      } else {
        results.push({
          name: "Tenant wondernails",
          status: "error",
          success: false,
          error: `HTTP ${tenantResponse.status}`,
          duration: tenantDuration,
        });
      }
    } catch (error) {
      results.push({
        name: "Tenant wondernails",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Analizar resultados generales
    const totalDuration = Date.now() - startTime;
    const successfulTests = results.filter((r) => r.success).length;
    const failedTests = results.filter((r) => !r.success).length;

    let overallStatus: "ok" | "warning" | "error" = "ok";
    if (failedTests > 0) {
      overallStatus = failedTests >= results.length / 2 ? "error" : "warning";
    }

    // Extraer información clave para resumen
    const supabaseResult = results.find(
      (r) => r.name === "Diagnóstico de Supabase",
    );
    const tenantResult = results.find((r) => r.name === "Tenant wondernails");
    const connectionResult = results.find(
      (r) => r.name === "Pruebas de conexión",
    );

    const summary = {
      totalTests: results.length,
      successful: successfulTests,
      failed: failedTests,
      overallStatus,
      totalDuration,
      databaseConnected: supabaseResult?.data?.database?.connected || false,
      tenantExists: tenantResult?.data?.tenantExists || false,
      connectionIssues: connectionResult?.data?.summary?.failed || 0,
      criticalErrors: failedTests > 0,
    };

    // Generar recomendaciones basadas en los resultados
    const recommendations: string[] = [];

    if (!summary.databaseConnected) {
      recommendations.push(
        "Verificar la configuración de conexión a la base de datos",
      );
      recommendations.push("Comprobar las variables de entorno DATABASE_URL");
    }

    if (!summary.tenantExists) {
      recommendations.push(
        "Verificar si el tenant wondernails existe en la base de datos",
      );
      recommendations.push(
        "Ejecutar el script de seed para crear el tenant si es necesario",
      );
    }

    if (summary.connectionIssues > 0) {
      recommendations.push("Probar diferentes configuraciones de conexión");
      recommendations.push("Verificar la configuración del pooler de Supabase");
    }

    if (supabaseResult?.data?.database?.rlsEnabled === false) {
      recommendations.push(
        "Considerar habilitar Row Level Security (RLS) para mayor seguridad",
      );
    }

    return NextResponse.json({
      success: overallStatus !== "error",
      status: overallStatus,
      summary,
      results,
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DIAGNOSE] Error en diagnóstico integral:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: "Error general en diagnóstico integral",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

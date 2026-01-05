import { NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log(
      "[DIAGNOSTIC] Iniciando prueba de conexión a la base de datos...",
    );

    // Intentar una consulta simple
    const result = await db.execute(sql`SELECT NOW() as current_time`);

    return NextResponse.json({
      status: "success",
      message: "Conexión a la base de datos exitosa",
      timestamp: result[0]?.current_time || new Date().toISOString(),
      details: {
        query: "SELECT NOW()",
        resultCount: result.length,
      },
    });
  } catch (error) {
    console.error(
      "[DIAGNOSTIC] Error en la conexión a la base de datos:",
      error,
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Error al conectar con la base de datos",
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

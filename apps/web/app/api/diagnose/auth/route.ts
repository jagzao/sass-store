import { NextResponse } from "next/server";
import { handlers, auth } from "@/lib/auth";
// Removed static import to prevent top-level await hanging
// import { db, sql } from "@sass-store/database";

// Force dynamic execution
export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();

  // Get DB debug info if available (using dynamic import to avoid crashes if package not updated)
  let dbInfo: any = {}; // Define dbInfo here
  let dbModule: any = null; // Hold the module

  try {
    // Race the module import
    dbModule = await Promise.race([
      import("@sass-store/database"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("IMPORT_TIMEOUT")), 2000),
      ),
    ]);

    if (dbModule && dbModule.getDatabaseDebugInfo) {
      dbInfo = dbModule.getDatabaseDebugInfo();
    }
  } catch (e: any) {
    dbInfo = { error: `Could not load database debug info: ${e.message}` };
  }

  const diagnostic = {
    status: "unknown",
    timestamp: new Date().toISOString(),
    latency: 0,
    auth: {
      handlersAvailable: !!handlers,
      authHelperAvailable: !!auth,
    },
    env: {
      nextAuthUrl: process.env.NEXTAUTH_URL || "NOT_SET",
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      nodeEnv: process.env.NODE_ENV,
    },
    database: {
      status: "unknown",
      connection: "unknown",
      latencyMs: 0,
      config: dbInfo,
      notes: "",
    },
  };

  try {
    // Test import
    if (handlers) {
      diagnostic.status = "imports_ok";
    }

    // Test DB Connection (basic) with strict timeout
    if (dbModule && dbModule.db && dbModule.sql) {
      try {
        const db = dbModule.db; // Use locally loaded db
        const sql = dbModule.sql;

        const dbStart = performance.now();

        // Create a timeout promise that rejects after 3 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("DB_CONNECTION_TIMEOUT_3000MS")),
            3000,
          ),
        );

        // Race the DB query against the timeout
        await Promise.race([
          db.execute(sql`SELECT 1 as connected`),
          timeoutPromise,
        ]);

        const dbEnd = performance.now();

        diagnostic.database.status = "connected";
        diagnostic.database.connection = "ok";
        diagnostic.database.latencyMs = Math.round(dbEnd - dbStart);
      } catch (e: any) {
        diagnostic.database.status = "error";
        diagnostic.database.connection = e.message;
        // If it was a timeout, explicitly note it
        if (e.message === "DB_CONNECTION_TIMEOUT_3000MS") {
          diagnostic.database.notes =
            "The database connection hung and was aborted to preserve the request.";
        }
      }
    } else {
      diagnostic.database.status = "skipped";
      diagnostic.database.connection = "Database module failed to load";
    }

    const end = performance.now();
    diagnostic.latency = Math.round(end - start);

    return NextResponse.json(diagnostic);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "crash",
        error: error.message,
        stack: error.stack,
      },
      { status: 200 }, // Return 200 even on crash to see the error in browser
    );
  }
}

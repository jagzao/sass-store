import { NextResponse } from "next/server";
import { handlers, auth } from "@/lib/auth";
import { db, sql } from "@sass-store/database";

// Force dynamic execution
export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostic = {
    status: "unknown",
    timestamp: new Date().toISOString(),
    auth: {
      handlersAvailable: !!handlers,
      authHelperAvailable: !!auth,
      getHandler: typeof handlers?.GET,
      postHandler: typeof handlers?.POST,
    },
    env: {
      nextAuthUrl: process.env.NEXTAUTH_URL || "NOT_SET",
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
    database: {
      status: "unknown",
      connection: "unknown",
    },
  };

  try {
    // Test import
    if (handlers && handlers.GET && handlers.POST) {
      diagnostic.status = "imports_ok";
    } else {
      diagnostic.status = "imports_missing";
      return NextResponse.json(diagnostic, { status: 500 });
    }

    // Test DB Connection (basic)
    try {
      const result = await db.execute(sql`SELECT 1 as connected`);
      diagnostic.database.status = "connected";
      diagnostic.database.connection = "ok";
    } catch (e: any) {
      diagnostic.database.status = "error";
      diagnostic.database.connection = e.message;
    }

    return NextResponse.json(diagnostic);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "crash",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}

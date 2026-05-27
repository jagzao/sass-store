import { NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface CheckResult {
  status: "ok" | "warn" | "error";
  latencyMs?: number;
  message?: string;
}

async function checkDB(): Promise<CheckResult> {
  const t = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - t;
    return {
      status: latencyMs > 800 ? "warn" : "ok",
      latencyMs,
      message: latencyMs > 800 ? "Latencia elevada" : undefined,
    };
  } catch (err) {
    return {
      status: "error",
      message: "No se puede conectar a la base de datos",
    };
  }
}

async function checkOllama(): Promise<CheckResult> {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const t = Date.now();
  try {
    const resp = await fetch(`${base}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    const latencyMs = Date.now() - t;
    if (!resp.ok) {
      return { status: "warn", latencyMs, message: `HTTP ${resp.status}` };
    }
    return { status: "ok", latencyMs };
  } catch {
    return { status: "warn", message: "Ollama no disponible (opcional)" };
  }
}

async function checkN8n(): Promise<CheckResult> {
  const base = process.env.N8N_WEBHOOK_BASE_URL || "http://127.0.0.1:5678";
  const t = Date.now();
  try {
    const resp = await fetch(`${base}/healthz`, {
      signal: AbortSignal.timeout(3000),
    });
    const latencyMs = Date.now() - t;
    return resp.ok
      ? { status: "ok", latencyMs }
      : { status: "warn", latencyMs, message: `HTTP ${resp.status}` };
  } catch {
    return { status: "warn", message: "n8n no disponible (opcional)" };
  }
}

/**
 * GET /api/system/status
 * Aggregated health check for admin status panel.
 * Requires authenticated session.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [database, ollama, n8n] = await Promise.all([
    checkDB(),
    checkOllama(),
    checkN8n(),
  ]);

  const checks = { database, ollama, n8n };

  // Overall status: error if any critical check fails; warn if any optional check warns
  const hasError = database.status === "error";
  const hasWarn =
    !hasError && Object.values(checks).some((c) => c.status === "warn");

  const overall: "ok" | "warn" | "error" = hasError
    ? "error"
    : hasWarn
      ? "warn"
      : "ok";

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.0.0",
      checks,
    },
    { status: overall === "error" ? 503 : 200 },
  );
}

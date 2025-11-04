import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { posTerminals } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { getActorId } from "@/lib/api-auth";

// Validation schemas
const createTerminalSchema = z.object({
  terminalId: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  location: z.string().optional(),
});

const updateTerminalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
});

/**
 * GET /api/finance/pos/terminals
 * List all POS terminals for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(
      tenant.id,
      "pos:terminals:list"
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get terminals with RLS context
    const terminals = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select()
          .from(posTerminals)
          .orderBy(posTerminals.createdAt);
      }
    )) as any[];

    return NextResponse.json({
      data: terminals,
      count: terminals.length,
    });
  } catch (error) {
    console.error("POS terminals GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finance/pos/terminals
 * Create a new POS terminal
 */
export async function POST(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(
      tenant.id,
      "pos:terminals:create"
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const terminalData = createTerminalSchema.parse(body);

    // Check if terminal ID already exists
    const existingTerminal = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select()
          .from(posTerminals)
          .where(eq(posTerminals.terminalId, terminalData.terminalId))
          .limit(1);
      }
    )) as any[];

    if (existingTerminal.length > 0) {
      return NextResponse.json(
        { error: "Terminal ID already exists" },
        { status: 409 }
      );
    }

    // Create terminal
    const newTerminal = await db
      .insert(posTerminals)
      .values({
        tenantId: tenant.id,
        ...terminalData,
      })
      .returning();

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: await getActorId(request),
      action: "pos_terminal.created",
      targetTable: "pos_terminals",
      targetId: newTerminal[0].id,
      data: { created: terminalData },
    });

    return NextResponse.json(
      {
        data: newTerminal[0],
        message: "POS terminal created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POS terminals POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

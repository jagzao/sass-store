// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { checkDatabaseConnection, db } from "@sass-store/database/connection";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { requireDiagnoseAuth } from "@/lib/api/diagnose-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // STRY-021 SEC-009: Proteger con guard de diagnóstico
  const authError = requireDiagnoseAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant") || "wondernails";

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
      // STRY-021 SEC-009: Eliminado DATABASE_URL_preview — exponía host/credenciales parciales
    },
    tests: {},
  };

  // Test 1: Database connection using the built-in function
  try {
    const isConnected = await checkDatabaseConnection();
    diagnostics.tests.databaseConnection = {
      status: isConnected ? "✓ Success" : "✗ Failed",
      message: isConnected
        ? "Database connection successful"
        : "Database connection failed",
    };

    if (!isConnected) {
      return NextResponse.json(diagnostics, { status: 500 });
    }
  } catch (error: any) {
    diagnostics.tests.databaseConnection = {
      status: "✗ Failed",
      error: error.message,
      // STRY-022: stack trace removido — no exponer internals en respuestas
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Test 2: Query tenants table
  try {
    const allTenants = await db.query.tenants.findMany({
      columns: {
        id: true,
        slug: true,
        name: true,
        status: true,
      },
    });
    diagnostics.tests.tenantsQuery = {
      status: "✓ Success",
      count: allTenants.length,
      tenants: allTenants,
    };
  } catch (error: any) {
    diagnostics.tests.tenantsQuery = {
      status: "✗ Failed",
      error: error.message,
      // STRY-022: stack trace removido — no exponer internals en respuestas
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Test 3: Get specific tenant
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, tenantSlug),
    });

    diagnostics.tests.specificTenant = {
      status: tenant ? "✓ Found" : "✗ Not Found",
      slug: tenantSlug,
      tenant: tenant
        ? {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            mode: tenant.mode,
            status: tenant.status,
            branding: tenant.branding,
          }
        : null,
    };
  } catch (error: any) {
    diagnostics.tests.specificTenant = {
      status: "✗ Failed",
      error: error.message,
      // STRY-022: stack trace removido — no exponer internals en respuestas
    };
  }

  // Test 4: Check getTenantBySlug function
  try {
    const { getTenantBySlug } = await import("@/lib/server/get-tenant");
    const tenantData = await getTenantBySlug(tenantSlug);

    diagnostics.tests.getTenantBySlug = {
      status: tenantData ? "✓ Success" : "✗ Returned null",
      tenant: tenantData
        ? {
            id: tenantData.id,
            slug: tenantData.slug,
            name: tenantData.name,
            mode: tenantData.mode,
          }
        : null,
    };
  } catch (error: any) {
    diagnostics.tests.getTenantBySlug = {
      status: "✗ Failed",
      error: error.message,
      // STRY-022: stack trace removido — no exponer internals en respuestas
    };
  }

  const allPassed = Object.values(diagnostics.tests).every(
    (test: any) => test.status.includes("✓") || test.status.includes("Found"),
  );

  return NextResponse.json(diagnostics, {
    status: allPassed ? 200 : 500,
  });
}

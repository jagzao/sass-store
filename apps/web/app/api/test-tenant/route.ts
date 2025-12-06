import { NextResponse } from "next/server";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenantSlug = "wondernails";

  // Test what URL will be used
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:4000";
  const expectedUrl = `${apiUrl}/api/tenants/${tenantSlug}`;

  console.log(`[test-tenant] API_URL: ${process.env.API_URL}`);
  console.log(
    `[test-tenant] NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL}`,
  );
  console.log(`[test-tenant] Expected URL: ${expectedUrl}`);

  // Try using fetchStatic (same as layout)
  try {
    console.log(`[test-tenant] Calling fetchStatic...`);
    const tenantData = await fetchStatic<TenantData>(
      `/api/tenants/${tenantSlug}`,
      ["tenant", tenantSlug],
    );

    console.log(`[test-tenant] Success! Got tenant: ${tenantData?.name}`);

    return NextResponse.json({
      success: true,
      tenantName: tenantData?.name,
      tenantSlug: tenantData?.slug,
      method: "fetchStatic",
      expectedUrl,
    });
  } catch (error) {
    console.error(`[test-tenant] Error:`, error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      method: "fetchStatic",
      expectedUrl,
    });
  }
}

import type { NextRequest } from "next/server";
import {
  getTenantManifest,
  manifestToResponse,
} from "@/lib/pwa/manifest-service";

export const dynamic = "force-dynamic";

// STRY-026 — Web App Manifest dinámico por tenant.
// Sirve /t/[tenant]/manifest.webmanifest con la identidad del tenant.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const result = await getTenantManifest(tenant);
  return manifestToResponse(result);
}

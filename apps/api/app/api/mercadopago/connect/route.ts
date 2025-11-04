import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { resolveTenant } from "@/lib/tenant-resolver";

/**
 * POST /api/mercadopago/connect
 * Initiate Mercado Pago OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check if already connected
    const isConnected = await mercadoPagoService.isConnected(tenant.id);
    if (isConnected) {
      return NextResponse.json(
        {
          error: "Mercado Pago already connected",
          connected: true,
        },
        { status: 400 }
      );
    }

    // Generate OAuth URL
    const redirectUri = `${request.nextUrl.origin}/api/mercadopago/callback`;
    const authUrl = mercadoPagoService.generateAuthUrl(tenant.id, redirectUri);

    return NextResponse.json({
      authUrl,
      redirectUri,
    });
  } catch (error) {
    console.error("Mercado Pago connect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mercadopago/connect
 * Check connection status
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check connection status
    const isConnected = await mercadoPagoService.isConnected(tenant.id);

    return NextResponse.json({
      connected: isConnected,
      tenant: tenant.slug,
    });
  } catch (error) {
    console.error("Mercado Pago status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

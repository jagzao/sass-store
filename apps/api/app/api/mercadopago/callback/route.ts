import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { createAuditLog } from "@/lib/audit";

/**
 * GET /api/mercadopago/callback
 * Handle Mercado Pago OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // tenantId
    const error = url.searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Mercado Pago OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/t/${state}/finance?error=oauth_failed`,
          request.nextUrl.origin
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          `/t/${state}/finance?error=missing_params`,
          request.nextUrl.origin
        )
      );
    }

    // Exchange code for tokens
    const redirectUri = `${request.nextUrl.origin}/api/mercadopago/callback`;
    const tokens = await mercadoPagoService.exchangeCodeForTokens(
      code,
      redirectUri
    );

    // Store tokens for tenant
    await mercadoPagoService.storeTokens(state, tokens);

    // Create audit log
    await createAuditLog({
      tenantId: state,
      actorId: "system", // OAuth callback
      action: "mercadopago.connected",
      targetTable: "mercadopago_tokens",
      targetId: tokens.user_id,
      data: {
        connected: true,
        user_id: tokens.user_id,
      },
    });

    // Redirect to finance page with success
    return NextResponse.redirect(
      new URL(
        `/t/${state}/finance?success=mp_connected`,
        request.nextUrl.origin
      )
    );
  } catch (error) {
    console.error("Mercado Pago callback error:", error);

    // Extract tenant from state if possible
    const url = new URL(request.url);
    const state = url.searchParams.get("state") || "unknown";

    return NextResponse.redirect(
      new URL(
        `/t/${state}/finance?error=callback_failed`,
        request.nextUrl.origin
      )
    );
  }
}

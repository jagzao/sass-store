import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { createAuditLog } from "@/lib/audit";
import { validateOAuthState } from "@sass-store/core";

/**
 * GET /api/mercadopago/callback
 * Handle Mercado Pago OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("[MercadoPago OAuth] Error from provider:", error);
      return NextResponse.redirect(
        new URL(`/finance?error=oauth_failed`, request.nextUrl.origin),
      );
    }

    if (!code || !state) {
      console.warn("[MercadoPago OAuth] Missing code or state parameter");
      return NextResponse.redirect(
        new URL(`/finance?error=missing_params`, request.nextUrl.origin),
      );
    }

    // SECURITY: Validate state token to prevent CSRF attacks
    const tenantId = await validateOAuthState(state, "mercadopago");
    if (!tenantId) {
      console.error("[MercadoPago OAuth] Invalid or expired state token");
      return NextResponse.redirect(
        new URL(`/finance?error=invalid_state`, request.nextUrl.origin),
      );
    }

    // Exchange code for tokens
    const redirectUri = `${request.nextUrl.origin}/api/mercadopago/callback`;
    const tokens = await mercadoPagoService.exchangeCodeForTokens(
      code,
      redirectUri,
    );

    // Store tokens for tenant
    await mercadoPagoService.storeTokens(tenantId, tokens);

    // Create audit log
    await createAuditLog({
      tenantId,
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
    // Note: We should get the tenant slug from the DB using tenantId
    return NextResponse.redirect(
      new URL(`/finance?success=mp_connected`, request.nextUrl.origin),
    );
  } catch (error) {
    console.error("[MercadoPago OAuth] Callback error:", error);

    return NextResponse.redirect(
      new URL(`/finance?error=callback_failed`, request.nextUrl.origin),
    );
  }
}

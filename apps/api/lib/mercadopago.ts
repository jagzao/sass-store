/**
 * Mercado Pago Integration Service
 * Handles OAuth, payments, and financial data
 */

import { db } from "@sass-store/database";
import { mercadopagoTokens, mercadopagoPayments } from "@sass-store/database";
import { eq } from "drizzle-orm";

const MP_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.mercadopago.com"
    : "https://api.mercadopago.com"; // Same for sandbox

const MP_AUTH_URL =
  process.env.NODE_ENV === "production"
    ? "https://auth.mercadopago.com.mx"
    : "https://auth.mercadopago.com.mx"; // MX marketplace

export interface MPOAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  token_type?: string; // Usually "bearer"
  scope?: string;
  expires_at?: string; // Calculated field
}

export interface MPPayment {
  id: string;
  status: string;
  date_created: string;
  date_approved?: string;
  transaction_amount: number;
  payment_method: {
    id: string;
    type: string;
  };
  fees_details?: Array<{
    type: string;
    amount: number;
  }>;
  order?: {
    id: string;
  };
  external_reference?: string;
  payer: {
    id?: string;
    email?: string;
  };
  point_of_interaction?: {
    type: string;
    transaction_data?: {
      ticket_url?: string;
    };
  };
}

export class MercadoPagoService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.MP_CLIENT_ID || "";
    this.clientSecret = process.env.MP_CLIENT_SECRET || "";

    if (!this.clientId || !this.clientSecret) {
      console.warn("Mercado Pago credentials not configured");
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(tenantId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state: tenantId, // Pass tenant ID for callback
    });

    return `${MP_AUTH_URL}/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<MPOAuthTokens> {
    const response = await fetch(`${MP_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.clientSecret}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mercado Pago OAuth error: ${error}`);
    }

    const tokens: MPOAuthTokens = await response.json();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    return {
      ...tokens,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<MPOAuthTokens> {
    const response = await fetch(`${MP_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Mercado Pago token");
    }

    const tokens: MPOAuthTokens = await response.json();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    return {
      ...tokens,
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Get valid access token for tenant
   */
  async getValidAccessToken(tenantId: string): Promise<string> {
    const [tokenRecord] = await db
      .select()
      .from(mercadopagoTokens)
      .where(eq(mercadopagoTokens.tenantId, tenantId))
      .limit(1);

    if (!tokenRecord) {
      throw new Error("Mercado Pago not connected for this tenant");
    }

    const now = new Date();
    const expiresAt = tokenRecord.expiresAt ? new Date(tokenRecord.expiresAt) : now;

    // If token expires within 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      const newTokens = await this.refreshAccessToken(tokenRecord.refreshToken);

      // Update database
      await db
        .update(mercadopagoTokens)
        .set({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: new Date(newTokens.expires_at!),
          updatedAt: new Date(),
        })
        .where(eq(mercadopagoTokens.tenantId, tenantId));

      return newTokens.access_token;
    }

    return tokenRecord.accessToken;
  }

  /**
   * Fetch payments from Mercado Pago
   */
  async getPayments(
    tenantId: string,
    options: {
      from?: Date;
      to?: Date;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<MPPayment[]> {
    const accessToken = await this.getValidAccessToken(tenantId);

    const params = new URLSearchParams();
    if (options.from) params.append("begin_date", options.from.toISOString());
    if (options.to) params.append("end_date", options.to.toISOString());
    if (options.status) params.append("status", options.status);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.offset) params.append("offset", options.offset.toString());

    const response = await fetch(
      `${MP_BASE_URL}/v1/payments/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Mercado Pago API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Store Mercado Pago tokens for tenant
   */
  async storeTokens(tenantId: string, tokens: MPOAuthTokens): Promise<void> {
    await db
      .insert(mercadopagoTokens)
      .values({
        tenantId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type || "bearer",
        scope: tokens.scope,
        expiresAt: new Date(tokens.expires_at!),
      })
      .onConflictDoUpdate({
        target: mercadopagoTokens.tenantId,
        set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
          tokenType: tokens.token_type || "bearer",
          scope: tokens.scope,
          expiresAt: new Date(tokens.expires_at!),
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Check if tenant has Mercado Pago connected
   */
  async isConnected(tenantId: string): Promise<boolean> {
    try {
      const [tokenRecord] = await db
        .select()
        .from(mercadopagoTokens)
        .where(eq(mercadopagoTokens.tenantId, tenantId))
        .limit(1);

      return !!tokenRecord;
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect Mercado Pago for tenant
   */
  async disconnect(tenantId: string): Promise<void> {
    await db
      .delete(mercadopagoTokens)
      .where(eq(mercadopagoTokens.tenantId, tenantId));
  }
}

// Export singleton instance
export const mercadoPagoService = new MercadoPagoService();

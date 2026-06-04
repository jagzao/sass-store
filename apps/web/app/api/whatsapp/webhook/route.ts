/**
 * WhatsApp Webhook Handler — B1: Router reactivo
 *
 * Flujo:
 *  1. Verificar firma HMAC-SHA256 de Meta
 *  2. Normalizar mensaje
 *  3. Guardar en DB (siempre, idempotente)
 *  4. Resolver tenant por phone_number_id (cache Redis → DB)
 *  5. Clasificar intent
 *  6. Dispatch fire-and-forget a n8n webhook → respuesta < 3s a Meta
 *
 * Los workflows de n8n siguen corriendo cada 10 min como safety net.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@sass-store/database";
import { whatsappMessages } from "@sass-store/database/schema";
import { classifyIntent } from "@/lib/wa/intent-classifier";
import { resolveTenant } from "@/lib/wa/tenant-resolver";

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!;
const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://127.0.0.1:5678";
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

/** Mapeo intent → path del webhook en n8n */
const INTENT_WEBHOOK: Record<string, string> = {
  booking_start: "/webhook/wa-booking",
  confirm_yes: "/webhook/wa-booking-confirm",
  confirm_no: "/webhook/wa-booking-confirm",
  availability_query: "/webhook/wa-availability",
  pricing_query: "/webhook/wa-support",
  hours_query: "/webhook/wa-support",
  location_query: "/webhook/wa-support",
  support_query: "/webhook/wa-support",
  unknown: "/webhook/wa-support",
  human_request: "/webhook/wa-support",
  campaign_reply: "/webhook/wa-support",
};

// ─── Verificación del webhook (GET) ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Forbidden - Invalid verify token" },
    { status: 403 },
  );
}

// ─── Recepción de mensajes (POST) ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");

    if (!verifyMetaSignature(rawBody, signatureHeader)) {
      console.warn("[WA Webhook] Firma HMAC inválida — rechazado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: MetaWebhookPayload;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ success: true });
    }

    // Procesar cada mensaje: guardar + dispatch (sin await en dispatch)
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages) continue;
        for (const msg of value.messages) {
          const normalized = normalizeMessage(msg, value.metadata);
          // Guardar en DB — idempotente, siempre
          await saveMessage(normalized);
          // Dispatch reactivo a n8n — fire-and-forget
          dispatchToN8n(normalized).catch((e) =>
            console.error("[WA Webhook] Dispatch error:", e),
          );
        }
      }
    }

    // Meta requiere 200 en < 20s — lo retornamos inmediatamente
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WA Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ─── Dispatch a n8n ───────────────────────────────────────────────────────────

async function dispatchToN8n(msg: NormalizedMessage): Promise<void> {
  // Resolver tenant (cache Redis → DB)
  const tenantSlug = await resolveTenant(msg.phoneNumberId);
  if (!tenantSlug) {
    console.warn(
      "[WA Dispatch] Tenant no encontrado para phone_number_id:",
      msg.phoneNumberId,
    );
    return;
  }

  // Clasificar intent
  const intent = classifyIntent(msg.content, msg.buttonPayload);

  const webhookPath = INTENT_WEBHOOK[intent.type] ?? "/webhook/wa-support";
  const payload = { message: msg, intent, tenantSlug };

  await fetch(`${N8N_BASE_URL}${webhookPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(N8N_WEBHOOK_SECRET && { "X-WA-Secret": N8N_WEBHOOK_SECRET }),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
}

// ─── Persistencia en DB ───────────────────────────────────────────────────────

async function saveMessage(msg: NormalizedMessage): Promise<void> {
  try {
    await db
      .insert(whatsappMessages)
      .values({
        mensajeId: msg.messageId,
        numero: msg.phone,
        contenido: msg.content,
        tipo: msg.type,
        direccion: "inbound",
        estado: "received",
        tipoInteraccion: msg.interactionType,
        metadata: { phoneNumberId: msg.phoneNumberId },
      })
      .onConflictDoNothing();
  } catch (err) {
    // Log pero no lanzar — el webhook siempre debe retornar 200 a Meta
    console.error("[WA DB] Error guardando mensaje:", err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

function normalizeMessage(
  msg: MetaMessage,
  metadata: MetaMetadata,
): NormalizedMessage {
  let content = "";
  let interactionType = "texto";
  let buttonPayload: string | undefined;

  switch (msg.type) {
    case "text":
      content = msg.text?.body ?? "";
      break;
    case "button":
      content = msg.button?.text ?? "";
      buttonPayload = msg.button?.payload;
      interactionType = `button:${buttonPayload}`;
      break;
    case "interactive":
      if (msg.interactive?.type === "button_reply") {
        content = msg.interactive.button_reply?.title ?? "";
        buttonPayload = msg.interactive.button_reply?.id;
        interactionType = `button:${buttonPayload}`;
      } else if (msg.interactive?.type === "list_reply") {
        content = msg.interactive.list_reply?.title ?? "";
        interactionType = `list:${msg.interactive.list_reply?.id}`;
      }
      break;
  }

  return {
    messageId: msg.id,
    phone: msg.from,
    type: msg.type,
    content,
    buttonPayload,
    interactionType,
    timestamp: msg.timestamp,
    phoneNumberId: metadata.phone_number_id,
  };
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface NormalizedMessage {
  messageId: string;
  phone: string;
  type: string;
  content: string;
  buttonPayload?: string;
  interactionType: string;
  timestamp: string;
  phoneNumberId: string;
}

interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product: string;
        metadata: MetaMetadata;
        messages?: MetaMessage[];
      };
    }>;
  }>;
}

interface MetaMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { payload: string; text: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
}

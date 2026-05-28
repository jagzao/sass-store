/**
 * WhatsApp Webhook Handler
 *
 * Maneja mensajes entrantes y verificación del webhook
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 *
 * STRY-021 SEC-007: Verificación HMAC-SHA256 de Meta
 * STRY-021 PERF-007: Logs reducidos — sin PII, sin pretty-print
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@sass-store/database";
import { whatsappMessages } from "@sass-store/database/schema";

// Token de verificación del webhook (debe coincidir con Meta Developer Dashboard)
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!;

/**
 * Verifica la firma HMAC-SHA256 que Meta incluye en X-Hub-Signature-256.
 * Docs: https://developers.facebook.com/docs/messenger-platform/webhooks#validate-payloads
 */
function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Si no está configurado: en dev permitir, en prod rechazar siempre
  if (!appSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[WhatsApp Webhook] WHATSAPP_APP_SECRET no configurado — rechazando en producción",
      );
      return false;
    }
    return true; // dev sin secret configurado — permitir para facilitar testing local
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

  // Comparación timing-safe para evitar timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature),
    );
  } catch {
    // Buffer lengths differ — firma claramente incorrecta
    return false;
  }
}

/**
 * GET - Verificación del webhook
 * Meta envía este request para verificar que el webhook está configurado.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verificación exitosa");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Forbidden - Invalid verify token" },
    { status: 403 },
  );
}

/**
 * POST - Recibe mensajes de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    // Leer body como texto primero para poder verificar la firma HMAC
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");

    // STRY-021 SEC-007: Verificar firma de Meta antes de procesar
    if (!verifyMetaSignature(rawBody, signatureHeader)) {
      console.warn(
        "[WhatsApp Webhook] Firma HMAC inválida — request rechazado",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // STRY-021 PERF-007: Log reducido — sin PII ni pretty-print
    console.log("[WhatsApp Webhook] Recibido", {
      object: body.object,
      entryCount: body.entry?.length ?? 0,
    });

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ success: true });
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value?.messages) continue;
        for (const message of value.messages) {
          await processIncomingMessage(message, value.metadata);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error procesando mensaje:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * Procesa un mensaje entrante de WhatsApp
 */
async function processIncomingMessage(
  message: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    button?: { payload: string; text: string };
    interactive?: {
      type: string;
      list_reply?: { id: string; title: string };
      button_reply?: { id: string; title: string };
    };
  },
  metadata: { display_phone_number: string; phone_number_id: string },
) {
  const numeroCliente = message.from;
  const mensajeId = message.id;
  const timestamp = message.timestamp;

  let contenido = "";
  let tipoInteraccion = "texto";

  switch (message.type) {
    case "text":
      contenido = message.text?.body || "";
      break;
    case "button":
      contenido = message.button?.text || "";
      tipoInteraccion = `button:${message.button?.payload}`;
      break;
    case "interactive":
      if (message.interactive?.type === "list_reply") {
        contenido = message.interactive.list_reply?.title || "";
        tipoInteraccion = `list:${message.interactive.list_reply?.id}`;
      } else if (message.interactive?.type === "button_reply") {
        contenido = message.interactive.button_reply?.title || "";
        tipoInteraccion = `button:${message.interactive.button_reply?.id}`;
      }
      break;
    default:
      // Tipo no manejado — ignorar silenciosamente
      break;
  }

  await guardarMensajeRecibido({
    numero: numeroCliente,
    mensajeId,
    contenido,
    tipo: message.type,
    tipoInteraccion,
    timestamp,
    phoneNumberId: metadata.phone_number_id,
  });
}

/**
 * Persiste un mensaje entrante en la tabla whatsapp_messages.
 */
async function guardarMensajeRecibido(data: {
  numero: string;
  mensajeId: string;
  contenido: string;
  tipo: string;
  tipoInteraccion: string;
  timestamp: string;
  phoneNumberId: string;
}) {
  try {
    await db
      .insert(whatsappMessages)
      .values({
        mensajeId: data.mensajeId,
        numero: data.numero,
        contenido: data.contenido,
        tipo: data.tipo,
        direccion: "inbound",
        estado: "received",
        tipoInteraccion: data.tipoInteraccion,
        metadata: { phoneNumberId: data.phoneNumberId },
      })
      .onConflictDoNothing();
  } catch (err) {
    // Log pero no lanzar — webhook siempre debe retornar 200 a Meta
    console.error("[WhatsApp DB] Error guardando mensaje:", err);
  }
}

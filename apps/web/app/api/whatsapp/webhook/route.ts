/**
 * WhatsApp Webhook Handler
 *
 * Maneja mensajes entrantes y verificación del webhook
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { whatsappMessages } from "@sass-store/database/schema";

// Token de verificación del webhook (debe coincidir con Meta Developer Dashboard)
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!;

/**
 * GET - Verificación del webhook
 *
 * Meta envía este request para verificar que el webhook estÃ¡ configurado correctamente.
 * Debes responder con el challenge que Meta envía.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // SECURITY: Redacted sensitive log;

  // Verificar que el modo sea "subscribe" y el token coincida
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.warn("[WhatsApp Webhook] Verificación exitosa");
    return new NextResponse(challenge, { status: 200 });
  }

  // SECURITY: Redacted sensitive log;

  return NextResponse.json(
    { error: "Forbidden - Invalid verify token" },
    { status: 403 },
  );
}

/**
 * POST - Recibe mensajes de WhatsApp
 *
 * Meta envía los mensajes entrantes a este endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.warn(
      "[WhatsApp Webhook] Mensaje recibido:",
      JSON.stringify(body, null, 2),
    );

    // Verificar que es un mensaje de WhatsApp Business Account
    if (body.object !== "whatsapp_business_account") {
      console.warn("[WhatsApp Webhook] Objeto no reconocido:", body.object);
      return NextResponse.json({ success: true });
    }

    // Procesar cada entry
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        if (!value?.messages) {
          continue;
        }

        // Procesar mensajes
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

  console.warn("[WhatsApp] Mensaje de:", numeroCliente, "Tipo:", message.type);

  // Determinar el contenido del mensaje
  let contenido = "";
  let tipoInteraccion = "texto";

  switch (message.type) {
    case "text":
      contenido = message.text?.body || "";
      console.warn(`[WhatsApp] Texto: ${contenido}`);
      break;

    case "button":
      contenido = message.button?.text || "";
      tipoInteraccion = `button:${message.button?.payload}`;
      console.warn(
        `[WhatsApp] BotÃ³n presionado: ${contenido} (payload: ${message.button?.payload})`,
      );
      break;

    case "interactive":
      if (message.interactive?.type === "list_reply") {
        contenido = message.interactive.list_reply?.title || "";
        tipoInteraccion = `list:${message.interactive.list_reply?.id}`;
        console.warn(
          `[WhatsApp] Respuesta de lista: ${contenido} (id: ${message.interactive.list_reply?.id})`,
        );
      } else if (message.interactive?.type === "button_reply") {
        contenido = message.interactive.button_reply?.title || "";
        tipoInteraccion = `button:${message.interactive.button_reply?.id}`;
        console.warn(
          `[WhatsApp] BotÃ³nå›žåº”: ${contenido} (id: ${message.interactive.button_reply?.id})`,
        );
      }
      break;

    default:
      console.warn(`[WhatsApp] Tipo de mensaje no manejado: ${message.type}`);
  }

  // AquÃ­ puedes:
  // 1. Guardar el mensaje en la base de datos
  // 2. Procesar comandos del usuario
  // 3. Responder automÃ¡ticamente

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
 * Persiste un mensaje entrante de WhatsApp en la tabla whatsapp_messages.
 * tenantId es nullable — se asocia al tenant en un paso posterior si es necesario.
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
    // Log but don't throw — webhook must always return 200 to Meta
    console.error("[WhatsApp DB] Error guardando mensaje:", err);
  }
}

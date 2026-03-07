/**
 * WhatsApp Webhook Handler
 *
 * Maneja mensajes entrantes y verificación del webhook
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */

import { NextRequest, NextResponse } from 'next/server';

// Token de verificación del webhook (debe coincidir con Meta Developer Dashboard)
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!;

/**
 * GET - Verificación del webhook
 *
 * Meta envía este request para verificar que el webhook está configurado correctamente.
 * Debes responder con el challenge que Meta envía.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[WhatsApp Webhook] Verificación recibida:', {
    mode,
    token: token ? 'presente' : 'ausente',
    challenge: challenge ? 'presente' : 'ausente',
  });

  // Verificar que el modo sea "subscribe" y el token coincida
  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verificación exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('[WhatsApp Webhook] Verificación fallida:', {
    expectedToken: WEBHOOK_VERIFY_TOKEN,
    receivedToken: token,
  });

  return NextResponse.json(
    { error: 'Forbidden - Invalid verify token' },
    { status: 403 }
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

    console.log('[WhatsApp Webhook] Mensaje recibido:', JSON.stringify(body, null, 2));

    // Verificar que es un mensaje de WhatsApp Business Account
    if (body.object !== 'whatsapp_business_account') {
      console.log('[WhatsApp Webhook] Objeto no reconocido:', body.object);
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
    console.error('[WhatsApp Webhook] Error procesando mensaje:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
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
  metadata: { display_phone_number: string; phone_number_id: string }
) {
  const numeroCliente = message.from;
  const mensajeId = message.id;
  const timestamp = message.timestamp;

  console.log('[WhatsApp] Mensaje de:', numeroCliente, 'Tipo:', message.type);

  // Determinar el contenido del mensaje
  let contenido = '';
  let tipoInteraccion = 'texto';

  switch (message.type) {
    case 'text':
      contenido = message.text?.body || '';
      console.log(`[WhatsApp] Texto: ${contenido}`);
      break;

    case 'button':
      contenido = message.button?.text || '';
      tipoInteraccion = `button:${message.button?.payload}`;
      console.log(`[WhatsApp] Botón presionado: ${contenido} (payload: ${message.button?.payload})`);
      break;

    case 'interactive':
      if (message.interactive?.type === 'list_reply') {
        contenido = message.interactive.list_reply?.title || '';
        tipoInteraccion = `list:${message.interactive.list_reply?.id}`;
        console.log(`[WhatsApp] Respuesta de lista: ${contenido} (id: ${message.interactive.list_reply?.id})`);
      } else if (message.interactive?.type === 'button_reply') {
        contenido = message.interactive.button_reply?.title || '';
        tipoInteraccion = `button:${message.interactive.button_reply?.id}`;
        console.log(`[WhatsApp] Botón回应: ${contenido} (id: ${message.interactive.button_reply?.id})`);
      }
      break;

    default:
      console.log(`[WhatsApp] Tipo de mensaje no manejado: ${message.type}`);
  }

  // Aquí puedes:
  // 1. Guardar el mensaje en la base de datos
  // 2. Procesar comandos del usuario
  // 3. Responder automáticamente

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
 * Guardar mensaje recibido en la base de datos
 * TODO: Implementar con Drizzle cuando se cree la tabla
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
  // Por ahora solo logging
  // TODO: Insertar en tabla whatsapp_messages
  console.log('[WhatsApp DB] Guardando mensaje:', {
    numero: data.numero,
    mensajeId: data.mensajeId,
    contenido: data.contenido.substring(0, 50),
    timestamp: data.timestamp,
  });

  // Implementación futura:
  // await db.insert(whatsappMessages).values({
  //   mensajeId: data.mensajeId,
  //   numero: data.numero,
  //   contenido: data.contenido,
  //   tipo: data.tipo,
  //   direccion: 'inbound',
  //   timestamp: new Date(parseInt(data.timestamp) * 1000),
  //   metadata: { phoneNumberId: data.phoneNumberId },
  // });
}

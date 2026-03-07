/**
 * WhatsApp Cloud API - Client Library
 *
 * Funciones para enviar mensajes via WhatsApp Cloud API
 * Docs: https://developers.facebook.com/docs/whatsapp
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

/**
 * Enviar mensaje de texto simple
 */
export async function enviarMensajeWhatsApp(
  numeroDestino: string,
  texto: string
): Promise<WhatsAppResponse> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numeroDestino.replace(/\D/g, ''),
        type: 'text',
        text: {
          body: texto,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Enviar plantilla de mensaje (cuando esté aprobada por Meta)
 * Docs: https://developers.facebook.com/docs/whatsapp/message-templates
 */
export async function enviarPlantillaWhatsApp(
  numeroDestino: string,
  nombrePlantilla: string,
  parametros: string[] = []
): Promise<WhatsAppResponse> {
  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: numeroDestino.replace(/\D/g, ''),
    type: 'template',
    template: {
      name: nombrePlantilla,
      language: {
        code: 'es_MX', // Español México
      },
    },
  };

  // Agregar parámetros si existen
  if (parametros.length > 0) {
    body.template = {
      ...body.template,
      components: [
        {
          type: 'body',
          parameters: parametros.map((param) => ({
            type: 'text',
            text: param,
          })),
        },
      ],
    };
  }

  const response = await fetch(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Enviar mensaje interactivo con botones
 */
export async function enviarMensajeConBotones(
  numeroDestino: string,
  texto: string,
  botones: Array<{ id: string; titulo: string }>
): Promise<WhatsAppResponse> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numeroDestino.replace(/\D/g, ''),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: texto,
          },
          action: {
            buttons: botones.map((btn) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.titulo.substring(0, 20), // Max 20 caracteres
              },
            })),
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Enviar mensaje con lista de opciones
 */
export async function enviarMensajeConLista(
  numeroDestino: string,
  texto: string,
  tituloSeccion: string,
  opciones: Array<{ id: string; titulo: string; descripcion?: string }>
): Promise<WhatsAppResponse> {
  const response = await fetch(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numeroDestino.replace(/\D/g, ''),
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: texto,
          },
          action: {
            button: 'Ver opciones',
            sections: [
              {
                title: tituloSeccion,
                rows: opciones.map((opcion) => ({
                  id: opcion.id,
                  title: opcion.titulo.substring(0, 24),
                  description: opcion.descripcion?.substring(0, 72),
                })),
              },
            ],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

/**
 * Tipos de respuesta de la API
 */
export interface WhatsAppResponse {
  messaging_product: string;
  to: string;
  type: string;
  message_id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

/**
 * Tipos de mensaje entrante del webhook
 */
export interface WhatsAppIncomingMessage {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          button?: {
            payload: string;
            text: string;
          };
          interactive?: {
            type: string;
            list_reply?: {
              id: string;
              title: string;
            };
            button_reply?: {
              id: string;
              title: string;
            };
          };
        }>;
      };
    }>;
  }>;
}

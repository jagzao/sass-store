/**
 * STRY-021 SC-18 — PII redaction helpers for WhatsApp webhook logging.
 *
 * Every `console.*` that touches the inbound Meta payload must pass through
 * `redactPII()` so that customer phone numbers, message bodies, button
 * payloads and contact Wa IDs never land in operator logs.
 *
 * The redacted shape keeps only operational metadata: object type, message
 * id, timestamp, phone_number_id, display phone number and messaging_product.
 * Anything that could identify or quote the customer is dropped.
 */

export interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
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
          text?: { body: string };
          button?: { payload: string; text: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }>;
        contacts?: Array<{ wa_id: string; profile?: { name: string } }>;
      };
    }>;
  }>;
}

/**
 * Shape of a payload AFTER PII has been stripped. This is what every
 * console.* call should receive. Anything not present here is, by definition,
 * PII and must not be logged.
 */
export type RedactedPayload = {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          id: string;
          timestamp: string;
          type: string;
        }>;
      };
    }>;
  }>;
};

/**
 * Strip every PII-bearing field from a Meta webhook payload.
 * Keeps only: object, entry ids, messaging_product, metadata (display_phone
 * and phone_number_id), message ids/timestamp/type.
 */
export function redactPII(payload: MetaWebhookPayload): RedactedPayload {
  return {
    object: payload.object,
    entry: payload.entry?.map((e) => ({
      id: e.id,
      changes: e.changes?.map((c) => ({
        value: {
          messaging_product: c.value?.messaging_product,
          metadata: {
            display_phone_number: c.value?.metadata?.display_phone_number,
            phone_number_id: c.value?.metadata?.phone_number_id,
          },
          messages: c.value?.messages?.map((m) => ({
            id: m.id,
            timestamp: m.timestamp,
            type: m.type,
          })),
        },
      })),
    })),
  };
}

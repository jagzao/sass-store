/**
 * E2E: Flujo completo de booking por WhatsApp
 *
 * Simula mensajes entrantes al webhook y verifica que el booking
 * se crea en la DB y se envía la confirmación por WA.
 *
 * Requiere: dev server + n8n + Redis corriendo
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001";
const TENANT = "wondernails";

test.describe("WA Booking — flujo completo", () => {
  test.skip(
    !process.env.WA_E2E_ENABLED,
    "Requiere WA_E2E_ENABLED=1 y n8n corriendo",
  );

  test("detecta booking intent y crea conversación en awaiting_confirm", async ({
    request,
  }) => {
    const payload = buildWebhookPayload({
      phoneNumberId: process.env.TEST_PHONE_NUMBER_ID ?? "214863935038316",
      phone: "5215500000001",
      message: "haz cita de manicure mañana a las 3pm",
    });

    const res = await request.post(`${BASE_URL}/api/whatsapp/webhook`, {
      data: payload,
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status()).toBe(200);

    // Esperar a que n8n procese (máx 5 segundos con webhook trigger)
    await new Promise((r) => setTimeout(r, 5000));

    // Verificar que se creó la conversación en wa_booking_conversations
    const convo = await request.get(
      `${BASE_URL}/api/internal/wa-conversations?phone=5215500000001&tenant=${TENANT}`,
    );
    const data = await convo.json();
    expect(data.state).toBe("awaiting_confirm");
  });
});

// Helper para construir payload de webhook de Meta
function buildWebhookPayload(opts: {
  phoneNumberId: string;
  phone: string;
  message: string;
}) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "test-entry",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "5215500000000",
                phone_number_id: opts.phoneNumberId,
              },
              messages: [
                {
                  from: opts.phone,
                  id: `wamid.test.${Date.now()}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: opts.message },
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };
}

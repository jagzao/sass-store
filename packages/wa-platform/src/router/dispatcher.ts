import type {
  ClassifiedIntent,
  WAInboundMessage,
  ConversationSession,
} from "../types";

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://127.0.0.1:5678";
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? "";

/** Mapeo intent → webhook path de n8n */
const INTENT_TO_WEBHOOK: Partial<Record<string, string>> = {
  booking_start: "/webhook/wa-booking-detect",
  confirm_yes: "/webhook/wa-booking-confirm",
  confirm_no: "/webhook/wa-booking-confirm",
  availability_query: "/webhook/wa-availability",
  support_query: "/webhook/wa-support",
  unknown: "/webhook/wa-support",
  pricing_query: "/webhook/wa-support",
  hours_query: "/webhook/wa-support",
  location_query: "/webhook/wa-support",
};

export class N8nDispatcher {
  async dispatch(
    message: WAInboundMessage,
    intent: ClassifiedIntent,
    session: ConversationSession | null,
    tenantSlug: string,
  ): Promise<void> {
    const webhookPath = INTENT_TO_WEBHOOK[intent.type] ?? "/webhook/wa-support";

    const payload = {
      message,
      intent,
      session,
      tenantSlug,
    };

    // Fire-and-forget: el webhook de Meta no debe esperar la respuesta de n8n
    fetch(`${N8N_BASE_URL}${webhookPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WA-Platform-Secret": N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error("[N8nDispatcher] Error dispatching to n8n:", err);
    });
  }
}

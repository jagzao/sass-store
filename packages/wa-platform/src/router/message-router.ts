import type { WAInboundMessage } from "../types";
import { IntentClassifier } from "./classifier";
import { TenantResolver } from "./tenant-resolver";
import { N8nDispatcher } from "./dispatcher";

/**
 * MessageRouter — orquestador principal del webhook
 *
 * Recibe un WAInboundMessage ya validado (firma HMAC verificada),
 * resuelve el tenant, clasifica el intent y despacha a n8n.
 */
export class MessageRouter {
  private classifier = new IntentClassifier();
  private tenantResolver = new TenantResolver();
  private dispatcher = new N8nDispatcher();

  async route(message: WAInboundMessage): Promise<void> {
    // 1. Resolver tenant por phone_number_id
    const tenantSlug = await this.tenantResolver.resolve(message.phoneNumberId);
    if (!tenantSlug) {
      console.warn(
        "[MessageRouter] Tenant no encontrado para phone_number_id:",
        message.phoneNumberId,
      );
      return;
    }

    // 2. Clasificar intent
    const intent = this.classifier.classify(
      message.content,
      message.buttonPayload,
    );

    console.warn("[MessageRouter] Dispatching", {
      tenant: tenantSlug,
      intent: intent.type,
      confidence: intent.confidence,
    });

    // 3. Despachar a n8n (fire-and-forget — no bloquea el 200 a Meta)
    await this.dispatcher.dispatch(message, intent, null, tenantSlug);
  }
}

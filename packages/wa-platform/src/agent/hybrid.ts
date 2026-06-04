/**
 * HybridResponseEngine
 *
 * Score > 0.85   → respuesta de regla (determinista, < 5ms, gratis)
 * Score 0.5–0.85 → estructura de regla + Kimi K2.5 personaliza el tono
 * Score < 0.5    → Kimi K2.5 full con contexto completo del tenant
 *
 * AI: Ollama Cloud API (OpenAI-compatible) con modelo kimi-k2.5
 */
import type {
  ClassifiedIntent,
  ConversationSession,
  TenantKnowledgeBase,
  TenantWAConfig,
} from "../types";

export type ResponseSource = "rules" | "hybrid" | "ai";

export interface HybridDecision {
  source: ResponseSource;
  response?: string;
}

const OLLAMA_CLOUD_URL =
  process.env.OLLAMA_CLOUD_BASE_URL ?? "https://ollama.com/v1";
const OLLAMA_CLOUD_KEY = process.env.OLLAMA_CLOUD_API_KEY ?? "";
const OLLAMA_CLOUD_MODEL = process.env.OLLAMA_CLOUD_MODEL ?? "kimi-k2.5";

export class HybridResponseEngine {
  async respond(
    intent: ClassifiedIntent,
    session: ConversationSession,
    kb: TenantKnowledgeBase,
    config: TenantWAConfig,
  ): Promise<HybridDecision> {
    if (intent.confidence > 0.85) {
      const ruleResponse = buildRuleResponse(intent, kb, config);
      if (ruleResponse) return { source: "rules", response: ruleResponse };
    }

    if (!config.aiEnabled) {
      return {
        source: "rules",
        response: buildRuleResponse(intent, kb, config) ?? config.fallbackMsg,
      };
    }

    const ruleHint =
      intent.confidence >= 0.5 ? buildRuleResponse(intent, kb, config) : null;
    const source: ResponseSource = ruleHint ? "hybrid" : "ai";
    const response = await callKimi(intent, session, kb, config, ruleHint);
    return { source, response };
  }
}

// ─── Respuestas deterministas ─────────────────────────────────────────────────

function buildRuleResponse(
  intent: ClassifiedIntent,
  kb: TenantKnowledgeBase,
  config: TenantWAConfig,
): string | null {
  switch (intent.type) {
    case "hours_query": {
      const lines = Object.entries(kb.hours)
        .map(([day, h]) =>
          h ? `${day}: ${h.open}–${h.close}` : `${day}: cerrado`,
        )
        .join("\n");
      return `Nuestro horario:\n${lines}`;
    }
    case "pricing_query": {
      if (!kb.services.length) return null;
      const lines = kb.services
        .slice(0, 8)
        .map((s) => `• ${s.name}: $${s.price} MXN`)
        .join("\n");
      return `Servicios de ${config.displayName}:\n${lines}`;
    }
    case "confirm_no":
      return "Entendido, cancelé la cita. ¿Hay algo más en lo que te pueda ayudar?";
    case "human_request":
      return config.escalationMsg;
    default:
      return null;
  }
}

// ─── Llamada a Ollama Cloud / Kimi K2.5 ──────────────────────────────────────

async function callKimi(
  intent: ClassifiedIntent,
  session: ConversationSession,
  kb: TenantKnowledgeBase,
  config: TenantWAConfig,
  ruleHint: string | null,
): Promise<string> {
  const history = session.messages.slice(-6).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const res = await fetch(`${OLLAMA_CLOUD_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OLLAMA_CLOUD_KEY}`,
      },
      body: JSON.stringify({
        model: OLLAMA_CLOUD_MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt(kb, config, ruleHint) },
          ...history,
          { role: "user", content: intent.rawText },
        ],
        max_tokens: config.maxAiTokens,
        temperature: 0.7,
        stream: false,
      }),
      // 8s máx — webhook Meta timeout es 20s y el dispatch es fire-and-forget
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn("[HybridAI] Kimi error", res.status);
      return config.fallbackMsg;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? config.fallbackMsg;
  } catch (err) {
    console.error("[HybridAI] Kimi timeout/error:", err);
    return config.fallbackMsg;
  }
}

function buildSystemPrompt(
  kb: TenantKnowledgeBase,
  config: TenantWAConfig,
  ruleHint: string | null,
): string {
  const services = kb.services
    .slice(0, 10)
    .map((s) => `- ${s.name}: $${s.price} MXN (${s.durationMinutes}min)`)
    .join("\n");

  const faqs = kb.faqs
    .slice(0, 5)
    .map((f) => `P: ${f.question}\nR: ${f.answer}`)
    .join("\n");

  const hintSection = ruleHint
    ? `\nRESPUESTA SUGERIDA (ajusta el tono solamente):\n${ruleHint}`
    : "";

  return `Eres ${config.botName}, asistente de ${config.displayName} vía WhatsApp.
Tono: ${config.tone}. Idioma: español mexicano natural y cercano.
Responde en máximo ${config.maxAiTokens} tokens. Sin markdown. Sin bullets innecesarios.

SERVICIOS:
${services || "Sin servicios configurados."}

PREGUNTAS FRECUENTES:
${faqs || "Sin FAQs configuradas."}

REGLAS:
- Solo menciona servicios y precios de la lista de arriba
- Si no sabes algo, di "déjame verificarlo con el equipo"
- Para agendar cita: dile que escriba "haz cita" con servicio, fecha y hora
- Si el cliente está molesto o pide hablar con alguien: ${config.escalationMsg}
${hintSection}`;
}

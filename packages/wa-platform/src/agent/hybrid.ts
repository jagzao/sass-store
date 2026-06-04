/**
 * HybridResponseEngine
 *
 * Decide si la respuesta viene de reglas (determinista, gratis, < 5ms)
 * o de Claude (flexible, costo, ~1.5s).
 *
 * Score > 0.85   → respuesta de regla
 * Score 0.5–0.85 → estructura de regla + Claude personaliza el tono
 * Score < 0.5    → Claude con contexto completo del tenant
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
  ruleResponse?: string; // respuesta determinista si aplica
  aiPrompt?: string; // prompt para Claude si aplica
  requiresAI: boolean;
}

export class HybridResponseEngine {
  decide(
    intent: ClassifiedIntent,
    session: ConversationSession,
    kb: TenantKnowledgeBase,
    config: TenantWAConfig,
  ): HybridDecision {
    if (!config.aiEnabled || intent.confidence > 0.85) {
      // Respuesta determinista
      const ruleResponse = this.buildRuleResponse(intent, kb, config);
      if (ruleResponse) {
        return { source: "rules", ruleResponse, requiresAI: false };
      }
    }

    if (intent.confidence >= 0.5) {
      // Hybrid: regla da estructura, Claude personaliza
      return {
        source: "hybrid",
        ruleResponse: this.buildRuleResponse(intent, kb, config) ?? undefined,
        aiPrompt: this.buildAIPrompt(
          intent,
          session,
          kb,
          config,
          "personalize",
        ),
        requiresAI: true,
      };
    }

    // Conversación libre — AI full
    return {
      source: "ai",
      aiPrompt: this.buildAIPrompt(intent, session, kb, config, "full"),
      requiresAI: true,
    };
  }

  private buildRuleResponse(
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
        return `Nuestro horario es:\n${lines}`;
      }
      case "pricing_query": {
        const lines = kb.services
          .slice(0, 8)
          .map((s) => `• ${s.name}: $${s.price} MXN`)
          .join("\n");
        return `Nuestros servicios:\n${lines}`;
      }
      default:
        return null;
    }
  }

  private buildAIPrompt(
    intent: ClassifiedIntent,
    session: ConversationSession,
    kb: TenantKnowledgeBase,
    config: TenantWAConfig,
    mode: "personalize" | "full",
  ): string {
    const history = session.messages
      .slice(-6)
      .map(
        (m) =>
          `${m.role === "user" ? "Cliente" : config.botName}: ${m.content}`,
      )
      .join("\n");

    const services = kb.services
      .map((s) => `- ${s.name}: $${s.price} MXN (${s.durationMinutes}min)`)
      .join("\n");

    return `Eres ${config.botName}, asistente de ${config.displayName}. Tono: ${config.tone}. Español mexicano natural.

SERVICIOS:
${services}

CONTEXTO: ${mode === "personalize" ? "El usuario preguntó algo que ya tenemos respuesta, pero personaliza el tono." : "Responde libremente basándote en el contexto."}

HISTORIAL:
${history}

MENSAJE ACTUAL: ${intent.rawText}

Responde en máximo ${config.maxAiTokens} tokens. Sin markdown, sin emojis excesivos.`;
  }
}

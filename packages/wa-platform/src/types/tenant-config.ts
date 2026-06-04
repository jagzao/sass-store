/** Configuración WA de un tenant (viene de wa_tenant_config en DB) */
export interface TenantWAConfig {
  tenantSlug: string;
  phoneNumberId: string;
  displayName: string;
  botName: string;
  tone: "formal" | "amigable" | "juvenil";
  greetingMsg: string;
  fallbackMsg: string;
  escalationMsg: string;
  escalationPhone?: string;
  aiEnabled: boolean;
  maxAiTokens: number;
  features: TenantWAFeatures;
}

export interface TenantWAFeatures {
  booking_enabled: boolean;
  availability_queries: boolean;
  ai_support: boolean;
  campaigns_enabled: boolean;
  human_handoff: boolean;
  max_concurrent_sessions: number;
}

/** Knowledge base del tenant (cacheada en Redis desde Supabase) */
export interface TenantKnowledgeBase {
  tenantSlug: string;
  services: KBService[];
  hours: KBHours;
  faqs: KBFAQ[];
  staff: string[];
  cachedAt: string;
}

export interface KBService {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
}

export interface KBHours {
  [day: string]: { open: string; close: string } | null; // null = cerrado
}

export interface KBFAQ {
  question: string;
  answer: string;
}

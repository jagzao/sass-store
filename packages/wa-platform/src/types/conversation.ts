/** Estados posibles de una conversación */
export type ConversationState =
  | "idle"
  | "greeted"
  | "browsing"
  | "collecting_booking" // recopilando servicio/fecha/hora
  | "awaiting_confirm" // esperando ✅/❌
  | "confirmed" // booking creado
  | "cancelled"
  | "support_active" // en conversación de soporte
  | "escalated"; // pasado a humano

/** Sesión activa guardada en Redis */
export interface ConversationSession {
  state: ConversationState;
  tenantSlug: string;
  phone: string;
  customerId?: string;
  messages: SessionMessage[]; // últimos 10 mensajes para contexto AI
  pendingBooking?: PendingBooking;
  lastIntent?: string;
  turnCount: number;
  startedAt: string;
  updatedAt: string;
}

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface PendingBooking {
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
  dateIso?: string;
  timeStr?: string;
  confirmMsgId?: string;
}

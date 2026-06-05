/**
 * WA Session Store — B4 Working Memory
 *
 * Persiste el estado de conversación de cada cliente por tenant.
 * Key: wa:session:{tenantSlug}:{phone}   TTL: 30 minutos
 *
 * El estado se renueva en cada mensaje recibido.
 * Al expirar → la próxima conversación comienza desde IDLE.
 */

import { getCached, setCache, deleteCache } from "@/lib/cache/redis";

const SESSION_TTL = 30 * 60; // 30 minutos
const KEY = (tenantSlug: string, phone: string) =>
  `wa:session:${tenantSlug}:${phone}`;

export type ConversationState =
  | "idle"
  | "greeted"
  | "browsing"
  | "collecting_booking"
  | "awaiting_confirm"
  | "confirmed"
  | "cancelled"
  | "support_active"
  | "escalated";

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

export interface ConversationSession {
  state: ConversationState;
  tenantSlug: string;
  phone: string;
  customerId?: string;
  /** Últimos 10 mensajes — contexto para Kimi K2.5 */
  messages: SessionMessage[];
  pendingBooking?: {
    serviceId?: string;
    serviceName?: string;
    servicePrice?: number;
    dateIso?: string;
    timeStr?: string;
  };
  lastIntent?: string;
  turnCount: number;
  startedAt: string;
  updatedAt: string;
}

export async function getSession(
  tenantSlug: string,
  phone: string,
): Promise<ConversationSession | null> {
  return getCached<ConversationSession>(KEY(tenantSlug, phone));
}

export async function saveSession(session: ConversationSession): Promise<void> {
  session.updatedAt = new Date().toISOString();
  await setCache(KEY(session.tenantSlug, session.phone), session, SESSION_TTL);
}

export async function deleteSession(
  tenantSlug: string,
  phone: string,
): Promise<void> {
  await deleteCache(KEY(tenantSlug, phone));
}

/** Crea una sesión nueva en estado IDLE */
export function newSession(
  tenantSlug: string,
  phone: string,
): ConversationSession {
  const now = new Date().toISOString();
  return {
    state: "idle",
    tenantSlug,
    phone,
    messages: [],
    turnCount: 0,
    startedAt: now,
    updatedAt: now,
  };
}

/** Agrega un mensaje al historial y rota para mantener solo los últimos 10 */
export function appendMessage(
  session: ConversationSession,
  role: "user" | "assistant",
  content: string,
): ConversationSession {
  session.messages.push({ role, content, ts: new Date().toISOString() });
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }
  session.turnCount += role === "user" ? 1 : 0;
  return session;
}

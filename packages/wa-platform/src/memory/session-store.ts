/**
 * SessionStore — L1 Working Memory en Redis
 *
 * Key: wa:session:{tenantSlug}:{phone}
 * TTL: 30 minutos (se renueva en cada mensaje)
 */
import type { ConversationSession } from "../types";

const SESSION_TTL_SECONDS = 30 * 60;
const KEY_PREFIX = "wa:session";

export class SessionStore {
  // TODO(B4): inyectar Redis client (Upstash)
  private redis: any = null;

  private key(tenantSlug: string, phone: string): string {
    return `${KEY_PREFIX}:${tenantSlug}:${phone}`;
  }

  async get(
    tenantSlug: string,
    phone: string,
  ): Promise<ConversationSession | null> {
    if (!this.redis) return null; // stub hasta B4
    const raw = await this.redis.get(this.key(tenantSlug, phone));
    return raw ? JSON.parse(raw) : null;
  }

  async set(session: ConversationSession): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(
      this.key(session.tenantSlug, session.phone),
      JSON.stringify(session),
      { ex: SESSION_TTL_SECONDS },
    );
  }

  async delete(tenantSlug: string, phone: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(this.key(tenantSlug, phone));
  }

  createNew(tenantSlug: string, phone: string): ConversationSession {
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
}

/**
 * TenantContext — L3 Semantic Memory
 *
 * Carga y cachea el knowledge base del tenant desde Supabase.
 * Key: wa:kb:{tenantSlug}
 * TTL: 1 hora — invalidar manualmente cuando admin modifica servicios/horarios
 */
import type { TenantKnowledgeBase, TenantWAConfig } from "../types";

const KB_TTL_SECONDS = 60 * 60;
const KB_PREFIX = "wa:kb";
const CONFIG_PREFIX = "wa:tenant";

export class TenantContextStore {
  private redis: any = null;

  async getKnowledgeBase(
    tenantSlug: string,
  ): Promise<TenantKnowledgeBase | null> {
    // TODO(B4): implementar con Redis + Supabase fallback
    return null;
  }

  async getConfig(phoneNumberId: string): Promise<TenantWAConfig | null> {
    // TODO(B2): implementar lookup por phone_number_id
    return null;
  }

  /**
   * Invalida el cache del KB de un tenant.
   * Llamar desde el admin cuando modifica servicios u horarios.
   */
  async invalidate(tenantSlug: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(`${KB_PREFIX}:${tenantSlug}`);
  }
}

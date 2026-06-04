/**
 * TenantResolver
 *
 * Mapea phone_number_id (de Meta) → tenant_slug.
 * Usa Redis como cache L1 con TTL de 1 hora.
 * Si no está en cache, consulta Supabase y cachea.
 */
export class TenantResolver {
  // TODO(B2): implementar con Redis + Supabase query a wa_tenant_config
  async resolve(phoneNumberId: string): Promise<string | null> {
    // Stub — reemplazar con implementación real en B2
    return null;
  }
}

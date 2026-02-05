"use client";

import { useTenant } from "@/hooks/useTenant";
import { useTenantSlug } from "@/lib/tenant/client-resolver";
import SocialMediaManager from "@/components/social/SocialMediaManager";

export default function SocialPage() {
  const { tenant } = useTenant();
  const tenantSlug = useTenantSlug();
  const resolvedSlug = tenant?.slug ?? tenantSlug;

  if (!resolvedSlug) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontró el tenant
          </h3>
          <p className="text-gray-600">
            Por favor, verifica la URL o inicia sesión nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SocialMediaManager
        tenant={resolvedSlug}
        variant={resolvedSlug === "zo-system" ? "tech" : "default"}
      />
    </div>
  );
}

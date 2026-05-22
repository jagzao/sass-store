"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayoutWrapper from "./DashboardLayoutWrapper";
import { fetchTenantBySlug } from "@/lib/api/financial-matrix";
import { isFailure } from "@sass-store/core/src/result";
import type { TenantBranding } from "@/types/tenant";
import { AdminThemeScope } from "@/components/admin/AdminThemeScope";
import { resolveAdminTheme } from "@/lib/tenant/admin-theme";

export function AdminLayoutProvider({
  tenantSlug,
  branding: brandingProp,
  children,
}: {
  tenantSlug: string;
  branding?: Partial<TenantBranding> | null;
  children: React.ReactNode;
}) {
  const [tenantName, setTenantName] = useState("Cargando...");
  const [branding, setBranding] = useState<Partial<TenantBranding> | null>(
    brandingProp ?? null,
  );

  useEffect(() => {
    async function load() {
      const res = await fetchTenantBySlug(tenantSlug);
      if (!isFailure(res)) {
        setTenantName(res.data.name);
      } else {
        setTenantName(tenantSlug);
      }
    }
    load();
  }, [tenantSlug, brandingProp]);

  const theme = useMemo(
    () => resolveAdminTheme(branding ?? brandingProp, tenantSlug),
    [branding, brandingProp, tenantSlug],
  );

  return (
    <DashboardLayoutWrapper tenantSlug={tenantSlug} tenantName={tenantName}>
      <AdminThemeScope theme={theme}>{children}</AdminThemeScope>
    </DashboardLayoutWrapper>
  );
}

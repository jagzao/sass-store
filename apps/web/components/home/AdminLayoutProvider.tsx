"use client";

import { useEffect, useState } from "react";
import DashboardLayoutWrapper from "./DashboardLayoutWrapper";
import { fetchTenantBySlug } from "@/lib/api/financial-matrix"; // Re-using this fast client fetcher
import { isFailure } from "@sass-store/core/src/result";

export function AdminLayoutProvider({
  tenantSlug,
  children,
}: {
  tenantSlug: string;
  children: React.ReactNode;
}) {
  const [tenantName, setTenantName] = useState("Cargando...");

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
  }, [tenantSlug]);

  return (
    <DashboardLayoutWrapper tenantSlug={tenantSlug} tenantName={tenantName}>
      {children}
    </DashboardLayoutWrapper>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isFailure } from "@sass-store/core/src/result";
import { fetchTenantBySlug } from "@/lib/api/financial-matrix";
import { FinancialMatrixBoard } from "@/components/finance/FinancialMatrixBoard";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";

type TenantState = {
  id: string;
  name: string;
};

export default function TenantFinancePage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const { data: session, status } = useSession();

  const [tenant, setTenant] = useState<TenantState | null>(null);
  const [tenantError, setTenantError] = useState<string>("");
  const [loadingTenant, setLoadingTenant] = useState<boolean>(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
    }
  }, [router, status, tenantSlug]);

  useEffect(() => {
    const loadTenant = async () => {
      setLoadingTenant(true);

      const result = await fetchTenantBySlug(tenantSlug);
      if (isFailure(result)) {
        setTenantError(result.error.message);
        setLoadingTenant(false);
        return;
      }

      setTenant({ id: result.data.id, name: result.data.name });
      setTenantError("");
      setLoadingTenant(false);
    };

    void loadTenant();
  }, [tenantSlug]);

  if (status === "loading" || loadingTenant) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Cargando módulo financiero...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <AdminLayoutProvider tenantSlug={tenantSlug}>
      <main className="min-h-screen bg-transparent p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <h1 className="text-2xl font-bold text-gray-900">Matriz de Planeación Financiera</h1>
            <p className="mt-1 text-sm text-gray-600">Tenant: {tenant?.name || tenantSlug}</p>
          </header>

          {tenantError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {tenantError}
            </div>
          ) : null}

          {tenant?.id ? <FinancialMatrixBoard tenantId={tenant.id} /> : null}
        </div>
      </main>
    </AdminLayoutProvider>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";

import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import CustomersList from "@/components/customers/CustomersList";
import CustomersFilters from "@/components/customers/CustomersFilters";
import ClientesPageWrapper from "./ClientesPageWrapper";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";
import { getClientTerms } from "@/lib/tenant/client-terminology";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function CustomersPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const { tenant: tenantSlug } = resolvedParams;
  const resolvedSearchParams = await searchParams;

  const tenantData = await getTenantBySlug(tenantSlug);
  if (!tenantData) notFound();

  const terms = getClientTerms(tenantSlug);

  return (
    <AdminLayoutProvider tenantSlug={tenantSlug}>
      <ClientesPageWrapper tenantSlug={tenantSlug}>
        <LiveRegionProvider>
          <div className="min-h-screen">
            <main className="container mx-auto px-4 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {terms.managementTitle}
                </h1>
                <p className="text-gray-600">
                  Administra expedientes, historial de visitas y próximas citas
                </p>
              </div>

              <Suspense
                fallback={
                  <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                }
              >
                <CustomersFilters
                  tenantSlug={tenantSlug}
                  searchParams={resolvedSearchParams}
                />
              </Suspense>

              <Suspense fallback={<CustomersListSkeleton />}>
                <CustomersList
                  tenantSlug={tenantSlug}
                  searchParams={resolvedSearchParams}
                  clientTerms={terms}
                />
              </Suspense>
            </main>
          </div>
        </LiveRegionProvider>
      </ClientesPageWrapper>
    </AdminLayoutProvider>
  );
}

function CustomersListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  const terms = getClientTerms(tenantSlug);

  if (!tenant) return { title: terms.plural };

  return {
    title: `${terms.plural} - ${tenant.name}`,
    description: `${terms.managementTitle} y expedientes para ${tenant.name}`,
  };
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import CustomersList from "@/components/customers/CustomersList";
import CustomersFilters from "@/components/customers/CustomersFilters";

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
  console.log("[CustomersPage] Received params:", params);
  const resolvedParams = await params;
  console.log("[CustomersPage] Resolved params:", resolvedParams);
  const { tenant: tenantSlug } = resolvedParams;
  console.log("[CustomersPage] Extracted tenantSlug:", tenantSlug);

  const resolvedSearchParams = await searchParams;
  console.log("[CustomersPage] Resolved searchParams:", resolvedSearchParams);

  // Get tenant data directly from database (server-side only, no HTTP calls)
  const tenantData = await getTenantBySlug(tenantSlug);

  if (!tenantData) {
    console.error(`[CustomersPage] Tenant not found: ${tenantSlug}`);
    notFound();
  }

  console.log(`[CustomersPage] Successfully loaded tenant: ${tenantData.name}`);

  return (
    <LiveRegionProvider>
      <div className="min-h-screen">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Clientas
            </h1>
            <p className="text-gray-600">
              Administra expedientes, historial de visitas y próximas citas
            </p>
          </div>

          {/* Filters */}
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

          {/* Customers List */}
          <Suspense fallback={<CustomersListSkeleton />}>
            <CustomersList
              tenantSlug={tenantSlug}
              searchParams={resolvedSearchParams}
            />
          </Suspense>
        </main>
      </div>
    </LiveRegionProvider>
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

  if (!tenant) {
    return {
      title: "Clientas",
    };
  }

  return {
    title: `Clientas - ${tenant.name}`,
    description: `Gestión de clientas y expedientes para ${tenant.name}`,
  };
}

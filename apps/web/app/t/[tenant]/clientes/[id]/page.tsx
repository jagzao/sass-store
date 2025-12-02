import { Suspense } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";
import CustomerFileHeader from "@/components/customers/CustomerFileHeader";
import CustomerFileSummary from "@/components/customers/CustomerFileSummary";
import CustomerVisitsHistory from "@/components/customers/CustomerVisitsHistory";

interface PageProps {
  params: {
    tenant: string;
    id: string;
  };
}

export default async function CustomerFilePage({ params }: PageProps) {
  const tenantSlug = params.tenant;
  const customerId = params.id;

  // Fetch tenant data
  let tenantData: TenantData | null = null;

  try {
    tenantData = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);
  } catch (error) {
    console.error(
      `[CustomerFilePage] Failed to fetch tenant ${tenantSlug}:`,
      error,
    );
    notFound();
  }

  const isLuxury = tenantSlug === "wondernails";

  return (
    <LiveRegionProvider>
      <div
        className={`min-h-screen ${isLuxury ? "bg-[#121212]" : "bg-gradient-to-b from-white to-gray-50"}`}
      >
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a
                  href={`/t/${tenantSlug}`}
                  className={`${isLuxury ? "text-gray-400 hover:text-[#D4AF37]" : "text-gray-700 hover:text-blue-600"} inline-flex items-center`}
                >
                  Inicio
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <span
                    className={`mx-2 ${isLuxury ? "text-gray-600" : "text-gray-400"}`}
                  >
                    /
                  </span>
                  <a
                    href={`/t/${tenantSlug}/clientes`}
                    className={`${isLuxury ? "text-gray-400 hover:text-[#D4AF37]" : "text-gray-700 hover:text-blue-600"}`}
                  >
                    Clientas
                  </a>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span
                    className={`mx-2 ${isLuxury ? "text-gray-600" : "text-gray-400"}`}
                  >
                    /
                  </span>
                  <span
                    className={`${isLuxury ? "text-[#D4AF37]" : "text-gray-500"}`}
                  >
                    Expediente
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Customer Header */}
          <Suspense fallback={<CustomerHeaderSkeleton />}>
            <CustomerFileHeader
              tenantSlug={tenantSlug}
              customerId={customerId}
            />
          </Suspense>

          {/* Summary Cards */}
          <Suspense fallback={<SummarySkeleton />}>
            <CustomerFileSummary
              tenantSlug={tenantSlug}
              customerId={customerId}
            />
          </Suspense>

          {/* Visit History */}
          <div className="mt-8">
            <Suspense fallback={<VisitsHistorySkeleton />}>
              <CustomerVisitsHistory
                tenantSlug={tenantSlug}
                customerId={customerId}
              />
            </Suspense>
          </div>
        </main>
      </div>
    </LiveRegionProvider>
  );
}

function CustomerHeaderSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function VisitsHistorySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-4 border-b border-gray-200 last:border-0">
            <div className="h-5 w-full bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const tenantSlug = params.tenant;

  try {
    const tenant = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);

    return {
      title: `Expediente de Clienta - ${tenant.name}`,
      description: `Historial completo de visitas y servicios`,
    };
  } catch (error) {
    return {
      title: "Expediente de Clienta",
    };
  }
}

// Generate static params for Cloudflare Pages export
export async function generateStaticParams() {
  // Return empty array - pages will be generated on-demand
  return [];
}

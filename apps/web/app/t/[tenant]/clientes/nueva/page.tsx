import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";
import CustomerForm from "@/components/customers/CustomerForm";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function NewCustomerPage({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;

  // Fetch tenant data
  let tenantData: TenantData | null = null;

  try {
    tenantData = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);
  } catch (error) {
    console.error(
      `[NewCustomerPage] Failed to fetch tenant ${tenantSlug}:`,
      error,
    );
    notFound();
  }

  return (
    <LiveRegionProvider>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <TenantHeader tenantData={tenantData} />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a
                  href={`/t/${tenantSlug}`}
                  className="text-gray-700 hover:text-blue-600 inline-flex items-center"
                >
                  Inicio
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <a
                    href={`/t/${tenantSlug}/clientes`}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Clientas
                  </a>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-500">Nueva Clienta</span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Agregar Nueva Clienta
            </h1>
            <p className="text-gray-600">
              Complete la información básica de la clienta
            </p>
          </div>

          {/* Customer Form */}
          <div className="max-w-3xl">
            <CustomerForm tenantSlug={tenantSlug} />
          </div>
        </main>
      </div>
    </LiveRegionProvider>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;

  try {
    const tenant = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);

    return {
      title: `Nueva Clienta - ${tenant.name}`,
      description: `Agregar nueva clienta en ${tenant.name}`,
    };
  } catch (error) {
    return {
      title: "Nueva Clienta",
    };
  }
}

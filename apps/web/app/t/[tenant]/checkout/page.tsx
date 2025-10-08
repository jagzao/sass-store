import { notFound } from "next/navigation";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { CheckoutClient } from "./checkout-client";

interface CheckoutPageProps {
  params: {
    tenant: string;
  };
  searchParams: {
    service?: string;
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const tenantData = await getTenantDataForPage(params.tenant);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/t/${params.tenant}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver a {tenantData.name}
              </a>
              <h1
                className="text-2xl font-bold"
                style={{ color: tenantData.branding.primaryColor }}
              >
                Checkout
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a
                href={`/t/${params.tenant}/services`}
                className="text-gray-600 hover:text-gray-900"
              >
                Servicios
              </a>
              <a
                href={`/t/${params.tenant}/products`}
                className="text-gray-600 hover:text-gray-900"
              >
                Productos
              </a>
              <a
                href={`/t/${params.tenant}/cart`}
                className="text-gray-600 hover:text-gray-900"
              >
                Carrito
              </a>
            </nav>
          </div>
        </div>
      </header>

      <CheckoutClient
        tenantData={tenantData}
        selectedServiceId={searchParams.service}
      />
    </div>
  );
}

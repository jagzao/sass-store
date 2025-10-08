import { notFound } from "next/navigation";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { ServicesClient } from "./services-client";

interface ServicesPageProps {
  params: {
    tenant: string;
  };
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const tenantData = await getTenantDataForPage(params.tenant);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-pink-50 to-white"
      style={{
        background: `linear-gradient(to bottom, ${tenantData.branding.primaryColor}10, white)`,
      }}
    >
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
              <h1 className="text-2xl font-bold" style={{color: tenantData.branding.primaryColor}}>
                Servicios
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a href={`/t/${params.tenant}/products`} className="text-gray-600 hover:text-gray-900">Productos</a>
              <a href={`/t/${params.tenant}/cart`} className="text-gray-600 hover:text-gray-900">Carrito</a>
              <a href={`/t/${params.tenant}/login`} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Login</a>
            </nav>
          </div>
        </div>
      </header>

      <ServicesClient
        services={tenantData.services}
        tenantData={{
          slug: tenantData.slug,
          name: tenantData.name,
          branding: tenantData.branding
        }}
      />
    </div>
  );
}

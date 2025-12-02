import { notFound } from "next/navigation";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { BookingClient } from "./booking-client";

interface PageProps {
  params: Promise<{
    tenant: string;
    id: string;
  }>;
}

export default async function BookingPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  if (!tenantData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/t/${resolvedParams.tenant}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver a {tenantData.name}
              </a>
              <h1
                className="text-2xl font-bold"
                style={{ color: tenantData.branding.primaryColor }}
              >
                Reservar Cita
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a
                href={`/t/${resolvedParams.tenant}/services`}
                className="text-gray-600 hover:text-gray-900"
              >
                Servicios
              </a>
              <a
                href={`/t/${resolvedParams.tenant}/products`}
                className="text-gray-600 hover:text-gray-900"
              >
                Productos
              </a>
              <a
                href={`/t/${resolvedParams.tenant}/cart`}
                className="text-gray-600 hover:text-gray-900"
              >
                Carrito
              </a>
            </nav>
          </div>
        </div>
      </header>

      <BookingClient tenantData={tenantData} serviceId={resolvedParams.id} />
    </div>
  );
}
export async function generateStaticParams() {
  return [];
}

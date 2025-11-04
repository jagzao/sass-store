import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { ProductsClient } from "./products-client";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function ProductsAdminPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav
        tenantInfo={{
          id: tenantData.id,
          name: tenantData.name,
          categories: [],
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <a
                    href={`/t/${resolvedParams.tenant}/admin`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    ← Panel Admin
                  </a>
                  <span className="text-gray-600">/</span>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Productos
                  </h1>
                </div>
                <p className="text-gray-600 mt-2">
                  Administra tu catálogo de productos
                </p>
              </div>
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <span className="mr-2">+</span>
                Nuevo Producto
              </button>
            </div>
          </div>

          <ProductsClient tenantSlug={resolvedParams.tenant} />
        </div>
      </div>
    </div>
  );
}

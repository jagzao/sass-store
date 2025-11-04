import { notFound } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { AccountClient } from "./account-client";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function AccountPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  if (!tenantData) {
    notFound();
  }

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
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tu información personal y preferencias
            </p>
          </div>

          <AccountClient tenantSlug={resolvedParams.tenant} />
        </div>
      </div>
    </div>
  );
}

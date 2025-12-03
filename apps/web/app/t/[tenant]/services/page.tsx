import { notFound } from "next/navigation";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { ServicesClient } from "./services-client";

interface ServicesPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  return (
    <div className="container mx-auto px-4 py-8">

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

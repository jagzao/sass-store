import { notFound } from "next/navigation";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { ServicesClient } from "../services/services-client"; // Import from services directory
import { auth } from "@/lib/auth";

interface BookPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const resolvedParams = await params;
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);
  const session = await auth();

  const isAdmin =
    !!session?.user &&
    (session.user.role === "Admin" || session.user.role === "Gerente") &&
    session.user.tenantSlug === resolvedParams.tenant;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Reusing ServicesClient to allow service selection for booking */}
      <ServicesClient
        services={tenantData.services}
        tenantData={{
          slug: tenantData.slug,
          name: tenantData.name,
          branding: tenantData.branding,
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}

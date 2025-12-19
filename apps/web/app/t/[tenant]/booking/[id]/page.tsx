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
      <BookingClient tenantData={tenantData} serviceId={resolvedParams.id} />
    </div>
  );
}
export async function generateStaticParams() {
  return [];
}

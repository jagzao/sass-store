import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";
import { resolvePortalTenant } from "@/lib/tenant/development-guard";
import { DevelopmentService } from "@/lib/services/development-service";
import { CustomerBookingHistoryService } from "@/lib/services/customer-booking-history-service";
import { DevelopmentPortalClient } from "./DevelopmentPortalClient";

interface DevelopmentPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function DevelopmentPage({
  params,
}: DevelopmentPageProps) {
  const { tenant: tenantSlug } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/t/${tenantSlug}/login?callbackUrl=/t/${tenantSlug}/development`);
  }

  const tenantResult = await resolvePortalTenant(tenantSlug);
  if (tenantResult.success === false) {
    notFound();
  }
  const tenant = tenantResult.data;

  await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

  const projectsResult =
    tenant.businessType === "development"
      ? await DevelopmentService.listProjects(tenant.id)
      : undefined;
  const dailyResult =
    tenant.businessType === "development"
      ? await DevelopmentService.listDailyReports(tenant.id, undefined, 30)
      : undefined;

  const bookingHistoryResult =
    tenant.businessType === "salud y belleza" && session.user.email
      ? await CustomerBookingHistoryService.getBookingsForUser(
          tenant.id,
          session.user.email,
        )
      : undefined;

  const projects = projectsResult?.success ? projectsResult.data : [];
  const dailyReports = dailyResult?.success ? dailyResult.data : [];
  const bookingHistory = bookingHistoryResult?.success
    ? bookingHistoryResult.data
    : [];

  return (
    <main
      data-testid="development-portal-page"
      className="min-h-screen bg-gray-50"
    >
      <DevelopmentPortalClient
        tenantName={tenant.name}
        tenantSlug={tenantSlug}
        businessType={tenant.businessType}
        projects={projects}
        dailyReports={dailyReports}
        bookingHistory={bookingHistory}
      />
    </main>
  );
}

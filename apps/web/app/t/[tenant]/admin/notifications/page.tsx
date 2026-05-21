import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { db } from "@sass-store/database";
import { customers } from "@sass-store/database/schema";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";
import { NotificationsClient } from "./NotificationsClient";
import { getTenantNotificationTemplates } from "@/lib/notifications/notification-template";
import { getTenantStaffPhone } from "@/lib/notifications/booking-staff-notification";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const resolvedParams = await params;
  const resolvedTenant = await resolveTenant();
  if (!resolvedTenant) notFound();

  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  const [templates, staffPhone, customerRows] = await Promise.all([
    getTenantNotificationTemplates(tenantData.id),
    getTenantStaffPhone(tenantData.id),
    db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantData.id),
          isNotNull(customers.phone),
          ne(customers.phone, ""),
        ),
      ),
  ]);

  return (
    <AdminLayoutProvider
      tenantSlug={resolvedParams.tenant}
      branding={tenantData.branding}
    >
      <div className="max-w-5xl mx-auto space-y-6 p-4 lg:p-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-3">
          <a
            href={`/t/${resolvedParams.tenant}/admin`}
            className="text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-primary, #C5A059)" }}
          >
            ← Panel Admin
          </a>
          <span className="text-gray-400">/</span>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
        </div>

        <NotificationsClient
          tenantSlug={resolvedParams.tenant}
          tenantName={tenantData.name}
          initialTemplates={templates}
          initialStaffPhone={staffPhone}
          totalCustomersWithPhone={customerRows.length}
        />
      </div>
    </AdminLayoutProvider>
  );
}

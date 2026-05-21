import { db } from "@sass-store/database";
import { customers, tenants } from "@sass-store/database/schema";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";
import { NotificationsClient } from "./NotificationsClient";
import { getTenantNotificationTemplates } from "@/lib/notifications/notification-template";
import { getTenantStaffPhone } from "@/lib/notifications/booking-staff-notification";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) redirect(`/t/${tenantSlug}/admin`);

  const [templates, staffPhone, customerRows] = await Promise.all([
    getTenantNotificationTemplates(tenant.id),
    getTenantStaffPhone(tenant.id),
    db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenant.id),
          isNotNull(customers.phone),
          ne(customers.phone, ""),
        ),
      ),
  ]);

  return (
    <AdminLayoutProvider tenantSlug={tenantSlug}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center space-x-3">
              <a
                href={`/t/${tenantSlug}/admin`}
                className="text-indigo-600 hover:text-indigo-700 text-sm"
              >
                ← Panel Admin
              </a>
              <span className="text-gray-400">/</span>
              <h1 className="text-2xl font-bold text-gray-900">
                Notificaciones
              </h1>
            </div>

            <NotificationsClient
              tenantSlug={tenantSlug}
              tenantName={tenant.name}
              initialTemplates={templates}
              initialStaffPhone={staffPhone}
              totalCustomersWithPhone={customerRows.length}
            />
          </div>
        </div>
      </div>
    </AdminLayoutProvider>
  );
}

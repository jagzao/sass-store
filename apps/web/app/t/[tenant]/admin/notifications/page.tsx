import { db } from "@sass-store/database";
import { customers, tenants } from "@sass-store/database/schema";
import { and, eq, isNotNull, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
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

  const [templates, staffPhone, customerCount] = await Promise.all([
    getTenantNotificationTemplates(tenant.id),
    getTenantStaffPhone(tenant.id),
    db
      .select({ count: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenant.id),
          isNotNull(customers.phone),
          ne(customers.phone, ""),
        ),
      )
      .then((r) => r.length),
  ]);

  return (
    <NotificationsClient
      tenantSlug={tenantSlug}
      tenantName={tenant.name}
      initialTemplates={templates}
      initialStaffPhone={staffPhone}
      totalCustomersWithPhone={customerCount}
    />
  );
}

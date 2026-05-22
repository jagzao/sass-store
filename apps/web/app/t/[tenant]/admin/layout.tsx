import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import type { TenantBranding } from "@/types/tenant";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;

  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      branding: tenants.branding,
    })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) notFound();

  return (
    <AdminLayoutProvider
      tenantSlug={tenantSlug}
      branding={tenant.branding as Partial<TenantBranding>}
    >
      {children}
    </AdminLayoutProvider>
  );
}

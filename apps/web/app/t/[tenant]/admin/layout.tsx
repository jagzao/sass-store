import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import type { TenantBranding } from "@/types/tenant";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLayoutProvider } from "@/components/home/AdminLayoutProvider";

const STAFF_ROLES = ["admin", "gerente", "personal"] as const;

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;

  // Require authenticated session with a staff role
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/t/${tenantSlug}/admin`);
  }

  const user = session.user as any;
  const role = (user.role as string | undefined)?.toLowerCase();
  const userTenantSlug = user.tenantSlug as string | undefined;

  // Admin role can access any tenant; staff must belong to this tenant
  const isGlobalAdmin = role === "admin" && !userTenantSlug;
  const isTenantStaff =
    STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]) &&
    userTenantSlug === tenantSlug;

  if (!isGlobalAdmin && !isTenantStaff) {
    redirect(`/t/${tenantSlug}`);
  }

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

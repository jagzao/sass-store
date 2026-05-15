import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const ADMIN_ROLES = ["Admin", "Gerente"] as const;

/**
 * Server-side admin guard.
 * Call at the top of any Server Component that requires admin access.
 * Redirects to tenant login if no valid session, or to tenant home if insufficient role.
 */
export async function requireAdmin(tenantSlug: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/t/${tenantSlug}/login?callbackUrl=/t/${tenantSlug}/admin`);
  }

  const role = session.user.role as string | undefined;
  if (!role || !ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
    redirect(`/t/${tenantSlug}`);
  }

  return session;
}

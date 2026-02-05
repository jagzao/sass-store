import { Session } from "next-auth";

export class TenantAccessError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export function assertTenantAccess(
  session: Session | null,
  targetTenantSlug: string,
) {
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Allow global admins or matching tenant
  const userRole = (session.user as any).role;
  const userTenantSlug = (session.user as any).tenantSlug;

  if (userRole === "Admin") {
    return;
  }

  if (userTenantSlug !== targetTenantSlug) {
    throw new TenantAccessError();
  }
}

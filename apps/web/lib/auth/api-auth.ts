
import { Session } from "next-auth";

export class TenantAccessError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export function assertTenantAccess(session: Session | null, targetTenantSlug: string) {
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if ((session.user as any).tenantSlug !== targetTenantSlug) {
    throw new TenantAccessError();
  }
}

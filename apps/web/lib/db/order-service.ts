import { db, withTenantContext } from "@sass-store/database";
import { orders } from "@sass-store/database/schema";
import { and, eq, desc } from "drizzle-orm";

export async function getUserOrders(
  tenantId: string,
  user: { id: string; role: string; email?: string | null },
) {
  if (!user) return [];

  return await withTenantContext(db, tenantId, user, async (tx) => {
    // The RLS policy will automatically filter orders based on the user's role.
    // Admins/Managers will see all orders for the tenant.
    // Clients will only see their own orders based on email match.
    // We add a where clause for defense-in-depth.
    const userOrders = await tx
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          user.role === "Cliente" && user.email
            ? eq(orders.customerEmail, user.email)
            : undefined,
        ),
      )
      .orderBy(desc(orders.createdAt));

    return userOrders;
  });
}

import { db, withTenantContext } from "@sass-store/database";
import { orders } from "@sass-store/database/schema";
import { and, eq, desc } from "drizzle-orm";

export async function getUserOrders(
  tenantId: string,
  user: { id: string; role: string }
) {
  if (!user) return [];

  return await withTenantContext(db, tenantId, user, async (tx) => {
    // The RLS policy will automatically filter orders based on the user's role.
    // Admins/Managers will see all orders for the tenant.
    // Clients will only see their own orders.
    // We add a where clause for defense-in-depth.
    const userOrders = await tx
      .select()
      .from(orders)
      .where(and(
        eq(orders.tenantId, tenantId),
        user.role === 'Cliente' ? eq(orders.userId, user.id) : undefined
      ))
      .orderBy(desc(orders.createdAt));

    return userOrders;
  });
}

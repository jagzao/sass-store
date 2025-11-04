import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import { getUserOrders } from "@/lib/db/order-service";
import OrdersClientPage from "@/components/orders/OrdersClientPage";
import { resolveTenant } from "@/lib/tenant/resolver";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantOrdersPage({ params }: PageProps) {
  const resolvedParams = await params;

  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return notFound(); // Or redirect to login
  }

  const resolvedTenant = await resolveTenant();
  if (!resolvedTenant) {
    return notFound();
  }

  const [tenantData, orders] = await Promise.all([
    getTenantDataForPage(resolvedParams.tenant),
    getUserOrders(resolvedTenant.id, session.user as { id: string; role: string }),
  ]);

  return (
    <OrdersClientPage
      tenantSlug={resolvedParams.tenant}
      tenantName={tenantData.name}
      orders={orders}
    />
  );
}
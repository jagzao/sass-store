import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { getUserOrders } from "@/lib/db/order-service";
import OrdersClientPage from "@/components/orders/OrdersClientPage";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantOrdersPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { tenant: tenantSlug } = resolvedParams;

  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return notFound(); // Or redirect to login
  }

  try {
    // 1. Get tenant by slug (Server-Side)
    const tenantData = await getTenantBySlug(tenantSlug);

    if (!tenantData) {
      console.error(`[OrdersPage] Tenant not found: ${tenantSlug}`);
      return notFound();
    }

    // 2. Fetch orders using the resolved tenant ID from DB
    const orders = await getUserOrders(
      tenantData.id,
      session.user as { id: string; role: string; email?: string | null },
    );

    return (
      <OrdersClientPage
        tenantSlug={tenantSlug}
        tenantName={tenantData.name}
        orders={orders}
      />
    );
  } catch (error) {
    console.error("[ORDERS PAGE] Error loading orders:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error al cargar s pedidos</h1>
        <p>
          Hubo un problema al obtener la información. Por favor intente más
          tarde.
        </p>
      </div>
    );
  }
}

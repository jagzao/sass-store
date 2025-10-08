import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: {
    tenant: string;
  };
}

export default async function OrdersPage({ params }: PageProps) {
  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(params.tenant);

  // Mock orders data - in production this would come from database
  const mockOrders = [
    {
      id: "ORD-001",
      date: "2024-09-20",
      status: "delivered",
      total: 89.5,
      items: [
        { name: "Gel Manicure", quantity: 1, price: 55.0 },
        { name: "Nail Polish - Rose Gold", quantity: 1, price: 34.5 },
      ],
    },
    {
      id: "ORD-002",
      date: "2024-09-15",
      status: "pending",
      total: 125.0,
      items: [
        { name: "Classic Manicure", quantity: 1, price: 35.0 },
        { name: "Pedicure Deluxe", quantity: 1, price: 65.0 },
        { name: "Nail Art Design", quantity: 1, price: 25.0 },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Entregado";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav
        tenantInfo={{
          id: tenantData.id,
          name: tenantData.name,
          categories: [],
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mis Pedidos
                </h1>
                <p className="text-gray-600 mt-2">
                  Historial completo de tus compras y servicios
                </p>
              </div>
              <a
                href={`/t/${params.tenant}/account`}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Volver a Mi Cuenta
              </a>
            </div>
          </div>

          {/* Orders List */}
          {mockOrders.length > 0 ? (
            <div className="space-y-6">
              {mockOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Realizado el{" "}
                          {new Date(order.date).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                        <div className="text-lg font-bold text-gray-900 mt-1">
                          ${order.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Cantidad: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Actions */}
                    <div className="mt-6 flex justify-end space-x-3">
                      <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                        Ver Detalles
                      </button>
                      {order.status === "delivered" && (
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                          Reordenar
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes pedidos aún
              </h3>
              <p className="text-gray-600 mb-6">
                ¡Es hora de hacer tu primera compra!
              </p>
              <a
                href={`/t/${params.tenant}/products`}
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Explorar Productos
              </a>
            </div>
          )}

          {/* Order Summary Stats */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {mockOrders.length}
              </div>
              <div className="text-gray-600">Pedidos Total</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                $
                {mockOrders
                  .reduce((sum, order) => sum + order.total, 0)
                  .toFixed(2)}
              </div>
              <div className="text-gray-600">Total Gastado</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                $
                {mockOrders.length > 0
                  ? (
                      mockOrders.reduce((sum, order) => sum + order.total, 0) /
                      mockOrders.length
                    ).toFixed(2)
                  : "0.00"}
              </div>
              <div className="text-gray-600">Promedio por Pedido</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

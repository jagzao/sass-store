"use client";

import type { orders } from "@/lib/db/schema";

interface OrdersClientPageProps {
  tenantSlug: string;
  tenantName: string;
  orders: (typeof orders.$inferSelect)[];
}

export default function OrdersClientPage({
  tenantSlug,
  tenantName,
  orders: userOrders,
}: OrdersClientPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <a
            href={`/t/${tenantSlug}`}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            &larr; Volver a {tenantName || "Inicio"}
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          {userOrders.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-6">&#128230;</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No tienes pedidos en {tenantName || "este negocio"} a&uacute;n
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Cuando realices tu primera compra, podr&aacute;s ver todos tus
                pedidos aqu&iacute;. Explora nuestros productos y servicios para
                comenzar.
              </p>
              <a
                href={`/t/${tenantSlug}`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Explorar Productos
              </a>
            </div>
          ) : (
            /* Orders List */
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Historial de Pedidos
              </h3>
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Pedido #{order.orderNumber}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt!).toLocaleDateString(
                            "es-MX",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${order.total} {order.currency}
                        </div>
                        <div className="text-sm text-green-600 capitalize">
                          {order.status}
                        </div>
                      </div>
                    </div>
                    {/* You can add order items here if you fetch them */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

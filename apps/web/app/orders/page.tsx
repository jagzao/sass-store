"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/t/zo-system/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/t/zo-system"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver al inicio
              </a>
              <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No tienes pedidos aún
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Cuando realices tu primera compra, podrás ver todos tus pedidos
              aquí. Explora nuestros productos y servicios para comenzar.
            </p>
            <a
              href="/t/zo-system"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Explorar Productos
            </a>
          </div>

          {/* Future Orders List Structure */}
          <div className="mt-8 hidden">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Historial de Pedidos
            </h3>
            <div className="space-y-4">
              {/* Order items would go here */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Pedido #12345
                    </h4>
                    <p className="text-sm text-gray-600">15 de octubre, 2025</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">$450.00</div>
                    <div className="text-sm text-green-600">Entregado</div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    Manicure Premium LED + Nail Art
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

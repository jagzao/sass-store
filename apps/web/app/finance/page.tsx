"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FinancePage() {
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
          <p className="text-gray-600">Cargando finanzas...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">
                Panel Financiero
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Ingresos Totales
                  </h3>
                  <p className="text-sm text-gray-600">Este mes</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
              <div className="text-3xl font-bold text-green-600">$12,450</div>
              <p className="text-sm text-green-600 mt-1">
                +12% vs mes anterior
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Pedidos</h3>
                  <p className="text-sm text-gray-600">Este mes</p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
              <div className="text-3xl font-bold text-blue-600">89</div>
              <p className="text-sm text-blue-600 mt-1">+8% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Clientes</h3>
                  <p className="text-sm text-gray-600">Total activos</p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
              <div className="text-3xl font-bold text-purple-600">234</div>
              <p className="text-sm text-purple-600 mt-1">+15 nuevos</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Margen</h3>
                  <p className="text-sm text-gray-600">Promedio</p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
              <div className="text-3xl font-bold text-orange-600">68%</div>
              <p className="text-sm text-orange-600 mt-1">
                +2% vs mes anterior
              </p>
            </div>
          </div>

          {/* Charts and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Ingresos por Mes
              </h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">
                    Gráfico de ingresos (Próximamente)
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Enero</span>
                      <span className="text-sm font-semibold">$8,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Febrero</span>
                      <span className="text-sm font-semibold">$9,100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Marzo</span>
                      <span className="text-sm font-semibold">$10,800</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Abril</span>
                      <span className="text-sm font-semibold">$12,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Transacciones Recientes
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">
                      Manicure Premium
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: María García
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$450</p>
                    <p className="text-xs text-gray-500">Hoy 14:30</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Pedicure Spa</p>
                    <p className="text-sm text-gray-600">Cliente: Ana López</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$550</p>
                    <p className="text-xs text-gray-500">Ayer 16:45</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">
                      Nail Art Premium
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: Carmen Ruiz
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$200</p>
                    <p className="text-xs text-gray-500">2 días atrás</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      Tratamiento Fortalecedor
                    </p>
                    <p className="text-sm text-gray-600">
                      Cliente: Laura Martín
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+$320</p>
                    <p className="text-xs text-gray-500">3 días atrás</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Reports */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              Reportes Financieros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center mb-2">
                  <div className="text-2xl mr-3">📄</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Balance General
                    </h3>
                    <p className="text-sm text-gray-600">
                      Estado financiero completo
                    </p>
                  </div>
                </div>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center mb-2">
                  <div className="text-2xl mr-3">💰</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Flujo de Caja
                    </h3>
                    <p className="text-sm text-gray-600">
                      Movimientos de efectivo
                    </p>
                  </div>
                </div>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center mb-2">
                  <div className="text-2xl mr-3">📊</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Análisis de Costos
                    </h3>
                    <p className="text-sm text-gray-600">
                      Rentabilidad por servicio
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

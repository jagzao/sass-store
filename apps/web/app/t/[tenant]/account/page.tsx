import { notFound } from "next/navigation";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: {
    tenant: string;
  };
}

export default async function AccountPage({ params }: PageProps) {
  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(params.tenant);

  if (!tenantData) {
    notFound();
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tu información personal y preferencias
            </p>
          </div>

          {/* Account Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Información Personal
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                Actualizar Información
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <a
                  href={`/t/${params.tenant}/orders`}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mr-3">📦</div>
                  <div>
                    <div className="font-medium">Mis Pedidos</div>
                    <div className="text-sm text-gray-500">
                      Ver historial de compras
                    </div>
                  </div>
                </a>

                <a
                  href={`/t/${params.tenant}/favorites`}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mr-3">❤️</div>
                  <div>
                    <div className="font-medium">Favoritos</div>
                    <div className="text-sm text-gray-500">
                      Productos y servicios guardados
                    </div>
                  </div>
                </a>

                {tenantData.mode === "booking" && (
                  <a
                    href={`/t/${params.tenant}/bookings`}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mr-3">📅</div>
                    <div>
                      <div className="font-medium">Mis Citas</div>
                      <div className="text-sm text-gray-500">
                        Reservas y citas programadas
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Preferencias</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notificaciones por Email</div>
                    <div className="text-sm text-gray-500">
                      Recibir actualizaciones de pedidos
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notificaciones SMS</div>
                    <div className="text-sm text-gray-500">
                      Recordatorios de citas
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Ofertas y Promociones</div>
                    <div className="text-sm text-gray-500">
                      Recibir descuentos especiales
                    </div>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>

            {/* Loyalty/Points */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Programa de Fidelidad
              </h2>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  1,250
                </div>
                <div className="text-gray-600">Puntos Acumulados</div>
              </div>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 rounded-full h-2"
                  style={{ width: "75%" }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>1,250 pts</span>
                <span>2,000 pts (Próximo nivel)</span>
              </div>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                Canjear Puntos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

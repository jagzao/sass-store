import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  // Mock admin stats
  const stats = {
    products: tenantData.products?.length || 0,
    services: tenantData.services?.length || 0,
    orders: 15,
    revenue: 2450.0,
    bookings: 8,
    customers: 23,
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
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestiona tu negocio: {tenantData.name}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Modo:{" "}
                <span className="font-semibold capitalize">
                  {tenantData.mode}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📦</div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.products}
                  </div>
                  <div className="text-sm text-gray-600">Productos</div>
                </div>
              </div>
            </div>

            {tenantData.mode === "booking" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📅</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.services}
                    </div>
                    <div className="text-sm text-gray-600">Servicios</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">💰</div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${stats.revenue}
                  </div>
                  <div className="text-sm text-gray-600">Ingresos</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.customers}
                  </div>
                  <div className="text-sm text-gray-600">Clientes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Management Sections */}
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Product Management */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Productos
                </h2>
                <a
                  href={`/t/${resolvedParams.tenant}/admin_products`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Gestionar →
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📦</span>
                    <div>
                      <div className="font-medium">Crear Producto</div>
                      <div className="text-sm text-gray-500">
                        Añadir nuevo producto
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700">
                    +
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <div className="font-medium">Inventario</div>
                      <div className="text-sm text-gray-500">
                        Gestionar stock
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {stats.products} items
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🏷️</span>
                    <div>
                      <div className="font-medium">Categorías</div>
                      <div className="text-sm text-gray-500">
                        Organizar productos
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">3 categorías</span>
                </div>
              </div>
            </div>

            {/* Service Management */}
            {tenantData.mode === "booking" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Servicios
                  </h2>
                  <a
                    href={`/t/${resolvedParams.tenant}/admin_services`}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Gestionar →
                  </a>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">✨</span>
                      <div>
                        <div className="font-medium">Crear Servicio</div>
                        <div className="text-sm text-gray-500">
                          Nuevo servicio
                        </div>
                      </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700">
                      +
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📅</span>
                      <div>
                        <div className="font-medium">Horarios</div>
                        <div className="text-sm text-gray-500">
                          Disponibilidad
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/t/${resolvedParams.tenant}/admin/calendar`}
                      className="text-indigo-600 text-sm"
                    >
                      Ver
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">👥</span>
                      <div>
                        <div className="font-medium">Personal</div>
                        <div className="text-sm text-gray-500">
                          Gestionar staff
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/t/${resolvedParams.tenant}/admin/staff`}
                      className="text-indigo-600 text-sm"
                    >
                      Ver
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Content Management */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Contenido
                </h2>
                <a
                  href={`/t/${resolvedParams.tenant}/admin/content`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Gestionar →
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎨</span>
                    <div>
                      <div className="font-medium">Look & Feel</div>
                      <div className="text-sm text-gray-500">
                        Personalizar diseño
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    Editar
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📸</span>
                    <div>
                      <div className="font-medium">Galería</div>
                      <div className="text-sm text-gray-500">
                        Imágenes y media
                      </div>
                    </div>
                  </div>
                  <a
                    href={`/t/${resolvedParams.tenant}/admin/gallery`}
                    className="text-indigo-600 text-sm"
                  >
                    Ver
                  </a>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📝</span>
                    <div>
                      <div className="font-medium">Información</div>
                      <div className="text-sm text-gray-500">
                        Contacto y horarios
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    Editar
                  </button>
                </div>
              </div>
            </div>

            {/* Orders & Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Ventas</h2>
                <a
                  href={`/t/${resolvedParams.tenant}/admin/orders`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Ver todas →
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📦</span>
                    <div>
                      <div className="font-medium">Pedidos</div>
                      <div className="text-sm text-gray-500">
                        Gestionar pedidos
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {stats.orders}
                  </span>
                </div>

                {tenantData.mode === "booking" && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📅</span>
                      <div>
                        <div className="font-medium">Citas</div>
                        <div className="text-sm text-gray-500">
                          Reservas programadas
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {stats.bookings}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💰</span>
                    <div>
                      <div className="font-medium">Ingresos</div>
                      <div className="text-sm text-gray-500">Este mes</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    ${stats.revenue}
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Analytics
                </h2>
                <a
                  href={`/t/${resolvedParams.tenant}/admin/analytics`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Ver más →
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <div className="font-medium">Clientes</div>
                      <div className="text-sm text-gray-500">
                        Total registrados
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {stats.customers}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📈</span>
                    <div>
                      <div className="font-medium">Crecimiento</div>
                      <div className="text-sm text-gray-500">Este mes</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    +15%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⭐</span>
                    <div>
                      <div className="font-medium">Satisfacción</div>
                      <div className="text-sm text-gray-500">
                        Calificación promedio
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-yellow-600">
                    4.8/5
                  </span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Configuración
                </h2>
                <a
                  href={`/t/${resolvedParams.tenant}/admin/settings`}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Configurar →
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚙️</span>
                    <div>
                      <div className="font-medium">General</div>
                      <div className="text-sm text-gray-500">
                        Configuración básica
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    Editar
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💳</span>
                    <div>
                      <div className="font-medium">Pagos</div>
                      <div className="text-sm text-gray-500">
                        Métodos de pago
                      </div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    Configurar
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📧</span>
                    <div>
                      <div className="font-medium">Notificaciones</div>
                      <div className="text-sm text-gray-500">Email y SMS</div>
                    </div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm">
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <span className="mr-2">📦</span>
                Crear Producto
              </button>

              {tenantData.mode === "booking" && (
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <span className="mr-2">📅</span>
                  Crear Servicio
                </button>
              )}

              <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <span className="mr-2">🎨</span>
                Personalizar Diseño
              </button>

              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <span className="mr-2">📸</span>
                Subir Imagen
              </button>

              <a
                href={`/t/${resolvedParams.tenant}`}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">👁️</span>
                Ver Mi Tienda
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

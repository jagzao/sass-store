import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function FavoritesPage({ params }: PageProps) {
  const resolvedParams = await params;

  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(resolvedParams.tenant);

  // Mock favorites data - in production this would come from database
  const mockFavorites = {
    products: [
      {
        id: "wn-polish-sunset",
        name: "Sunset Orange Polish",
        price: 22.0,
        category: "nail-polish",
        image: "🧡",
        description: "Vibrant orange nail polish with high-gloss finish",
      },
      {
        id: "wn-nail-art-kit",
        name: "Professional Nail Art Kit",
        price: 45.0,
        category: "tools",
        image: "🎨",
        description: "Complete set for creating stunning nail designs",
      },
    ],
    services: [
      {
        id: "wn-gel-manicure",
        name: "Gel Manicure",
        price: 55.0,
        duration: 60,
        image: "✨",
        description: "Long-lasting gel polish manicure",
      },
      {
        id: "wn-nail-art",
        name: "Custom Nail Art",
        price: 35.0,
        duration: 45,
        image: "🎨",
        description: "Personalized nail art designs",
      },
    ],
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
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mis Favoritos
                </h1>
                <p className="text-gray-600 mt-2">
                  Productos y servicios que te encantan
                </p>
              </div>
              <a
                href={`/t/${resolvedParams.tenant}/account`}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Volver a Mi Cuenta
              </a>
            </div>
          </div>

          {/* Favorites Content */}
          {mockFavorites.products.length > 0 ||
          mockFavorites.services.length > 0 ? (
            <div className="space-y-12">
              {/* Favorite Products */}
              {mockFavorites.products.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Productos Favoritos
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockFavorites.products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow"
                      >
                        <div className="p-6">
                          <div className="text-4xl mb-3 text-center">
                            {product.image}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {product.description}
                          </p>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-bold text-indigo-600">
                              ${product.price.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                              Agregar al Carrito
                            </button>
                            <button
                              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Quitar de favoritos"
                            >
                              ❤️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Services */}
              {mockFavorites.services.length > 0 &&
                tenantData.mode === "booking" && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Servicios Favoritos
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mockFavorites.services.map((service) => (
                        <div
                          key={service.id}
                          className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow"
                        >
                          <div className="p-6">
                            <div className="text-4xl mb-3 text-center">
                              {service.image}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {service.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {service.description}
                            </p>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-xl font-bold text-indigo-600">
                                ${service.price.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {service.duration} min
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                                Reservar Ahora
                              </button>
                              <button
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Quitar de favoritos"
                              >
                                ❤️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <a
                    href={`/t/${resolvedParams.tenant}/products`}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mr-3">🛍️</div>
                    <div>
                      <div className="font-medium">Explorar Productos</div>
                      <div className="text-sm text-gray-500">
                        Descubre más productos
                      </div>
                    </div>
                  </a>

                  {tenantData.mode === "booking" && (
                    <a
                      href={`/t/${resolvedParams.tenant}/services`}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-2xl mr-3">📅</div>
                      <div>
                        <div className="font-medium">Ver Servicios</div>
                        <div className="text-sm text-gray-500">
                          Reserva tu cita
                        </div>
                      </div>
                    </a>
                  )}

                  <a
                    href={`/t/${resolvedParams.tenant}/orders`}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mr-3">📦</div>
                    <div>
                      <div className="font-medium">Mis Pedidos</div>
                      <div className="text-sm text-gray-500">Ver historial</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">💛</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes favoritos aún
              </h3>
              <p className="text-gray-600 mb-6">
                ¡Explora nuestros productos y servicios para encontrar lo que te
                gusta!
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href={`/t/${resolvedParams.tenant}/products`}
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Ver Productos
                </a>
                {tenantData.mode === "booking" && (
                  <a
                    href={`/t/${resolvedParams.tenant}/services`}
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Ver Servicios
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Favorites Stats */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {mockFavorites.products.length}
              </div>
              <div className="text-gray-600">Productos Favoritos</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockFavorites.services.length}
              </div>
              <div className="text-gray-600">Servicios Favoritos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

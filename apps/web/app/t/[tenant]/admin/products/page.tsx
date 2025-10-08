import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { TopNav } from "@/components/navigation/top-nav";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: {
    tenant: string;
  };
}

export default async function ProductsAdminPage({ params }: PageProps) {
  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(params.tenant);

  // Mock products data - in production this would come from database
  const mockProducts = [
    {
      id: "wn-polish-sunset",
      sku: "WN-001",
      name: "Sunset Orange Polish",
      price: 22.0,
      category: "nail-polish",
      stock: 15,
      active: true,
      featured: true,
      image: "🧡",
      description: "Vibrant orange nail polish with high-gloss finish",
    },
    {
      id: "wn-nail-art-kit",
      sku: "WN-002",
      name: "Professional Nail Art Kit",
      price: 45.0,
      category: "tools",
      stock: 8,
      active: true,
      featured: false,
      image: "🎨",
      description: "Complete set for creating stunning nail designs",
    },
    {
      id: "wn-base-coat",
      sku: "WN-003",
      name: "Strengthening Base Coat",
      price: 18.0,
      category: "treatments",
      stock: 0,
      active: false,
      featured: false,
      image: "💪",
      description: "Protective base coat that strengthens nails",
    },
  ];

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { text: "Agotado", color: "text-red-600 bg-red-100" };
    if (stock <= 5)
      return { text: "Poco Stock", color: "text-yellow-600 bg-yellow-100" };
    return { text: "En Stock", color: "text-green-600 bg-green-100" };
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
                <div className="flex items-center space-x-3">
                  <a
                    href={`/t/${params.tenant}/admin`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    ← Panel Admin
                  </a>
                  <span className="text-gray-600">/</span>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Productos
                  </h1>
                </div>
                <p className="text-gray-600 mt-2">
                  Administra tu catálogo de productos
                </p>
              </div>
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <span className="mr-2">+</span>
                Nuevo Producto
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-indigo-600">
                {mockProducts.length}
              </div>
              <div className="text-sm text-gray-600">Total Productos</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">
                {mockProducts.filter((p) => p.active).length}
              </div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {mockProducts.filter((p) => p.stock <= 5 && p.stock > 0).length}
              </div>
              <div className="text-sm text-gray-600">Poco Stock</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-red-600">
                {mockProducts.filter((p) => p.stock === 0).length}
              </div>
              <div className="text-sm text-gray-600">Agotados</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Todas las categorías</option>
                <option value="nail-polish">Esmaltes</option>
                <option value="tools">Herramientas</option>
                <option value="treatments">Tratamientos</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="out-of-stock">Agotados</option>
              </select>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Filtrar
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                              {product.image}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {product.description}
                              </div>
                              {product.featured && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                  ⭐ Destacado
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {product.category.replace("-", " ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.stock} unidades
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
                          >
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            Editar
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            Duplicar
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-600">Seleccionar todos</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Activar Seleccionados
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                  Desactivar Seleccionados
                </button>
                <button className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors">
                  Eliminar Seleccionados
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Productos más Vendidos
              </h3>
              <div className="space-y-3">
                {mockProducts.slice(0, 3).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{product.image}</span>
                      <span className="text-sm font-medium">
                        {product.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categorías
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Esmaltes</span>
                  <span className="text-sm font-medium">1 producto</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Herramientas</span>
                  <span className="text-sm font-medium">1 producto</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tratamientos</span>
                  <span className="text-sm font-medium">1 producto</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                  📦 Importar Productos (CSV)
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                  📊 Exportar Inventario
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                  🏷️ Gestionar Categorías
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm">
                  📋 Reporte de Stock Bajo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

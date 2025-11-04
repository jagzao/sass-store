'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  featured: boolean;
  image: string | null;
  metadata: any;
  createdAt: Date;
}

export function ProductsClient({ tenantSlug }: { tenantSlug: string }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [session, tenantSlug]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?tenant=${tenantSlug}`);

      if (!res.ok) {
        throw new Error('Error al cargar productos');
      }

      const data = await res.json();
      setProducts(data.data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { text: 'Agotado', color: 'text-red-600 bg-red-100' };
    if (stock <= 5)
      return { text: 'Poco Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'En Stock', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para gestionar productos
          </p>
          <a
            href={`/t/${tenantSlug}/login`}
            className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error: {error}</p>
        <button
          onClick={fetchProducts}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-indigo-600">
            {products.length}
          </div>
          <div className="text-sm text-gray-600">Total Productos</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-green-600">
            {products.filter((p) => p.featured).length}
          </div>
          <div className="text-sm text-gray-600">Destacados</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-yellow-600">
            {products.filter((p) => parseFloat(p.price) > 20).length}
          </div>
          <div className="text-sm text-gray-600">Premium</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-blue-600">
            {new Set(products.map((p) => p.category)).size}
          </div>
          <div className="text-sm text-gray-600">Categorías</div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">No hay productos registrados</p>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                + Crear Primer Producto
              </button>
            </div>
          ) : (
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
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          {product.image || '📦'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {product.description || 'Sin descripción'}
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
                      {product.category.replace('-', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {products.length > 0 && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Productos más Recientes
            </h3>
            <div className="space-y-3">
              {products.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{product.image || '📦'}</span>
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {product.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Categorías
            </h3>
            <div className="space-y-3">
              {Array.from(new Set(products.map((p) => p.category))).map(
                (category) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {category.replace('-', ' ')}
                    </span>
                    <span className="text-sm font-medium">
                      {products.filter((p) => p.category === category).length}{' '}
                      producto(s)
                    </span>
                  </div>
                )
              )}
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
              <button
                onClick={fetchProducts}
                className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                🔄 Recargar Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

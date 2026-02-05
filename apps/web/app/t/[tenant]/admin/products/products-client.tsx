"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProductModal, Product } from "./product-modal";

export function ProductsClient({ tenantSlug }: { tenantSlug: string }) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
      const res = await fetch(`/api/v1/products?tenant=${tenantSlug}`);

      if (!res.ok) {
        throw new Error("Error al cargar productos");
      }

      const data = await res.json();
      setProducts(data.data || []);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const url = editingProduct
        ? `/api/v1/products/${editingProduct.id}`
        : "/api/v1/products";

      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar el producto");
      }

      await fetchProducts();
    } catch (err: any) {
      console.error("Error saving product:", err);
      alert(err.message);
      throw err; // Re-throw to be caught by modal
    }
  };

  const handleDelete = async (productId: string) => {
    if (
      !window.confirm("¿Estás seguro de que quieres eliminar este producto?")
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar el producto");
      }

      // Refresh list
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
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
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <a
                href={`/t/${tenantSlug}/admin`}
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
          <button
            onClick={handleOpenCreate}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="mr-2">+</span>
            Nuevo Producto
          </button>
        </div>
      </div>

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
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
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
                          {product.image || "📦"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {product.description || "Sin descripción"}
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
                      ${parseFloat(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
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
                    <span className="text-lg mr-2">
                      {product.image || "📦"}
                    </span>
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
                      {category.replace("-", " ")}
                    </span>
                    <span className="text-sm font-medium">
                      {products.filter((p) => p.category === category).length}{" "}
                      producto(s)
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleOpenCreate}
                className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                + Nuevo Producto
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

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Package, Tag, FileText, DollarSign, Folder } from "lucide-react";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  featured: boolean;
  active: boolean;
  image: string | null;
  metadata: any;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  product?: Product | null;
}

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
}: ProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: "",
    name: "",
    description: "",
    price: "",
    category: "",
    featured: false,
    active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        description: product.description || "",
      });
    } else {
      setFormData({
        sku: "",
        name: "",
        description: "",
        price: "",
        category: "",
        featured: false,
        active: true,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? "Editar Producto" : "Crear Nuevo Producto"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  aria-label="SKU"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="SKU *"
                />
              </div>

              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  aria-label="Nombre"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nombre *"
                />
              </div>
            </div>

            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                aria-label="Descripción"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Descripción del producto"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  aria-label="Precio"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Precio *"
                />
              </div>

              <div className="relative">
                <Folder className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  aria-label="Categoría"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Categoría *"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      featured: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Producto destacado
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Producto activo
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading
                  ? "Guardando..."
                  : product
                    ? "Actualizar Producto"
                    : "Crear Producto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

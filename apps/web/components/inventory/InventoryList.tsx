"use client";

import React, { useState, useEffect } from "react";
import { useInventory } from "@/lib/hooks/useInventory";
import { InventoryItem } from "@/lib/hooks/useInventory";
import { Eye, Edit, Trash2, AlertCircle } from "lucide-react"; // Icons
import Image from "next/image";

interface InventoryListProps {
  onEdit?: (item: InventoryItem) => void;
  onSelect?: (item: InventoryItem) => void;
  showActions?: boolean;
  initialParams?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
  };
}

export function InventoryList({
  onEdit,
  onSelect,
  showActions = true,
  initialParams = {},
}: InventoryListProps) {
  const { getInventory, loading, error } = useInventory();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [params, setParams] = useState(initialParams);
  const [searchTerm, setSearchTerm] = useState("");

  const loadInventory = async () => {
    try {
      const response = await getInventory(params);
      setInventory(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [params]);

  // Debounced Auto-Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 3 || searchTerm.length === 0) {
        setParams((prev) => {
          if (prev.search === searchTerm) return prev;
          return { ...prev, page: 1, search: searchTerm };
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const applyFilters = () => {
    setParams((prev) => ({ ...prev, page: 1, search: searchTerm }));
  };

  const changePage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Luxury Status Badges
  const getStockStatusBadge = (item: InventoryItem) => {
    if (item.availableQuantity === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
          Sin Stock
        </span>
      );
    }
    if (item.availableQuantity <= item.reorderPoint) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
          Stock Bajo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
        En Stock
      </span>
    );
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5A059]"></div>
      </div>
    );
  }

  if (inventory.length === 0 && !loading && !error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center">
        <div className="bg-[#C5A059]/10 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-[#C5A059]" />
        </div>
        <h3 className="text-xl font-serif text-gray-800 mb-2">
          Inventario Vacío
        </h3>
        <p className="text-gray-500 max-w-sm">
          No hay productos en el inventario. Comienza agregando productos o
          ajustando tus filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Luxury Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all placeholder:text-gray-400 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && applyFilters()}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0Z"
              />
            </svg>
          </div>
        </div>
        <div className="flex gap-2">
           {/* Add buttons here if needed */}
        </div>
      </div>

      {/* Luxury Table */}
      <div className="bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F5FA] border-b border-[#C5A059]/20">
                <th className="px-6 py-4 text-left text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Stock Mínimo
                </th>
                 <th className="px-6 py-4 text-right text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Precio Venta
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map((item, index) => (
                <tr
                  key={item.id}
                  className={`group transition-colors hover:bg-[#F8F5FA]/50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[#C5A059] font-serif font-bold">
                            {item.productName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#C5A059] transition-colors">
                          {item.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {item.productSku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {item.productCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                       {getStockStatusBadge(item)}
                       <span className="text-xs text-gray-500 ml-1">
                          {item.availableQuantity} un.
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-medium">
                    {item.reorderPoint}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-medium font-mono">
                    {formatCurrency(item.unitPrice)}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-medium font-mono">
                    {formatCurrency(item.salePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[#C5A059] font-mono">
                    {formatCurrency(item.totalValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1.5 text-gray-400 hover:text-[#C5A059] transition-colors rounded-lg hover:bg-[#C5A059]/10"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Styled to match Luxury theme */}
        <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Mostrando <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de <span className="font-medium text-gray-900">{pagination.total}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => changePage(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#C5A059] hover:border-[#C5A059]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Anterior
                </button>
                <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#C5A059] rounded-lg hover:bg-[#B08D4C] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-[#C5A059]/20"
                >
                    Siguiente
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

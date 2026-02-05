"use client";

import React, { useState, useEffect } from "react";
import { useInventoryTransactions } from "@/lib/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/lib/hooks/useInventoryTransactions";

interface InventoryTransactionsProps {
  onExport?: () => void;
  showActions?: boolean;
}

export function InventoryTransactions({
  onExport,
  showActions = true,
}: InventoryTransactionsProps) {
  const {
    transactions,
    loading,
    error,
    pagination,
    updateParams,
    loadTransactions,
    exportToCSV,
    getTransactionStats,
  } = useInventoryTransactions();

  const [productId, setProductId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalDeductions: 0,
    totalAdditions: 0,
    totalAdjustments: 0,
    totalQuantity: 0,
  });

  // Cargar estadísticas de transacciones
  const loadStats = () => {
    const statsData = getTransactionStats();
    setStats({
      totalTransactions: statsData.totalTransactions,
      totalDeductions: statsData.byType.deduction,
      totalAdditions: statsData.byType.addition,
      totalAdjustments: statsData.byType.adjustment,
      totalQuantity: statsData.totalAdded - statsData.totalDeducted,
    });
  };

  // Aplicar filtros
  const applyFilters = () => {
    const newParams = {
      page: 1, // Resetear a primera página al filtrar
      productId: productId || undefined,
      type: transactionType || undefined,
      referenceType: referenceType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    updateParams(newParams);
  };

  // Cambiar página
  const changePage = (page: number) => {
    updateParams({ page });
  };

  // Exportar a CSV
  const handleExport = () => {
    exportToCSV();
    onExport?.();
  };

  // Limpiar filtros
  const clearFilters = () => {
    setProductId("");
    setTransactionType("");
    setReferenceType("");
    setStartDate("");
    setEndDate("");
    updateParams({
      page: 1,
      productId: undefined,
      type: undefined,
      referenceType: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  // Cargar estadísticas al inicio
  useEffect(() => {
    loadStats();
  }, [transactions]);

  // Obtener clase para tipo de transacción
  const getTransactionTypeClass = (type: string) => {
    switch (type) {
      case "deduction":
        return "text-red-600 bg-red-50";
      case "addition":
        return "text-green-600 bg-green-50";
      case "adjustment":
        return "text-blue-600 bg-blue-50";
      case "initial":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Obtener texto para tipo de transacción
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case "deduction":
        return "Deducción";
      case "addition":
        return "Adición";
      case "adjustment":
        return "Ajuste";
      case "initial":
        return "Inicial";
      default:
        return type;
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas de transacciones */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">
            Total Transacciones
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalTransactions}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Deducciones</h3>
          <p className="text-2xl font-bold text-red-600">
            {stats.totalDeductions}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Adiciones</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalAdditions}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Ajustes</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalAdjustments}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Cambio Neto</h3>
          <p
            className={`text-2xl font-bold ${stats.totalQuantity >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {stats.totalQuantity >= 0 ? "+" : ""}
            {stats.totalQuantity}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los productos</option>
              <option value="product_1">Producto 1</option>
              <option value="product_2">Producto 2</option>
              <option value="product_3">Producto 3</option>
              {/* Aquí deberías cargar los productos desde la API */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Transacción
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="deduction">Deducción</option>
              <option value="addition">Adición</option>
              <option value="adjustment">Ajuste</option>
              <option value="initial">Inicial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Filtrar
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Limpiar
          </button>
          {showActions && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notas
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(transaction.createdAt.toString())}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.productName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeClass(transaction.type)}`}
                  >
                    {getTransactionTypeText(transaction.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${
                      transaction.type === "deduction"
                        ? "text-red-600"
                        : transaction.type === "addition"
                          ? "text-green-600"
                          : "text-gray-600"
                    }`}
                  >
                    {transaction.type === "deduction" ? "-" : "+"}
                    {transaction.quantity}
                  </div>
                  <div className="text-xs text-gray-500">
                    {transaction.previousQuantity} → {transaction.newQuantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.referenceType && transaction.referenceId ? (
                    <span>
                      {transaction.referenceType}: {transaction.referenceId}
                    </span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {transaction.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => changePage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() =>
                changePage(Math.min(pagination.totalPages, pagination.page + 1))
              }
              disabled={pagination.page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                de <span className="font-medium">{pagination.total}</span>{" "}
                resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => changePage(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let page;
                    if (pagination.totalPages <= 5) {
                      page = i + 1;
                    } else if (pagination.page <= 3) {
                      page = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      page = pagination.totalPages - 4 + i;
                    } else {
                      page = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => changePage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() =>
                    changePage(
                      Math.min(pagination.totalPages, pagination.page + 1),
                    )
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

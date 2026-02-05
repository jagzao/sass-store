"use client";

import React, { useState, useEffect } from "react";
import { useInventoryAlerts } from "@/lib/hooks/useInventoryAlerts";
import { InventoryAlert } from "@/lib/hooks/useInventoryAlerts";

interface InventoryAlertsProps {
  onResolve?: (alert: InventoryAlert) => void;
  onDelete?: (alert: InventoryAlert) => void;
  showActions?: boolean;
}

export function InventoryAlerts({
  onResolve,
  onDelete,
  showActions = true,
}: InventoryAlertsProps) {
  const {
    alerts,
    loading,
    error,
    pagination,
    updateParams,
    loadAlerts,
    createNewAlert,
    resolveAlert,
    reopenAlert,
    removeAlert,
    getAlertStats,
  } = useInventoryAlerts();

  const [showResolved, setShowResolved] = useState(false);
  const [alertType, setAlertType] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    lowStock: 0,
    outOfStock: 0,
    reorderPoint: 0,
  });

  // Cargar estadísticas de alertas
  const loadStats = () => {
    const statsData = getAlertStats();
    setStats({
      total: statsData.total,
      active: statsData.pending,
      resolved: statsData.resolved,
      lowStock: statsData.byType.low_stock,
      outOfStock: statsData.byType.out_of_stock,
      reorderPoint: statsData.byType.reorder_point,
    });
  };

  // Aplicar filtros
  const applyFilters = () => {
    const newParams = {
      page: 1, // Resetear a primera página al filtrar
      resolved: showResolved || undefined,
      type: alertType || undefined,
    };
    updateParams(newParams);
  };

  // Cambiar página
  const changePage = (page: number) => {
    updateParams({ page });
  };

  // Resolver alerta
  const handleResolveAlert = async (alert: InventoryAlert) => {
    try {
      await resolveAlert(alert.id, "Alerta resuelta manualmente");
      loadStats();
      onResolve?.(alert);
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  // Reabrir alerta
  const handleReopenAlert = async (alert: InventoryAlert) => {
    try {
      await reopenAlert(alert.id);
      loadStats();
    } catch (err) {
      console.error("Error reopening alert:", err);
    }
  };

  // Eliminar alerta
  const handleDeleteAlert = async (alert: InventoryAlert) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta alerta?")) {
      return;
    }

    try {
      await removeAlert(alert.id);
      loadStats();
      onDelete?.(alert);
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setShowResolved(false);
    setAlertType("");
    updateParams({
      page: 1,
      resolved: undefined,
      type: undefined,
    });
  };

  // Cargar estadísticas al inicio
  useEffect(() => {
    loadStats();
  }, [alerts]);

  // Obtener clase para tipo de alerta
  const getAlertTypeClass = (type: string) => {
    switch (type) {
      case "low_stock":
        return "text-yellow-600 bg-yellow-50";
      case "out_of_stock":
        return "text-red-600 bg-red-50";
      case "reorder_point":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Obtener texto para tipo de alerta
  const getAlertTypeText = (type: string) => {
    switch (type) {
      case "low_stock":
        return "Stock bajo";
      case "out_of_stock":
        return "Sin stock";
      case "reorder_point":
        return "Punto de reorden";
      default:
        return type;
    }
  };

  if (loading && alerts.length === 0) {
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
      {/* Estadísticas de alertas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Alertas</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Activas</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Resueltas</h3>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Stock Bajo</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Sin Stock</h3>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Alerta
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="low_stock">Stock bajo</option>
              <option value="out_of_stock">Sin stock</option>
              <option value="reorder_point">Punto de reorden</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Mostrar resueltas
              </span>
            </label>
          </div>
          <div className="flex items-end space-x-2">
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
          </div>
        </div>
      </div>

      {/* Tabla de alertas */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mensaje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {alert.productName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAlertTypeClass(alert.type)}`}
                  >
                    {getAlertTypeText(alert.type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{alert.message}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {alert.resolved ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Resuelta
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Activa
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {alert.resolved ? (
                      <button
                        onClick={() => handleReopenAlert(alert)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Reabrir
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResolveAlert(alert)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Resolver
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAlert(alert)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
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

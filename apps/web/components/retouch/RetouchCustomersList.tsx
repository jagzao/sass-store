"use client";

import { useState } from "react";
import { useRetouchCustomers, useUpdateRetouchDate } from "@/lib/hooks";
import { format, parseISO, isToday, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";

interface RetouchCustomer {
  id: string;
  name: string;
  phone: string;
  nextRetouchDate: string | null;
  daysUntilRetouch: number | null;
}

export function RetouchCustomersList() {
  const { customers, loading, error, refetch } = useRetouchCustomers();
  const { updateRetouchDate, loading: updating } = useUpdateRetouchDate();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const handleUpdateRetouchDate = async (customerId: string) => {
    setSelectedCustomer(customerId);
    await updateRetouchDate(customerId);
    refetch();
    setSelectedCustomer(null);
  };

  const getRetouchStatus = (customer: RetouchCustomer) => {
    if (!customer.nextRetouchDate) {
      return { status: "none", label: "Sin fecha de retoque" };
    }

    const retouchDate = parseISO(customer.nextRetouchDate);

    if (isToday(retouchDate)) {
      return { status: "today", label: "Hoy" };
    }

    if (isPast(retouchDate)) {
      return { status: "overdue", label: "Atrasado" };
    }

    if (isFuture(retouchDate)) {
      return { status: "upcoming", label: "Próximo" };
    }

    return { status: "none", label: "Sin fecha de retoque" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "today":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "upcoming":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Clientes por Fecha de Retoque
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Clientes ordenados por próxima fecha de contacto
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Próximo Retoque
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
            {customers.map((customer: RetouchCustomer) => {
              const retouchStatus = getRetouchStatus(customer);
              return (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.nextRetouchDate
                        ? format(
                            parseISO(customer.nextRetouchDate),
                            "dd/MM/yyyy",
                            { locale: es },
                          )
                        : "Sin fecha"}
                    </div>
                    {customer.daysUntilRetouch !== null &&
                      customer.daysUntilRetouch >= 0 && (
                        <div className="text-xs text-gray-500">
                          {customer.daysUntilRetouch === 0
                            ? "Hoy"
                            : `En ${customer.daysUntilRetouch} día${customer.daysUntilRetouch !== 1 ? "s" : ""}`}
                        </div>
                      )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        retouchStatus.status,
                      )}`}
                    >
                      {retouchStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleUpdateRetouchDate(customer.id)}
                      disabled={updating && selectedCustomer === customer.id}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating && selectedCustomer === customer.id
                        ? "Actualizando..."
                        : "Actualizar Retoque"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {customers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No hay clientes con fechas de retoque configuradas.
          </p>
        </div>
      )}
    </div>
  );
}

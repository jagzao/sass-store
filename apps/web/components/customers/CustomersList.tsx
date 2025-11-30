"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Phone, Mail, Calendar, DollarSign, Eye } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  nextAppointment?: string;
  status: "active" | "inactive" | "blocked";
}

interface CustomersListProps {
  tenantSlug: string;
  searchParams: {
    search?: string;
    status?: string;
  };
}

export default function CustomersList({ tenantSlug, searchParams }: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (searchParams.search) queryParams.set("search", searchParams.search);
        if (searchParams.status) queryParams.set("status", searchParams.status);

        const response = await fetch(
          `/api/tenants/${tenantSlug}/customers?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [tenantSlug, searchParams]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando clientas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No se encontraron clientas
        </h3>
        <p className="text-gray-600 mb-6">
          Comienza agregando tu primera clienta al sistema.
        </p>
        <Link
          href={`/t/${tenantSlug}/clientes/nueva`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Agregar Clienta
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {customers.length} {customers.length === 1 ? "Clienta" : "Clientas"}
        </h2>
        <Link
          href={`/t/${tenantSlug}/clientes/nueva`}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + Agregar Clienta
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clienta
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visitas
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Gastado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Visita
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {customer.email}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.visitCount} visitas</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    ${customer.totalSpent.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {customer.lastVisit
                      ? new Date(customer.lastVisit).toLocaleDateString("es-MX")
                      : "Sin visitas"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.status === "active"
                        ? "bg-green-100 text-green-800"
                        : customer.status === "inactive"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {customer.status === "active" ? "Activa" : customer.status === "inactive" ? "Inactiva" : "Bloqueada"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/t/${tenantSlug}/clientes/${customer.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Expediente
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

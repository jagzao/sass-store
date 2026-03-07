"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Phone, Mail, Calendar, DollarSign, Eye, ArrowUpDown, ArrowUp, ArrowDown, Search, X, Save } from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerFileHeader, { type CustomerFileHeaderHandle } from "@/components/customers/CustomerFileHeader";
import CustomerFileSummary from "@/components/customers/CustomerFileSummary";
import CustomerVisitsHistory from "@/components/customers/CustomerVisitsHistory";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  totalSpent: number;
  visitCount: number;
  lastVisit?: string;
  nextAppointment?: string;
  status: "active" | "inactive" | "blocked";
  medicalHistory?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
  } | null;
}

interface CustomersListProps {
  tenantSlug: string;
  searchParams: {
    search?: string;
    status?: string;
    sort?: string;
    order?: string;
  };
}

export default function CustomersList({
  tenantSlug,
  searchParams,
}: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [inlineSearch, setInlineSearch] = useState("");
  const [savingHistorial, setSavingHistorial] = useState(false);
  const customerFileHeaderRef = useRef<CustomerFileHeaderHandle>(null);
  const router = useRouter();
  // We use the prop searchParams for initial fetch, but for sorting interactions 
  // we might want to use the hook to preserve other params easily, 
  // although the prop searchParams contains the server-parsed values.
  
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (searchParams.search) queryParams.set("search", searchParams.search);
        if (searchParams.status) queryParams.set("status", searchParams.status);
        if (searchParams.sort) queryParams.set("sort", searchParams.sort);
        if (searchParams.order) queryParams.set("order", searchParams.order);

        const url = `/api/tenants/${tenantSlug}/customers?${queryParams.toString()}`;
        console.log("[CustomersList] Fetching from:", url);
        const response = await fetch(url);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, JSON.stringify(searchParams)]);

  const handleSort = (column: string) => {
    const currentSort = searchParams.sort;
    const currentOrder = searchParams.order || "desc";
    
    let newOrder = "asc";
    if (currentSort === column) {
      newOrder = currentOrder === "asc" ? "desc" : "asc";
    }
    
    // Construct new URL parameters
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.status) params.set("status", searchParams.status);
    params.set("sort", column);
    params.set("order", newOrder);
    
    router.push(`?${params.toString()}`);
  };

  const getSortIcon = (column: string) => {
    if (searchParams.sort !== column) return <ArrowUpDown className="h-4 w-4 text-gray-400 ml-1" />;
    return searchParams.order === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600 ml-1" />
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // capitalize first letter
    const formatted = date.toLocaleDateString("es-MX", { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric' 
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getNextAppointmentDisplay = (customer: Customer) => {
    if (customer.nextAppointment) {
        return (
            <div className="text-sm text-gray-900 font-medium">
                {new Date(customer.nextAppointment).toLocaleDateString("es-MX", {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        );
    }
    
    if (customer.lastVisit) {
        const lastVisitDate = new Date(customer.lastVisit);
        // Add 15 days
        const estimatedNext = new Date(lastVisitDate);
        estimatedNext.setDate(lastVisitDate.getDate() + 15);
        
        return (
            <div className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block" title="Estimada: Última Visita + 15 días">
                {estimatedNext.toLocaleDateString("es-MX", {
                    day: 'numeric',
                    month: 'short'
                })}
            </div>
        );
    }
    
    return <div className="text-sm text-gray-400">-</div>;
  };

  const clearSort = () => {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.status) params.set("status", searchParams.status);
    router.push(`?${params.toString()}`);
  };

  const columnLabels: Record<string, string> = {
    name: "Clienta",
    birthday: "Cumpleaños",
    lastVisit: "Última Visita",
    nextAppointment: "Próxima Cita",
    priceToCharge: "Precio a Cobrar",
    visitCount: "Visitas",
    totalSpent: "Total Gastado",
    status: "Estado"
  };

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

  // Filter customers by inline search
  const filteredCustomers = inlineSearch
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(inlineSearch.toLowerCase()) ||
        c.phone.includes(inlineSearch) ||
        (c.email && c.email.toLowerCase().includes(inlineSearch.toLowerCase()))
      )
    : customers;

  return (
    <>
    {/* Modal: Agregar Clienta */}
    {showAddModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Agregar Nueva Clienta</h2>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">
            <CustomerForm
              tenantSlug={tenantSlug}
              onSuccess={() => {
                setShowAddModal(false);
                // Refresh customers list
                const queryParams = new URLSearchParams();
                if (searchParams.search) queryParams.set("search", searchParams.search);
                if (searchParams.status) queryParams.set("status", searchParams.status);
                fetch(`/api/tenants/${tenantSlug}/customers?${queryParams.toString()}`)
                  .then((r) => r.json())
                  .then((d) => setCustomers(d.customers || []));
              }}
            />
          </div>
        </div>
      </div>
    )}

    {/* Modal: Ver Expediente */}
    {selectedCustomerId && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={() => setSelectedCustomerId(null)}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-[#5B21B6] font-serif">Expediente de Clienta</h2>
            {/* Center: Save & Close button */}
            <button
              onClick={async () => {
                setSavingHistorial(true);
                try {
                  await customerFileHeaderRef.current?.saveHistorial();
                } finally {
                  setSavingHistorial(false);
                }
                setSelectedCustomerId(null);
              }}
              disabled={savingHistorial}
              title="Guardar cambios y cerrar"
              className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-[#6D28D9] transition-colors disabled:opacity-60 shadow-sm"
            >
              {savingHistorial ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingHistorial ? "Guardando..." : "Guardar y cerrar"}
            </button>
            <div className="flex items-center gap-3">
              <a
                href={`/t/${tenantSlug}/clientes/${selectedCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Abrir en página completa ↗
              </a>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                aria-label="Cerrar sin guardar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-5 space-y-6">
            <CustomerFileHeader ref={customerFileHeaderRef} tenantSlug={tenantSlug} customerId={selectedCustomerId} />
            <CustomerVisitsHistory tenantSlug={tenantSlug} customerId={selectedCustomerId} />
            <CustomerFileSummary tenantSlug={tenantSlug} customerId={selectedCustomerId} />
          </div>
        </div>
      </div>
    )}

    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
        {/* Count + Sort tag */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              {customers.length} {customers.length === 1 ? "Clienta" : "Clientas"}
            </h2>
            {searchParams.sort && columnLabels[searchParams.sort] && (
                <button
                  onClick={clearSort}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full flex items-center gap-2 transition-colors border border-gray-200"
                  title="Quitar ordenamiento"
                >
                    <span>
                        Ordenado por: <strong>{columnLabels[searchParams.sort]}</strong>
                        {searchParams.order === 'asc' ? ' (A-Z)' : ' (Z-A)'}
                    </span>
                    <span className="text-gray-400 font-bold hover:text-gray-600">×</span>
                </button>
            )}
        </div>
        {/* Inline Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={inlineSearch}
            onChange={(e) => setInlineSearch(e.target.value)}
            placeholder="Buscar rápido..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {inlineSearch && (
            <button
              onClick={() => setInlineSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {/* Agregar Clienta */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
        >
          + Agregar Clienta
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-[250px] min-w-[200px]"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                    Clienta
                    {getSortIcon("name")}
                </div>
              </th>
              <th
                scope="col"
                className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort("birthday")}
                title="Cumpleaños"
              >
                <div className="flex items-center">
                    <span className="text-base">🎂 Cumple</span>
                    {getSortIcon("birthday")}
                </div>
              </th>
              <th
                scope="col"
                className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort("lastVisit")}
              >
                <div className="flex items-center">
                    Última Visita
                    {getSortIcon("lastVisit")}
                </div>
              </th>
              <th
                scope="col"
                className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort("nextAppointment")}
               >
                <div className="flex items-center">
                    Próxima Cita
                    {getSortIcon("nextAppointment")}
                </div>
              </th>
              <th
                scope="col"
                className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                onClick={() => handleSort("priceToCharge")}
              >
                <div className="flex items-center">
                   <DollarSign className="w-4 h-4 mr-1 text-[#C5A059]" />
                   Precio a Cobrar
                   {getSortIcon("priceToCharge")}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px] min-w-[150px]"
              >
                Contacto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("visitCount")}
              >
                 <div className="flex items-center">
                    Visitas
                    {getSortIcon("visitCount")}
                </div>
              </th>
              <th
                scope="col"
                className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("totalSpent")}
              >
                <div className="flex items-center">
                    Total Gastado
                    {getSortIcon("totalSpent")}
                 </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                    Estado
                    {getSortIcon("status")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  <button
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Expediente
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-[250px]">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-4 overflow-hidden flex flex-col items-start gap-1">
                      <div
                        className="text-sm font-medium text-gray-900 truncate"
                        title={customer.name}
                      >
                        {customer.name}
                      </div>
                      
                      {/* Detalles Médicos Badge */}
                      {customer.medicalHistory && (
  (customer.medicalHistory.allergies?.length || 0) > 0 || 
  (customer.medicalHistory.conditions?.length || 0) > 0
) && (
                        <div title="Precauciones Médicas" className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                           Salud
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    {customer.birthday
                      ? new Date(customer.birthday).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short"
                        })
                      : <span className="text-gray-400">-</span>}
                  </div>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {customer.lastVisit
                      ? formatDate(customer.lastVisit)
                      : "Sin visitas"}
                  </div>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                   {getNextAppointmentDisplay(customer)}
                </td>
                <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-[#C5A059] bg-amber-50 px-2 py-1 rounded border border-[#C5A059]/30 inline-block">
                     ${((customer as any).priceToCharge || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-[200px]">
                  <div className="text-sm text-gray-900 flex items-center gap-1 truncate">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1 truncate">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate" title={customer.email}>
                        {customer.email}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {customer.visitCount} visitas
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    {customer.totalSpent.toFixed(2)}
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
                    {customer.status === "active"
                      ? "Activa"
                      : customer.status === "inactive"
                        ? "Inactiva"
                        : "Bloqueada"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import AddEditVisitModal from "./AddEditVisitModal";
import VisitDetailModal from "./VisitDetailModal";

interface Visit {
  id: string;
  visitNumber: number;
  visitDate: string;
  totalAmount: number;
  notes?: string;
  nextVisitFrom?: string;
  nextVisitTo?: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  services: {
    id: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  photos?: {
    id: string;
    url: string;
    type: "BEFORE" | "AFTER";
  }[];
}

interface CustomerVisitsHistoryProps {
  tenantSlug: string;
  customerId: string;
}

export default function CustomerVisitsHistory({
  tenantSlug,
  customerId,
}: CustomerVisitsHistoryProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  useEffect(() => {
    fetchVisits();
  }, [tenantSlug, customerId]);

  async function fetchVisits() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tenants/${tenantSlug}/customers/${customerId}/visits`
      );
      if (!response.ok) throw new Error("Failed to fetch visits");
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error("Error fetching visits:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddVisit = () => {
    setEditingVisit(null);
    setShowAddModal(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setEditingVisit(visit);
    setShowAddModal(true);
  };

  const handleViewDetail = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowDetailModal(true);
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta visita? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/customers/${customerId}/visits/${visitId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete visit");

      // Refresh visits
      await fetchVisits();
    } catch (error) {
      console.error("Error deleting visit:", error);
      alert("Error al eliminar la visita");
    }
  };

  const handleModalClose = async (shouldRefresh?: boolean) => {
    setShowAddModal(false);
    setEditingVisit(null);
    if (shouldRefresh) {
      await fetchVisits();
    }
  };

  const getStatusBadge = (status: Visit["status"]) => {
    const statusConfig = {
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      scheduled: { label: "Programada", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completada", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-4 border-b border-gray-200">
              <div className="h-5 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isLuxury = tenantSlug === 'wondernails';

  return (
    <>
      <div className={`${isLuxury ? 'bg-white/80 border border-[#D4AF37]/20 backdrop-blur-md shadow-sm' : 'bg-white shadow'} rounded-lg overflow-hidden`}>
        <div className={`p-6 border-b ${isLuxury ? 'border-[#D4AF37]/10' : 'border-gray-200'} flex justify-between items-center`}>
          <h2 className={`text-xl font-semibold ${isLuxury ? 'text-[#1a1a1a] font-serif' : 'text-gray-900'}`}>
            Historial de Visitas ({visits.length})
          </h2>
          <button
            onClick={handleAddVisit}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${isLuxury ? 'text-white bg-[#D4AF37] hover:bg-[#b3932d]' : 'text-white bg-blue-600 hover:bg-blue-700'} transition-colors`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Visita
          </button>
        </div>

        {visits.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className={`mx-auto h-12 w-12 ${isLuxury ? 'text-[#D4AF37]/30' : 'text-gray-400'} mb-4`} />
            <h3 className={`text-lg font-medium ${isLuxury ? 'text-gray-900' : 'text-gray-900'} mb-2`}>
              Sin visitas registradas
            </h3>
            <p className={`${isLuxury ? 'text-gray-500' : 'text-gray-600'} mb-6`}>
              Registra la primera visita de esta clienta para comenzar su historial.
            </p>
            <button
              onClick={handleAddVisit}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${isLuxury ? 'text-white bg-[#D4AF37] hover:bg-[#b3932d]' : 'text-white bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primera Visita
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isLuxury ? 'divide-[#D4AF37]/10' : 'divide-gray-200'}`}>
              <thead className={isLuxury ? 'bg-[#f9f9f9]' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Nº Visita
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Fecha de Atención
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Servicios
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Total
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Próxima Cita
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Estado
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium ${isLuxury ? 'text-[#b3932d]' : 'text-gray-500'} uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`${isLuxury ? 'bg-transparent divide-y divide-[#D4AF37]/10' : 'bg-white divide-y divide-gray-200'}`}>
                {visits.map((visit) => (
                  <tr key={visit.id} className={isLuxury ? 'hover:bg-[#D4AF37]/5' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isLuxury ? 'text-[#1a1a1a]' : 'text-gray-900'}`}>
                      #{visit.visitNumber}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLuxury ? 'text-gray-600' : 'text-gray-900'}`}>
                      {new Date(visit.visitDate).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isLuxury ? 'text-gray-600' : 'text-gray-900'}`}>
                      {visit.services.length > 0
                        ? `${visit.services[0].serviceName}${
                            visit.services.length > 1
                              ? ` +${visit.services.length - 1} más`
                              : ""
                          }`
                        : "Sin servicios"}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isLuxury ? 'text-[#D4AF37]' : 'text-gray-900'}`}>
                      ${visit.totalAmount.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLuxury ? 'text-gray-600' : 'text-gray-900'}`}>
                      {visit.nextVisitFrom
                        ? new Date(visit.nextVisitFrom).toLocaleDateString("es-MX")
                        : "Sin fecha"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(visit.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 sm:gap-2">
                        <button
                          onClick={() => handleViewDetail(visit)}
                          className={`p-2 rounded-full transition-colors ${isLuxury ? 'text-[#b3932d] hover:bg-[#D4AF37]/10' : 'text-blue-600 hover:bg-blue-50'}`}
                          title="Ver detalle"
                        >
                          <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleEditVisit(visit)}
                          className={`p-2 rounded-full transition-colors ${isLuxury ? 'text-green-600 hover:bg-green-50' : 'text-green-600 hover:bg-green-50'}`}
                          title="Editar"
                        >
                          <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVisit(visit.id)}
                          className={`p-2 rounded-full transition-colors ${isLuxury ? 'text-red-500 hover:bg-red-50' : 'text-red-600 hover:bg-red-50'}`}
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Visit Modal */}
      {showAddModal && (
        <AddEditVisitModal
          tenantSlug={tenantSlug}
          customerId={customerId}
          visit={editingVisit}
          onClose={handleModalClose}
        />
      )}

      {/* Visit Detail Modal */}
      {showDetailModal && selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedVisit(null);
          }}
        />
      )}
    </>
  );
}

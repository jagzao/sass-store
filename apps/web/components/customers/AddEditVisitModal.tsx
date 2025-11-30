"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface VisitService {
  serviceId: string;
  serviceName?: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

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
}

interface AddEditVisitModalProps {
  tenantSlug: string;
  customerId: string;
  visit?: Visit | null;
  onClose: (shouldRefresh?: boolean) => void;
}

export default function AddEditVisitModal({
  tenantSlug,
  customerId,
  visit,
  onClose,
}: AddEditVisitModalProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [visitDate, setVisitDate] = useState(
    visit?.visitDate
      ? new Date(visit.visitDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState(visit?.notes || "");
  const [nextVisitFrom, setNextVisitFrom] = useState(visit?.nextVisitFrom || "");
  const [nextVisitTo, setNextVisitTo] = useState(visit?.nextVisitTo || "");
  const [status, setStatus] = useState<Visit["status"]>(visit?.status || "completed");
  const [services, setServices] = useState<VisitService[]>([]);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        setServicesError(null);
        const response = await fetch(`/api/services?tenant=${tenantSlug}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error("La respuesta del servidor no contiene una lista de servicios válida");
        }
        
        setAvailableServices(data.data);
      } catch (error) {
        console.error("Error fetching services:", error);
        setServicesError(error instanceof Error ? error.message : "Error al cargar los servicios");
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [tenantSlug]);

  // Efecto para inicializar los servicios de la visita después de cargar los servicios disponibles
  useEffect(() => {
    if (availableServices.length > 0 && visit && services.length === 0) {
      const visitServices = visit.services.map((s) => {
        const service = availableServices.find(avail => avail.id === s.id);
        return {
          serviceId: s.id || "",
          serviceName: service ? service.name : s.serviceName,
          description: "",
          unitPrice: s.unitPrice,
          quantity: s.quantity,
          subtotal: s.subtotal,
        };
      });
      setServices(visitServices);
    }
  }, [availableServices, visit, services.length]);

  const handleAddService = () => {
    setServices([
      ...services,
      {
        serviceId: "",
        serviceName: "",
        description: "",
        unitPrice: 0,
        quantity: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = availableServices.find((s) => s.id === serviceId);
    if (!service) return;

    const newServices = [...services];
    newServices[index] = {
      ...newServices[index],
      serviceId: service.id,
      serviceName: service.name,
      unitPrice: Number(service.price),
      subtotal: Number(service.price) * newServices[index].quantity,
    };
    setServices(newServices);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newServices = [...services];
    newServices[index].quantity = quantity;
    newServices[index].subtotal = newServices[index].unitPrice * quantity;
    setServices(newServices);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newServices = [...services];
    newServices[index].unitPrice = price;
    newServices[index].subtotal = price * newServices[index].quantity;
    setServices(newServices);
  };

  const calculateTotal = () => {
    return services.reduce((sum, service) => sum + service.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const visitData = {
        visitDate,
        totalAmount: calculateTotal(),
        notes,
        nextVisitFrom: nextVisitFrom || null,
        nextVisitTo: nextVisitTo || null,
        status,
        services: services.map((s) => ({
          serviceId: s.serviceId,
          description: s.description,
          unitPrice: s.unitPrice,
          quantity: s.quantity,
          subtotal: s.subtotal,
        })),
      };

      const url = visit
        ? `/api/tenants/${tenantSlug}/customers/${customerId}/visits/${visit.id}`
        : `/api/tenants/${tenantSlug}/customers/${customerId}/visits`;

      const method = visit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save visit");
      }

      onClose(true); // Refresh parent
    } catch (error) {
      console.error("Error saving visit:", error);
      alert(error instanceof Error ? error.message : "Error al guardar la visita");
    } finally {
      setSubmitting(false);
    }
  };

  const isLuxury = tenantSlug === 'wondernails';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className={`${isLuxury ? 'bg-[#1a1a1a] border border-[#D4AF37]/20' : 'bg-white'} rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isLuxury ? 'border-[#D4AF37]/10' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isLuxury ? 'text-[#D4AF37] font-serif tracking-wide' : 'text-gray-900'}`}>
            {visit ? "Editar Visita" : "Nueva Visita"}
          </h2>
          <button
            onClick={() => onClose()}
            className={`${isLuxury ? 'text-gray-400 hover:text-[#D4AF37]' : 'text-gray-400 hover:text-gray-500'} transition-colors`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={`block text-sm font-medium ${isLuxury ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Fecha y Hora de Atención *
              </label>
              <input
                type="datetime-local"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isLuxury 
                    ? 'bg-[#121212] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] [color-scheme:dark]' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isLuxury ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Estado *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Visit["status"])}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                  isLuxury 
                    ? 'bg-[#121212] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="pending">Pendiente</option>
                <option value="scheduled">Programada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Services */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isLuxury ? 'text-white' : 'text-gray-900'}`}>Servicios</h3>
              <button
                type="button"
                onClick={handleAddService}
                disabled={availableServices.length === 0}
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  isLuxury
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10'
                    : 'border-transparent text-blue-700 bg-blue-100 hover:bg-blue-200'
                }`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Servicio
              </button>
            </div>

            {servicesError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm mb-2">Error al cargar los servicios:</p>
                <p className="text-red-700 text-sm mb-3">{servicesError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setServicesError(null);
                    fetch(`/api/services?tenant=${tenantSlug}`)
                      .then(response => {
                        if (!response.ok) throw new Error("Failed to fetch services");
                        return response.json();
                      })
                      .then(data => {
                        setAvailableServices(data.data || []);
                        setServicesError(null);
                      })
                      .catch(err => {
                        console.error("Error retrying fetch:", err);
                        setServicesError(err instanceof Error ? err.message : "Error al cargar los servicios");
                      })
                      .finally(() => setLoading(false));
                  }}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : loading ? (
              <div className={`text-center py-8 rounded-lg border-2 border-dashed ${isLuxury ? 'bg-[#121212] border-gray-800' : 'bg-gray-50 border-gray-300'}`}>
                <p className={isLuxury ? 'text-gray-400' : 'text-gray-500'}>Cargando servicios...</p>
              </div>
            ) : availableServices.length === 0 ? (
              <div className="text-center py-8 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
                <p className="text-yellow-800 mb-2">No hay servicios disponibles</p>
                <p className="text-yellow-700 text-sm">Contacta al administrador para agregar servicios a tu catálogo</p>
              </div>
            ) : services.length === 0 ? (
              <div className={`text-center py-8 rounded-lg border-2 border-dashed ${isLuxury ? 'bg-[#121212] border-gray-800' : 'bg-gray-50 border-gray-300'}`}>
                <p className={isLuxury ? 'text-gray-400' : 'text-gray-500'}>No hay servicios agregados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className={`${isLuxury ? 'bg-[#121212]/50 border border-gray-800 rounded-lg' : 'bg-gray-50 rounded-lg'} p-4`}>
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <label className={`block text-xs font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                          Servicio
                        </label>
                        <select
                          value={service.serviceId}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                          required
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${
                            isLuxury
                              ? 'bg-[#1a1a1a] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Seleccionar servicio...</option>
                          {availableServices.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} - ${Number(s.price).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className={`block text-xs font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                          Precio
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={service.unitPrice}
                          onChange={(e) =>
                            handlePriceChange(index, parseFloat(e.target.value) || 0)
                          }
                          required
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${
                            isLuxury
                              ? 'bg-[#1a1a1a] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className={`block text-xs font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                          Cantidad
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={service.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseFloat(e.target.value) || 1)
                          }
                          required
                          min="0.01"
                          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all ${
                            isLuxury
                              ? 'bg-[#1a1a1a] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className={`block text-xs font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-700'} mb-1`}>
                          Subtotal
                        </label>
                        <div className={`px-3 py-2 border rounded-md text-sm font-medium ${
                          isLuxury
                            ? 'bg-[#121212] border-gray-700 text-[#D4AF37]'
                            : 'bg-gray-100 border-gray-300 text-gray-900'
                        }`}>
                          ${service.subtotal.toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className={`p-2 ${isLuxury ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-4 flex justify-end items-center">
              <div className={`${isLuxury ? 'bg-transparent border border-[#D4AF37]/20' : 'bg-blue-50'} px-6 py-3 rounded-lg`}>
                <span className={`text-sm font-medium ${isLuxury ? 'text-gray-300' : 'text-gray-700'} mr-4`}>Total:</span>
                <span className={`text-xl font-bold ${isLuxury ? 'text-[#D4AF37]' : 'text-blue-600'}`}>
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className={`block text-sm font-medium ${isLuxury ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                isLuxury
                  ? 'bg-[#121212] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] placeholder-gray-600'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Notas sobre la visita, tratamientos realizados, observaciones especiales..."
            />
          </div>

          {/* Next Visit */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium ${isLuxury ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Próxima Cita (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Desde
                </label>
                <input
                  type="date"
                  value={nextVisitFrom}
                  onChange={(e) => setNextVisitFrom(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                    isLuxury
                      ? 'bg-[#121212] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] [color-scheme:dark]'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium ${isLuxury ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Hasta
                </label>
                <input
                  type="date"
                  value={nextVisitTo}
                  onChange={(e) => setNextVisitTo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all ${
                    isLuxury
                      ? 'bg-[#121212] border-gray-700 text-white focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] [color-scheme:dark]'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex justify-end gap-3 pt-4 border-t ${isLuxury ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={() => onClose()}
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                isLuxury
                  ? 'border-gray-700 text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || services.length === 0}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isLuxury
                  ? 'bg-[#D4AF37] text-[#121212] hover:bg-[#b3932d] hover:shadow-lg hover:shadow-[#D4AF37]/20'
                  : 'text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300'
              }`}
            >
              {submitting ? "Guardando..." : visit ? "Guardar Cambios" : "Crear Visita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

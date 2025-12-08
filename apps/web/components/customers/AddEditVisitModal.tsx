"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/forms/FormInput";
import FormSelect from "@/components/ui/forms/FormSelect";
import FormTextarea from "@/components/ui/forms/FormTextarea";
import { cn } from "@/lib/utils";

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
        const response = await fetch(`/api/v1/public/services?tenant=${tenantSlug}`);
        
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 flex items-center justify-center p-4">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        {/* Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {visit ? "Editar Visita" : "Nueva Visita"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClose()}
              className="h-6 w-6 rounded-full p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Fecha y Hora de Atención *"
              type="datetime-local"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
            />

            <FormSelect
              label="Estado *"
              value={status}
              onChange={(e) => setStatus(e.target.value as Visit["status"])}
              required
              options={[
                { value: "pending", label: "Pendiente" },
                { value: "scheduled", label: "Programada" },
                { value: "completed", label: "Completada" },
                { value: "cancelled", label: "Cancelada" },
              ]}
            />
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Servicios</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddService}
                disabled={availableServices.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Servicio
              </Button>
            </div>

            {servicesError ? (
              <div className="bg-destructive/15 border-destructive/50 text-destructive p-4 rounded-md mb-4 flex flex-col items-start gap-2">
                <p className="text-sm font-medium">Error al cargar los servicios:</p>
                <p className="text-sm">{servicesError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    setServicesError(null);
                    fetch(`/api/v1/public/services?tenant=${tenantSlug}`)
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
                >
                  Reintentar
                </Button>
              </div>
            ) : loading ? (
              <div className="text-center py-8 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Cargando servicios...</p>
              </div>
            ) : availableServices.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg border-2 border-dashed">
                <p className="text-foreground font-medium mb-2">No hay servicios disponibles</p>
                <p className="text-muted-foreground text-sm">Contacta al administrador para agregar servicios a tu catálogo</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">No hay servicios agregados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-4 border">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <FormSelect
                          label="Servicio"
                          value={service.serviceId}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                          required
                          placeholder="Seleccionar servicio..."
                          options={availableServices.map((s) => ({
                            value: s.id,
                            label: `${s.name} - $${Number(s.price).toFixed(2)}`
                          }))}
                          selectClassName="text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <FormInput
                          label="Precio"
                          type="number"
                          step="0.01"
                          value={service.unitPrice}
                          onChange={(e) =>
                            handlePriceChange(index, parseFloat(e.target.value) || 0)
                          }
                          required
                          inputClassName="text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <FormInput
                          label="Cantidad"
                          type="number"
                          step="0.01"
                          value={service.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, parseFloat(e.target.value) || 1)
                          }
                          required
                          min={0.01}
                          inputClassName="text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Subtotal
                        </label>
                        <div className="px-3 py-2 border rounded-md text-sm font-medium bg-secondary text-secondary-foreground">
                          ${service.subtotal.toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-1 flex items-end pt-7">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveService(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-4 flex justify-end items-center">
              <div className="bg-primary/5 px-6 py-3 rounded-lg border border-primary/10">
                <span className="text-sm font-medium mr-4">Total:</span>
                <span className="text-xl font-bold text-primary">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <FormTextarea
            label="Observaciones"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notas sobre la visita, tratamientos realizados, observaciones especiales..."
          />

          {/* Next Visit */}
          <div>
            <h3 className="text-sm font-medium mb-3">Próxima Cita (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Desde"
                type="date"
                value={nextVisitFrom}
                onChange={(e) => setNextVisitFrom(e.target.value)}
              />
              <FormInput
                label="Hasta"
                type="date"
                value={nextVisitTo}
                onChange={(e) => setNextVisitTo(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || services.length === 0}
            >
              {submitting ? "Guardando..." : visit ? "Guardar Cambios" : "Crear Visita"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

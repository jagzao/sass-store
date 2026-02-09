"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/forms/FormInput";
import FormSelect from "@/components/ui/forms/FormSelect";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import FormTextarea from "@/components/ui/forms/FormTextarea";
import { QuantityControl } from "@/components/ui/forms/QuantityControl";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import VisitPhotosUpload, { VisitPhoto } from "./VisitPhotosUpload";

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
  photos?: {
    id?: string;
    url: string;
    type: "BEFORE" | "AFTER";
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
  const [visitDate, setVisitDate] = useState<Date>(
    visit?.visitDate ? new Date(visit.visitDate) : new Date(),
  );
  const [notes, setNotes] = useState(visit?.notes || "");
  const [nextVisitFrom, setNextVisitFrom] = useState(
    visit?.nextVisitFrom || "",
  );
  const [nextVisitTo, setNextVisitTo] = useState(visit?.nextVisitTo || "");
  const [status, setStatus] = useState<Visit["status"]>(
    visit?.status || "completed",
  );
  const [services, setServices] = useState<VisitService[]>([]);
  const [photos, setPhotos] = useState<VisitPhoto[]>([]);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        setServicesError(null);
        const response = await fetch(
          `/api/v1/public/services?tenant=${tenantSlug}`,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
          throw new Error(
            "La respuesta del servidor no contiene una lista de servicios válida",
          );
        }

        setAvailableServices(data.data);
      } catch (error) {
        console.error("Error fetching services:", error);
        setServicesError(
          error instanceof Error
            ? error.message
            : "Error al cargar los servicios",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [tenantSlug]);

  useEffect(() => {
    if (availableServices.length > 0 && visit && services.length === 0) {
      const visitServices = visit.services.map((s) => {
        const service = availableServices.find(
          (avail) => avail.id === s.id || avail.name === s.serviceName,
        );
        return {
          serviceId: service ? service.id : s.id,
          serviceName: service ? service.name : s.serviceName,
          description: "",
          unitPrice: s.unitPrice,
          quantity: s.quantity,
          subtotal: s.subtotal,
        };
      });
      setServices(visitServices);
    }

    if (visit && visit.photos && photos.length === 0) {
      setPhotos(
        visit.photos.map((p) => ({
          url: p.url,
          type: p.type,
        })),
      );
    }
  }, [availableServices, visit]);

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
        visitDate: visitDate.toISOString(),
        totalAmount: calculateTotal(),
        notes,
        nextVisitFrom: nextVisitFrom || null,
        nextVisitTo: nextVisitTo || null,
        status,
        photos: photos.map((p) => ({ url: p.url, type: p.type })),
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

      onClose(true);
    } catch (error) {
      console.error("Error saving visit:", error);
      alert(
        error instanceof Error ? error.message : "Error al guardar la visita",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Luxury / Sanitized visual logic
  const GOLD_COLOR = "#C5A059";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => onClose()} 
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-50 w-full max-w-4xl max-h-[90vh] flex flex-col bg-white",
          "border border-[rgba(197,160,89,0.3)] shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
          "rounded-xl overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(197,160,89,0.15)] bg-white shrink-0">
          <h2 className="text-xl font-serif font-bold text-[#C5A059] uppercase tracking-wide">
            {visit ? "Editar Visita" : "Nueva Visita"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClose()}
            className="rounded-full hover:bg-[rgba(197,160,89,0.1)] text-[#C5A059] transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8">
          <form id="visit-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Grid for General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 {/* Custom styling wrapper for inputs to enforce light gray bg */}
                 <div className="[&_input]:bg-[#F9F9F9] [&_input]:border-gray-200 [&_input]:rounded-[8px] [&_input:focus]:border-[#C5A059] [&_label]:text-[#333333]">
                   <DateTimePicker
                      label="Fecha y Hora de Atención *"
                      date={visitDate}
                      setDate={setVisitDate}
                      className="bg-champagne hover:bg-champagne/80 text-dark-graphite border-champagne"
                   />
                 </div>
              </div>

              <div className="space-y-1.5">
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
                  // Apply custom styling via className/styles if supported, 
                  // or rely on the parent wrapper if FormSelect spreads styles deeply enough.
                  // Since FormSelect might have its own classes, we might need a wrapper.
                  className="bg-[#F9F9F9] border-gray-200 rounded-[8px] focus:ring-[#C5A059] focus:border-[#C5A059] text-[#333333]"
                  labelClassName="text-[#333333]"
                />
              </div>
            </div>

            {/* Services Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-medium text-[#C5A059]">Servicios</h3>
                <Button
                  type="button"
                  onClick={handleAddService}
                  disabled={availableServices.length === 0}
                  className="bg-transparent border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white transition-all rounded-[8px]"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Servicio
                </Button>
              </div>

              {/* Service Grid Area */}
              <div className="min-h-[100px]">
                {loading ? (
                  <div className="flex justify-center p-8 border border-dashed border-[#C5A059]/30 rounded-[8px] bg-[#F9F9F9]">
                    <p className="text-[#C5A059] animate-pulse">Cargando catálogo...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#C5A059]/40 rounded-[8px] bg-[rgba(197,160,89,0.03)]">
                    <p className="text-[#333333] mb-2 font-medium">No hay servicios agregados</p>
                    <p className="text-gray-500 text-sm">Añade los servicios realizados en esta visita.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm hover:border-[#C5A059]/30 transition-colors relative group"
                      >
                         {/* Remove button absolute top-right for mobile friendliness or keep inline? User asked for responsive. 
                             Inline is often safer for complex rows. Let's keep existing grid structure but sanitize styles. */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="col-span-1 md:col-span-5">
                            {/* Force white/gray inputs */}
                            <div className="[&_input]:bg-[#F9F9F9] [&_div[class*='control']]:bg-[#F9F9F9] [&_div[class*='control']]:border-gray-200 [&_div[class*='control']]:rounded-[8px]">
                                <SearchableSelect
                                label="Servicio"
                                value={service.serviceId}
                                onChange={(val: any) =>
                                    handleServiceChange(index, val?.value || "")
                                }
                                required
                                placeholder="Seleccionar servicio..."
                                options={availableServices.map((s) => ({
                                    value: s.id,
                                    label: `${s.name} - $${Number(s.price).toFixed(2)}`,
                                }))}
                                menuPortalTarget={
                                    typeof document !== "undefined"
                                    ? document.body
                                    : undefined
                                }
                                className="text-sm"
                                labelClassName="text-[#333333]"
                                />
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2">
                             <div className="[&_input]:bg-[#F9F9F9] [&_input]:border-gray-200 [&_input]:rounded-[8px]">
                                <FormInput
                                label="Precio"
                                type="number"
                                step="0.01"
                                value={service.unitPrice}
                                onChange={(e) =>
                                    handlePriceChange(
                                    index,
                                    parseFloat(e.target.value) || 0,
                                    )
                                }
                                required
                                inputClassName="text-sm text-[#333333]"
                                labelClassName="text-[#333333]"
                                />
                             </div>
                          </div>

                          <div className="col-span-1 md:col-span-2">
                            <QuantityControl
                                label="Cantidad"
                                value={service.quantity}
                                onChange={(value) =>
                                handleQuantityChange(index, value)
                                }
                                min={1}
                                size="sm"
                                // Assuming QuantityControl accepts className or we wrap it logic needed
                            />
                             {/* Note: QuantityControl might contain internal styles we can't easily override without verification, but usually it respects standard input styles if global. */}
                          </div>

                          <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-[#333333] mb-1">
                                Subtotal
                            </label>
                            <div className="px-3 py-2 border border-gray-200 rounded-[8px] text-sm font-bold bg-[#333333] text-white">
                                ${service.subtotal.toFixed(2)}
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center pt-0 md:pt-7">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveService(index)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

               {/* Total - Highlighted */}
               {services.length > 0 && (
                <div className="flex justify-end mt-2">
                    <div className="flex items-center gap-4 bg-[rgba(197,160,89,0.1)] px-6 py-4 rounded-[8px] border border-[#C5A059]/20">
                        <span className="text-sm text-[#333333] uppercase tracking-wide">Total Estimado</span>
                        <span className="text-2xl font-serif font-bold text-[#C5A059]">
                            ${calculateTotal().toFixed(2)}
                        </span>
                    </div>
                </div>
               )}
            </div>

            {/* Observations */}
            <div className="[&_textarea]:bg-[#F9F9F9] [&_textarea]:border-gray-200 [&_textarea]:rounded-[8px] [&_textarea:focus]:border-[#C5A059]">
              <FormTextarea
                label="Observaciones"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Notas técnicas, preferencias del cliente, etc..."
                labelClassName="text-[#333333]"
              />
            </div>

            {/* Next Visit / Optional */}
            <div className="pt-4 border-t border-gray-100">
               <h3 className="text-md font-serif text-[#C5A059] mb-4">Próxima Cita (Opcional)</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="[&_input]:bg-[#F9F9F9] [&_input]:border-gray-200 [&_input]:rounded-[8px]">
                    <FormInput
                        label="Desde"
                        type="date"
                        value={nextVisitFrom}
                        onChange={(e) => setNextVisitFrom(e.target.value)}
                        labelClassName="text-[#333333]"
                    />
                 </div>
                 <div className="[&_input]:bg-[#F9F9F9] [&_input]:border-gray-200 [&_input]:rounded-[8px]">
                    <FormInput
                        label="Hasta"
                        type="date"
                        value={nextVisitTo}
                        onChange={(e) => setNextVisitTo(e.target.value)}
                         labelClassName="text-[#333333]"
                    />
                 </div>
               </div>
            </div>

            {/* Photos */}
            <div className="pt-4 border-t border-gray-100">
               <h3 className="text-md font-serif text-[#C5A059] mb-4">Evidencia Fotográfica</h3>
               <VisitPhotosUpload photos={photos} onChange={setPhotos} />
            </div>

            {/* Spacer for sticky footer */}
            <div className="h-20 md:h-0" />
            
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-4 bg-white border-t border-gray-100 flex flex-col-reverse md:flex-row justify-end gap-3 z-20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              className="w-full md:w-auto h-[44px] border-gray-300 text-gray-600 hover:bg-gray-50 rounded-[8px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="visit-form"
              disabled={submitting || services.length === 0}
              className={cn(
                  "w-full md:w-auto h-[44px] text-white font-medium rounded-[8px] shadow-lg",
                  "bg-[#C5A059] hover:bg-[#b08d4b] transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {submitting ? "Guardando..." : visit ? "Guardar Cambios" : "Crear Visita"}
            </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, MessageCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/forms/FormInput";
import FormSelect from "@/components/ui/forms/FormSelect";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import FormTextarea from "@/components/ui/forms/FormTextarea";
import { QuantityControl } from "@/components/ui/forms/QuantityControl";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import VisitPhotosUpload, { VisitPhoto } from "./VisitPhotosUpload";
import QuoteSuccessModal from "@/components/quotes/QuoteSuccessModal";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface VisitService {
  serviceId: string;
  serviceName?: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface VisitProduct {
  productId: string;
  productName?: string;
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
  products?: {
    id: string; // productId
    productName: string;
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
  customerId?: string;
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
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Quote State
  const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<any>(null);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [generatingWhatsApp, setGeneratingWhatsApp] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const getOffsetDateString = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  // Form state
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId || "");

  const [visitDate, setVisitDate] = useState<Date>(
    visit?.visitDate ? new Date(visit.visitDate) : new Date(),
  );
  const [notes, setNotes] = useState(visit?.notes || "");
  const [nextVisitFrom, setNextVisitFrom] = useState(
    visit?.nextVisitFrom || (!visit ? getOffsetDateString(15) : ""),
  );
  const [nextVisitTo, setNextVisitTo] = useState(
    visit?.nextVisitTo || (!visit ? getOffsetDateString(20) : ""),
  );
  const [status, setStatus] = useState<Visit["status"]>(
    visit?.status || "scheduled",
  );
  const [services, setServices] = useState<VisitService[]>([]);
  const [products, setProducts] = useState<VisitProduct[]>([]);
  const [photos, setPhotos] = useState<VisitPhoto[]>([]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    async function fetchProducts() {
        try {
          // Don't set global loading true here to avoid flickering if one finishes before other, 
          // or handle it smarter. For now, valid to just let them run.
          // setProductsError(null);
          const response = await fetch(
            `/api/v1/public/products?tenant=${tenantSlug}`,
          );
  
          if (!response.ok) return; // Silent fail or handle
  
          const data = await response.json();
  
          if (data.data && Array.isArray(data.data)) {
            setAvailableProducts(data.data);
          }
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      }

    async function fetchCustomers() {
      if (customerId) return;
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}/customers`);
        if (response.ok) {
           const data = await response.json();
           setAvailableCustomers(data.customers || []);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    }

    fetchServices();
    fetchProducts();
    fetchCustomers();
  }, [tenantSlug, customerId]);

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

    if (availableProducts.length > 0 && visit && visit.products && products.length === 0) {
        const visitProducts = visit.products.map((p) => {
            const product = availableProducts.find(
              (avail) => avail.id === p.id || avail.name === p.productName,
            );
            return {
              productId: product ? product.id : p.id,
              productName: product ? product.name : p.productName,
              description: "",
              unitPrice: p.unitPrice,
              quantity: p.quantity,
              subtotal: p.subtotal,
            };
          });
          setProducts(visitProducts);
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

  // Products handlers
  const handleAddProduct = () => {
    setProducts([
      ...products,
      {
        productId: "",
        productName: "",
        description: "",
        unitPrice: 0,
        quantity: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = availableProducts.find((p) => p.id === productId);
    if (!product) return;

    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      productId: product.id,
      productName: product.name,
      unitPrice: Number(product.price),
      subtotal: Number(product.price) * newProducts[index].quantity,
    };
    setProducts(newProducts);
  };

  const handleProductQuantityChange = (index: number, quantity: number) => {
    const newProducts = [...products];
    newProducts[index].quantity = quantity;
    newProducts[index].subtotal = newProducts[index].unitPrice * quantity;
    setProducts(newProducts);
  };

  const handleProductPriceChange = (index: number, price: number) => {
    const newProducts = [...products];
    newProducts[index].unitPrice = price;
    newProducts[index].subtotal = price * newProducts[index].quantity;
    setProducts(newProducts);
  };

  const calculateTotal = () => {
    const servicesTotal = services.reduce((sum, service) => sum + ((Number(service.unitPrice) || 0) * (Number(service.quantity) || 1)), 0);
    const productsTotal = products.reduce((sum, product) => sum + ((Number(product.unitPrice) || 0) * (Number(product.quantity) || 1)), 0);
    return servicesTotal + productsTotal;
  };

  const handleCreateQuote = async () => {
    if (services.length === 0 && products.length === 0) {
      alert("Agrega al menos un servicio o producto para crear una cotización.");
      return;
    }

    setCreatingQuote(true);
    try {
      const quoteData = {
        customerName: "Cliente Temporal", // Will be updated with fetched data
        customerEmail: "",
        customerPhone: "", 
        totalAmount: calculateTotal(),
        notes,
        validityDays: 15,
        items: [
          ...services.map((s) => ({
            type: "service",
            itemId: s.serviceId,
            name: s.serviceName || "Servicio",
            description: s.description,
            unitPrice: s.unitPrice,
            quantity: s.quantity,
            subtotal: s.subtotal,
          })),
          ...products.map((p) => ({
            type: "product",
            itemId: p.productId,
            name: p.productName || "Producto",
            description: p.description,
            unitPrice: p.unitPrice,
            quantity: p.quantity,
            subtotal: p.subtotal,
          })),
        ],
      };

      // Fetch customer data
      if (customerId) {
        try {
          const customerRes = await fetch(`/api/tenants/${tenantSlug}/customers/${customerId}`);
          if(customerRes.ok){
              const customer = await customerRes.json();
              quoteData.customerName = customer.name;
              quoteData.customerEmail = customer.email;
              quoteData.customerPhone = customer.phone;
          }
        } catch (e) {
          console.error("Error fetching customer info", e);
        }
      }

      const response = await fetch(`/api/tenants/${tenantSlug}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create quote");
      }

      const newQuote = await response.json();
      setCreatedQuote(newQuote);
      setShowQuoteSuccess(true);
      
    } catch (error) {
      console.error("Error creating quote:", error);
      alert(error instanceof Error ? error.message : "Error al crear la cotización");
    } finally {
      setCreatingQuote(false);
    }
  };

  const handleWhatsAppQuote = async () => {
    if (services.length === 0 && products.length === 0) {
      alert("Agrega al menos un servicio o producto para enviar por WhatsApp.");
      return;
    }

    setGeneratingWhatsApp(true);
    try {
      let customerName = "Cliente";
      let customerPhone = "";

      if (customerId) {
        try {
          const customerRes = await fetch(`/api/tenants/${tenantSlug}/customers/${customerId}`);
          if(customerRes.ok){
              const data = await customerRes.json();
              if (data.customer) {
                customerName = data.customer.name;
                customerPhone = data.customer.phone;
              }
          }
        } catch (e) {
          console.error("Error fetching customer info", e);
        }
      }

      if (!customerPhone) {
        setWhatsappError("Este cliente no tiene un número de teléfono registrado. Por favor, edita su perfil para añadirlo antes de enviar la cotización.");
        setGeneratingWhatsApp(false);
        return;
      }

      const phone = customerPhone.replace(/\D/g, "");
      
      let message = `Hola ${customerName}, aquí tienes el detalle de tu cotización.\n\n`;
      message += `*Detalle:*\n`;
      services.forEach(s => {
          if (s.serviceId) message += `- ${s.serviceName || "Servicio"} (x${s.quantity}): $${Number(s.unitPrice).toFixed(2)}\n`;
      });
      products.forEach(p => {
          if (p.productId) message += `- ${p.productName || "Producto"} (x${p.quantity}): $${Number(p.unitPrice).toFixed(2)}\n`;
      });
      message += `\n*Total estimado: $${calculateTotal().toFixed(2)}*`;

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    } catch (error) {
      console.error("Error generating WhatsApp link:", error);
      alert("Error al generar el mensaje de WhatsApp");
    } finally {
      setGeneratingWhatsApp(false);
    }
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
          unitPrice: Number(s.unitPrice) || 0,
          quantity: Number(s.quantity) || 1,
          subtotal: (Number(s.unitPrice) || 0) * (Number(s.quantity) || 1),
        })),
        products: products.map((p) => ({
            productId: p.productId,
            description: p.description,
            unitPrice: Number(p.unitPrice) || 0,
            quantity: Number(p.quantity) || 1,
            subtotal: (Number(p.unitPrice) || 0) * (Number(p.quantity) || 1),
        })),
      };

      const targetCustomerId = customerId || selectedCustomerId;
      if (!targetCustomerId) {
        alert("Por favor selecciona un cliente para la visita.");
        setSubmitting(false);
        return;
      }

      const url = visit
        ? `/api/tenants/${tenantSlug}/customers/${targetCustomerId}/visits/${visit.id}`
        : `/api/tenants/${tenantSlug}/customers/${targetCustomerId}/visits`;

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

  if (!isMounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 z-[90]" 
        onClick={() => onClose()} 
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-[100] w-full max-w-4xl max-h-[90vh] flex flex-col bg-white",
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
              {!customerId && (
                <div className="space-y-1.5 md:col-span-2">
                   <div className="[&_input]:bg-[#F9F9F9] [&_div[class*='control']]:bg-[#F9F9F9] [&_div[class*='control']]:border-gray-200 [&_div[class*='control']]:rounded-[8px]">
                     <SearchableSelect
                        label="Cliente *"
                        value={selectedCustomerId}
                        onChange={(val: any) => setSelectedCustomerId(val?.value || "")}
                        required
                        placeholder="Buscar y seleccionar cliente..."
                        options={availableCustomers.map((c) => ({
                            value: c.id,
                            label: `${c.name} - ${c.phone || c.email || "Sin datos extra"}`,
                        }))}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                        className="text-sm"
                        labelClassName="text-[#333333]"
                     />
                   </div>
                </div>
              )}
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
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={availableProducts.length === 0}
                  className="bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-black transition-all rounded-[8px] ml-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Productos
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
                                ${((Number(service.unitPrice) || 0) * (Number(service.quantity) || 1)).toFixed(2)}
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

               {/* Products Grid Area */}
               {products.length > 0 && (
                 <div className="mt-8">
                    <h3 className="text-lg font-serif font-medium text-[#C5A059] mb-4">Productos</h3>
                    <div className="space-y-3">
                        {products.map((product, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-100 rounded-[8px] p-4 shadow-sm hover:border-[#C5A059]/30 transition-colors relative group"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="col-span-1 md:col-span-5">
                                <div className="[&_input]:bg-[#F9F9F9] [&_div[class*='control']]:bg-[#F9F9F9] [&_div[class*='control']]:border-gray-200 [&_div[class*='control']]:rounded-[8px]">
                                    <SearchableSelect
                                    label="Producto"
                                    value={product.productId}
                                    onChange={(val: any) =>
                                        handleProductChange(index, val?.value || "")
                                    }
                                    required
                                    placeholder="Seleccionar producto..."
                                    options={availableProducts.map((p) => ({
                                        value: p.id,
                                        label: `${p.name} - $${Number(p.price).toFixed(2)}`,
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
                                    value={product.unitPrice}
                                    onChange={(e) =>
                                        handleProductPriceChange(
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
                                    value={product.quantity}
                                    onChange={(value) =>
                                    handleProductQuantityChange(index, value)
                                    }
                                    min={1}
                                    size="sm"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-[#333333] mb-1">
                                    Subtotal
                                </label>
                                <div className="px-3 py-2 border border-gray-200 rounded-[8px] text-sm font-bold bg-[#333333] text-white">
                                    ${((Number(product.unitPrice) || 0) * (Number(product.quantity) || 1)).toFixed(2)}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center pt-0 md:pt-7">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveProduct(index)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                 </div>
               )}

               {/* Total - Highlighted */}
               {(services.length > 0 || products.length > 0) && (
                <div className="flex justify-end mt-6 mb-2">
                    <div className="flex items-center gap-4 bg-[rgba(197,160,89,0.1)] px-6 py-4 rounded-[8px] border border-[#C5A059]/20 shadow-sm">
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
               <h3 className="text-md font-serif text-[#C5A059] mb-4">Diseño</h3>
               <VisitPhotosUpload photos={photos} onChange={setPhotos} />
            </div>

            {/* Spacer for sticky footer */}
            <div className="h-20 md:h-0" />
            
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-4 bg-white border-t border-gray-100 flex flex-col-reverse md:flex-row justify-between gap-3 z-20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              className="w-full md:w-auto h-[44px] border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-[8px] font-medium shadow-sm transition-colors"
            >
              Cancelar
            </Button>

            <div className="flex flex-col-reverse md:flex-row gap-3 w-full md:w-auto justify-end">
              {!visit && (
                <>
                  <Button
                    type="button"
                    onClick={handleWhatsAppQuote}
                    disabled={submitting || creatingQuote || generatingWhatsApp || (services.length === 0 && products.length === 0)}
                    className="w-full md:w-[44px] h-[44px] bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center rounded-[8px] p-0 shadow-sm transition-colors"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateQuote}
                    disabled={submitting || creatingQuote || generatingWhatsApp || (services.length === 0 && products.length === 0)}
                    className={cn(
                      "w-full md:w-auto h-[44px] text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 font-medium rounded-[8px] flex items-center justify-center gap-2 transition-colors shadow-sm",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <Save className="w-4 h-4" />
                    {creatingQuote ? "Cotizando..." : "Cotización"}
                  </Button>
                </>
              )}

              <Button
                type="submit"
                form="visit-form"
                disabled={submitting || creatingQuote || (services.length === 0 && products.length === 0)}
                className={cn(
                    "w-full md:w-auto h-[44px] text-white font-medium rounded-[8px] flex items-center justify-center gap-2 shadow-sm",
                    "bg-[#C5A059] hover:bg-[#b08d4b] transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Save className="w-4 h-4" />
                {submitting ? "Guardando..." : visit ? "Guardar Cambios" : "Visita"}
              </Button>
            </div>
        </div>
      </div>

      {showQuoteSuccess && createdQuote && (
        <QuoteSuccessModal 
            isOpen={showQuoteSuccess}
            onClose={() => {
                setShowQuoteSuccess(false);
                onClose(true); 
            }}
            tenantSlug={tenantSlug}
            quote={createdQuote}
        />
      )}

      {/* WhatsApp Error Modal */}
      {whatsappError && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setWhatsappError(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aviso</h3>
            <p className="text-sm text-gray-600 mb-6">{whatsappError}</p>
            <Button
              onClick={() => setWhatsappError(null)}
              className="w-full bg-[#C5A059] hover:bg-[#b08d4b] text-white rounded-[8px]"
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

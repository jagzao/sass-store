"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/forms/FormInput";
import { cn } from "@/lib/utils";
import {
  calculateNailQuote,
  formatNailQuoteDuration,
  formatNailQuotePrice,
  NailQuoteLine,
} from "@sass-store/core/src/services/nail-quote/calculate";
import { normalizeWhatsAppPhone } from "@/lib/customers/visit-utils";

interface CatalogOption {
  id: string;
  category: "material" | "length" | "shape" | "addon";
  key: string;
  label: string;
  basePrice: number;
  baseDurationMinutes: number;
  imageUrl?: string;
  order: number;
}

interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
}

interface NailQuoterModalProps {
  tenantSlug: string;
  customerId?: string;
  onClose: (shouldRefresh?: boolean) => void;
}

const CATEGORIES: { key: CatalogOption["category"]; label: string }[] = [
  { key: "material", label: "Material" },
  { key: "length", label: "Largo" },
  { key: "shape", label: "Forma" },
  { key: "addon", label: "Adornos" },
];

export default function NailQuoterModal({
  tenantSlug,
  customerId,
  onClose,
}: NailQuoterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [catalog, setCatalog] = useState<CatalogOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customerId || "",
  );
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submitting, setSubmitting] = useState<"whatsapp" | "reserve" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const res = await fetch(
          `/api/tenants/${tenantSlug}/nail-quote-options`,
        );
        if (!res.ok) throw new Error("Error al cargar el catalogo");
        const json = await res.json();
        setCatalog(json.data || []);
      } catch (err) {
        setCatalogError(
          err instanceof Error ? err.message : "Error desconocido",
        );
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, [tenantSlug]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch(
          `/api/tenants/${tenantSlug}/customers?limit=200`,
        );
        if (!res.ok) throw new Error("Error al cargar clientes");
        const json = await res.json();
        setCustomers(
          (json.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          })),
        );
      } catch {
        // Non-blocking: manual phone still works
      }
    }
    loadCustomers();
  }, [tenantSlug]);

  useEffect(() => {
    if (customerId) setSelectedCustomerId(customerId);
  }, [customerId]);

  const toggleOption = useCallback(
    (option: CatalogOption) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (option.category === "addon") {
          if (next.has(option.id)) next.delete(option.id);
          else next.add(option.id);
        } else {
          // Replace same-category selection
          catalog
            .filter((o) => o.category === option.category)
            .forEach((o) => next.delete(o.id));
          next.add(option.id);
        }
        return next;
      });
    },
    [catalog],
  );

  const selectedOptions = useMemo(
    () => catalog.filter((o) => selectedIds.has(o.id)),
    [catalog, selectedIds],
  );

  const catalogForCalc = useMemo(
    () =>
      catalog.map((o) => ({
        ...o,
        tenantId: "",
        isActive: true,
      })),
    [catalog],
  );

  const calculation = useMemo(() => {
    const result = calculateNailQuote(Array.from(selectedIds), catalogForCalc);
    return result.success ? result.data : null;
  }, [selectedIds, catalogForCalc]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const canSubmit = calculation && selectedOptions.length > 0;
  const hasDestination = selectedCustomerId || newCustomerPhone.trim();

  const handleWhatsApp = async () => {
    if (!canSubmit) {
      setError("Selecciona material, largo y forma para continuar");
      return;
    }
    if (!hasDestination) {
      setError(
        "Selecciona un cliente o escribe un telefono para enviar la cotizacion",
      );
      return;
    }
    setSubmitting("whatsapp");
    setError(null);
    try {
      const idempotencyKey = `nq-${tenantSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch(`/api/tenants/${tenantSlug}/nail-quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || undefined,
          customerName: selectedCustomerId ? undefined : newCustomerName,
          customerPhone: selectedCustomerId ? undefined : newCustomerPhone,
          selectedOptionIds: Array.from(selectedIds),
          idempotencyKey,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Error al crear la cotizacion");
        setSubmitting(null);
        return;
      }
      if (json.data.whatsappUrl) {
        window.open(json.data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      setSuccess("Cotizacion enviada por WhatsApp");
      setTimeout(() => onClose(true), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
      setSubmitting(null);
    }
  };

  const handleReserve = async () => {
    if (!canSubmit) {
      setError("Selecciona material, largo y forma para continuar");
      return;
    }
    if (!startTime) {
      setError("Selecciona fecha y hora para la cita");
      return;
    }
    if (!hasDestination) {
      setError("Selecciona un cliente o escribe un telefono para reservar");
      return;
    }
    setSubmitting("reserve");
    setError(null);
    try {
      const idempotencyKey = `nb-${tenantSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch(`/api/tenants/${tenantSlug}/nail-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId || undefined,
          customerName: selectedCustomerId ? undefined : newCustomerName,
          customerPhone: selectedCustomerId ? undefined : newCustomerPhone,
          selectedOptionIds: Array.from(selectedIds),
          startTime,
          idempotencyKey,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || "Error al reservar la cita");
        setSubmitting(null);
        return;
      }
      setSuccess("Cita reservada. Se envio confirmacion por WhatsApp.");
      setTimeout(() => onClose(true), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reservar");
      setSubmitting(null);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch),
  );

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-rose-900">
              Cotizador de Uñas
            </h2>
            <p className="text-sm text-rose-700">
              Wondernails · disena tu look
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onClose(false)}>
            <X className="h-5 w-5 text-rose-800" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer selector */}
          <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-rose-900">
              <User className="h-4 w-4" /> Cliente
            </div>
            {customerId && selectedCustomer ? (
              <div className="text-sm text-gray-700">
                {selectedCustomer.name} · {selectedCustomer.phone}
              </div>
            ) : (
              <>
                <FormInput
                  type="search"
                  placeholder="Buscar cliente existente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  inputClassName="w-full"
                />
                {customerSearch && filteredCustomers.length > 0 && (
                  <ul className="max-h-32 overflow-auto rounded-lg border border-pink-100 bg-white text-sm">
                    {filteredCustomers.slice(0, 8).map((c) => (
                      <li
                        key={c.id}
                        className={cn(
                          "cursor-pointer px-3 py-2 hover:bg-pink-50",
                          selectedCustomerId === c.id && "bg-pink-100",
                        )}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setNewCustomerPhone("");
                          setNewCustomerName("");
                          setCustomerSearch(c.name);
                        }}
                      >
                        {c.name} · {c.phone}
                      </li>
                    ))}
                  </ul>
                )}
                {!selectedCustomerId && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-pink-100">
                    <FormInput
                      placeholder="Nombre cliente nuevo"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <FormInput
                      placeholder="Telefono"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {loadingCatalog ? (
            <p className="text-center text-gray-500">Cargando catalogo...</p>
          ) : catalogError ? (
            <p className="text-center text-red-600">{catalogError}</p>
          ) : (
            <>
              {CATEGORIES.map(({ key, label }) => (
                <section key={key}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose-800">
                    {label}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {catalog
                      .filter((o) => o.category === key)
                      .sort((a, b) => a.order - b.order)
                      .map((option) => {
                        const selected = selectedIds.has(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleOption(option)}
                            className={cn(
                              "relative rounded-xl border p-3 text-left transition-all",
                              selected
                                ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200"
                                : "border-gray-200 bg-white hover:border-rose-200",
                            )}
                          >
                            {option.imageUrl && (
                              <img
                                src={option.imageUrl}
                                alt={option.label}
                                className="mb-2 h-16 w-full rounded-lg object-cover"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatNailQuotePrice(option.basePrice)} ·{" "}
                              {option.baseDurationMinutes > 0
                                ? `${option.baseDurationMinutes} min`
                                : "-"}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </section>
              ))}
            </>
          )}

          {/* Summary panel */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
            <button
              type="button"
              onClick={() => setSummaryOpen((s) => !s)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-rose-900">
                  {calculation ? formatNailQuotePrice(calculation.total) : "$0"}
                </span>
                <span className="text-sm text-rose-700">
                  {calculation
                    ? formatNailQuoteDuration(calculation.durationMinutes)
                    : "0 min"}
                </span>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-rose-700">
                Ver resumen{" "}
                {summaryOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>
            {summaryOpen && calculation && (
              <div className="mt-3 space-y-1 border-t border-rose-100 pt-3">
                {calculation.lines.map((line) => (
                  <div
                    key={line.optionId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">{line.label}</span>
                    <span className="font-medium text-gray-900">
                      {formatNailQuotePrice(line.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date/time for reservation */}
          <div className="rounded-xl border border-pink-100 bg-pink-50/30 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-rose-900">
              <Calendar className="h-4 w-4" /> Fecha y hora de la cita
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-2 w-full rounded-lg border border-pink-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 border-green-500 text-green-700 hover:bg-green-50"
              onClick={handleWhatsApp}
              disabled={!canSubmit || !hasDestination || submitting !== null}
            >
              {submitting === "whatsapp" ? "Enviando..." : "WhatsApp"}
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-rose-400 to-rose-600 text-white hover:from-rose-500 hover:to-rose-700"
              onClick={handleReserve}
              disabled={
                !canSubmit ||
                !startTime ||
                !hasDestination ||
                submitting !== null
              }
            >
              {submitting === "reserve" ? "Reservando..." : "Reservar"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

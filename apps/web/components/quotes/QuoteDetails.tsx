"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  termsConditions?: string;
  status: "pending" | "accepted" | "rejected" | "expired" | "converted";
  createdAt: string;
  expiresAt: string;
  price: string;
  duration?: number;
  service: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
  };
}

export default function QuoteDetails({
  tenantSlug,
  quoteId,
}: {
  tenantSlug: string;
  quoteId: string;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/quotes/${quoteId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
      } else {
        toast.error("Error al cargar la cotización");
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/quotes/${quoteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        toast.success("Estado actualizado correctamente");
        fetchQuote();
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error de conexión");
    }
  };

  const handleConvertToService = async () => {
    if (!confirm("¿Convertir esta cotización en un nuevo servicio activo?")) {
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/quotes/${quoteId}/convert-to-service`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        toast.success("Cotización convertida en servicio exitosamente");
        fetchQuote(); // Refresh to see status change
        // Optionally redirect to services list
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al convertir cotización");
      }
    } catch (error) {
      console.error("Error converting quote:", error);
      toast.error("Error de conexión");
    } finally {
      setIsConverting(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!quote || !quote.customerPhone) return null;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    // Note: Public viewing link not yet implemented, using generic message
    const message = `Hola ${quote.customerName}, aquí tienes los detalles de tu cotización ${quote.quoteNumber} para ${quote.service.name}. Precio: $${quote.price}.`;

    return `https://wa.me/${quote.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "converted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center animate-pulse">Cargando detalles...</div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center text-red-500">
        Cotización no encontrada
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Cotización #{quote.quoteNumber}
          </h2>
          <p className="text-gray-500 mt-1">
            Creada el{" "}
            {format(new Date(quote.createdAt), "dd 'de' MMMM, yyyy", {
              locale: es,
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-4 py-1 rounded-full text-sm font-semibold border ${getStatusColor(
              quote.status,
            )}`}
          >
            {quote.status.toUpperCase()}
          </span>
          {quote.status === "pending" && (
            <span className="text-xs text-red-500 font-medium">
              Vence: {format(new Date(quote.expiresAt), "dd/MM/yyyy")}
            </span>
          )}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Customer Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Información del Cliente
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="text-base text-gray-900">{quote.customerName}</dd>
            </div>
            {quote.customerEmail && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-base text-gray-900">
                  {quote.customerEmail}
                </dd>
              </div>
            )}
            {quote.customerPhone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="text-base text-gray-900">
                  {quote.customerPhone}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Service Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Detalles del Servicio
          </h3>
          <div className="flex items-start gap-4">
            {quote.service.imageUrl && (
              <img
                src={quote.service.imageUrl}
                alt={quote.service.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
            )}
            <div>
              <h4 className="font-medium text-gray-900">
                {quote.service.name}
              </h4>
              <p className="text-sm text-gray-500 line-clamp-2">
                {quote.service.description}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Precio Cotizado
              </dt>
              <dd className="text-xl font-bold text-gray-900">
                ${quote.price}
              </dd>
            </div>
            {quote.duration && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Duración</dt>
                <dd className="text-base text-gray-900">
                  {quote.duration} min
                </dd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {(quote.notes || quote.termsConditions) && (
        <div className="px-8 pb-6 border-t border-gray-100 pt-6">
          {quote.notes && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Notas Adicionales
              </h4>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                {quote.notes}
              </p>
            </div>
          )}
          {quote.termsConditions && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Términos y Condiciones
              </h4>
              <p className="text-xs text-gray-500">{quote.termsConditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex flex-wrap gap-3 justify-end items-center">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
        >
          Volver
        </button>

        {/* WhatsApp Action */}
        {quote.customerPhone && (
          <a
            href={getWhatsAppLink() || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#25D366] text-white rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.913.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-2.846-.828-.924-.38-1.631-.914-2.181-1.464l-.019-.018c-.463-.538-1.554-1.926-1.554-2.774 0-.847.464-1.472 0.72-1.728.257-.257.551-.384.886-.384.333 0 .729.006.886.006.183 0 .337.008.525.437.202.461.706 1.728.706 1.834 0 .105-.021.196-.063.281-.043.085-.236.216-.48.461-.267.268-.537.499-.253.978.281.475 1.258 1.631 2.687 2.261.375.165.738.254 1.01.254.272 0 .564-.085.876-.441.312-.356.516-.763.676-.763.16 0 .428.008.643.111.411.196 1.346.68 1.631.824.281.144.375.197.437.299.063.102.063.606-.079 1.011z" />
            </svg>
            Enviar WhatsApp
          </a>
        )}

        {/* Status Actions */}
        {quote.status === "pending" && (
          <>
            <button
              onClick={() => handleStatusChange("rejected")}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
            >
              Rechazar
            </button>
            <button
              onClick={() => handleStatusChange("accepted")}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
              Aceptar
            </button>
          </>
        )}

        {/* Conversion Action */}
        {quote.status === "accepted" && (
          <button
            onClick={handleConvertToService}
            disabled={isConverting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isConverting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creando Servicio...
              </>
            ) : (
              "Convertir a Servicio"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

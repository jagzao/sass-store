"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageCircle, Mail, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Using a simple toast implementation to avoid dependency issues
const toast = {
  success: (message: string) => alert(`✓ ${message}`),
  error: (message: string) => alert(`✗ ${message}`),
};

interface QuoteItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  type: "service" | "product";
}

interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status: "pending" | "accepted" | "rejected" | "expired" | "converted";
  createdAt: string;
  expiresAt: string;
  totalAmount: string; // Changed from price
  validityDays: number;
  items: QuoteItem[];
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
  const router = useRouter();
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchQuote = useCallback(async () => {
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
  }, [tenantSlug, quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/quotes/${quoteId}`,
        {
          method: "PUT", // Ensure this endpoint supports PUT for status updates
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

  const handleSendEmail = async () => {
    if (!quote?.customerEmail) return;
    
    setSendingEmail(true);
    try {
        const response = await fetch(
            `/api/tenants/${tenantSlug}/quotes/${quote.id}/email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: quote.customerEmail }),
            },
        );

        if (response.ok) {
            toast.success("Correo enviado exitosamente");
        } else {
            toast.error("Error al enviar el correo");
        }
    } catch (e) {
        toast.error("Error de conexión");
    } finally {
        setSendingEmail(false);
    }
  }

  const getWhatsAppLink = () => {
    if (!quote || !quote.customerPhone) return null;

    let message = `Hola ${quote.customerName}, aquí tienes tu cotización *${quote.quoteNumber}*.\n\n`;
    message += `*Detalle:*\n`;
    quote.items.forEach(item => {
        message += `- ${item.name} (x${item.quantity}): $${Number(item.unitPrice).toFixed(2)}\n`;
    });
    message += `\n*Total: $${Number(quote.totalAmount).toFixed(2)}*`;
    message += `\nVálido hasta: ${format(new Date(quote.expiresAt), "dd/MM/yyyy")}`;

    return `https://wa.me/${quote.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
          return "bg-stone-100 text-stone-800 border-stone-200";
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

  if (isLoading) return <div className="p-8 text-center animate-pulse">Cargando detalles...</div>;
  if (!quote) return <div className="p-8 text-center text-red-500">Cotización no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

      <div className="p-8 grid grid-cols-1 gap-8">
        {/* Customer Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Información del Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="text-base text-gray-900">{quote.customerName}</dd>
            </div>
            {quote.customerEmail && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-base text-gray-900">{quote.customerEmail}</dd>
              </div>
            )}
            {quote.customerPhone && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="text-base text-gray-900">{quote.customerPhone}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
            Detalles de la Cotización
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-center">Cant.</th>
                  <th className="px-4 py-3 text-right">Precio Unit.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quote.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.type === 'service' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {item.type === 'service' ? 'Servicio' : 'Producto'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-center">{Number(item.quantity)}</td>
                    <td className="px-4 py-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                  <td className="px-4 py-3 text-right text-lg">${Number(quote.totalAmount).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="px-8 pb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Notas Adicionales</h4>
          <p className="text-sm text-gray-600 bg-stone-50 p-4 rounded-lg border border-stone-100">
            {quote.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex flex-wrap gap-3 justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <div className="flex flex-wrap gap-3">
            {/* Email Action */}
            <Button
                variant="outline"
                onClick={handleSendEmail}
                disabled={!quote.customerEmail || sendingEmail}
                className="gap-2"
            >
                <Mail className="h-4 w-4" />
                {sendingEmail ? "Enviando..." : "Reenviar Correo"}
            </Button>

            {/* WhatsApp Action */}
            {quote.customerPhone && (
                <a
                    href={getWhatsAppLink() || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-md hover:bg-[#20bd5a] text-sm font-medium transition-colors h-10"
                >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                </a>
            )}

            {/* Status Actions */}
            {quote.status === "pending" && (
                <>
                    <Button
                        variant="destructive"
                        onClick={() => handleStatusChange("rejected")}
                        className="gap-2"
                    >
                        <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                    <Button
                        variant="default" // green is usually default for success actions or distinct color
                        onClick={() => handleStatusChange("accepted")}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="h-4 w-4" /> Aceptar
                    </Button>
                </>
            )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, Mail, MessageCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuoteSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  quote: {
    id: string;
    quoteNumber: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    totalAmount: string;
    items: {
      name: string;
      quantity: string;
      unitPrice: string;
    }[];
  };
}

export default function QuoteSuccessModal({
  isOpen,
  onClose,
  tenantSlug,
  quote,
}: QuoteSuccessModalProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch(
        `/api/tenants/${tenantSlug}/quotes/${quote.id}/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: quote.customerEmail }),
        },
      );

      if (response.ok) {
        setEmailSent(true);
      } else {
        alert("Error al enviar el correo. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error de conexión.");
    } finally {
      setSendingEmail(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!quote.customerPhone) return null;
    
    // Clean phone number (remove non-digits)
    const phone = quote.customerPhone.replace(/\D/g, "");
    
    // Construct message
    let message = `Hola ${quote.customerName}, aquí tienes tu cotización *${quote.quoteNumber}*\n\n`;
    message += `*Detalle:*\n`;
    quote.items.forEach(item => {
        message += `- ${item.name} (x${item.quantity}): $${Number(item.unitPrice).toFixed(2)}\n`;
    });
    message += `\n*Total estimado: $${Number(quote.totalAmount).toFixed(2)}*`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const whatsappLink = getWhatsAppLink();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />
      <div className="relative z-50 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-green-50 p-6 text-center border-b border-green-100">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">¡Cotización Creada!</h2>
          <p className="text-gray-600 mt-1">
            La cotización <span className="font-mono font-medium">{quote.quoteNumber}</span> se ha guardado correctamente.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 text-center mb-4">
            ¿Qué te gustaría hacer ahora?
          </p>

          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail || emailSent || !quote.customerEmail}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-12 text-base",
              emailSent 
                ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {sendingEmail ? (
                <>Enviando...</>
            ) : emailSent ? (
                <>
                    <CheckCircle className="h-5 w-5" />
                    Correo Enviado
                </>
            ) : (
                <>
                    <Mail className="h-5 w-5" />
                    Enviar por Correo
                    {!quote.customerEmail && <span className="text-xs opacity-70 ml-1">(No disponible)</span>}
                </>
            )}
          </Button>

          {whatsappLink ? (
             <a 
               href={whatsappLink}
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md font-medium transition-colors"
             >
               <MessageCircle className="h-5 w-5" />
               Enviar por WhatsApp
               <ExternalLink className="h-4 w-4 opacity-70" />
             </a>
          ) : (
            <Button
              disabled
              className="w-full flex items-center justify-center gap-2 h-12 bg-gray-100 text-gray-400"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp No Disponible
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 font-normal"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { generateWhatsAppLink } from "@/lib/home/whatsapp-link";

export interface RetouchEligibleCustomer {
  id: string;
  name: string;
  phone?: string | null;
  lastVisitDate: string; // ISO string from backend
  daysSinceLastVisit: number;
}

export interface RetouchMonitorProps {
  tenantSlug: string;
  tenantName?: string;
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function RetouchMonitorSection({
  tenantSlug,
  tenantName = "Wonder Nails"
}: RetouchMonitorProps) {
  const [retouches, setRetouches] = useState<RetouchEligibleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRetouches() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}/retouches`);
        if (!response.ok) {
          throw new Error("Error al obtener los clientes sugeridos para retoque");
        }
        
        const data = await response.json();
        
        // Match Result Pattern Output (usually data or error inside object if withResultHandler maps it)
        // Adjust depending on how Result maps -> data.data for Ok?
        if (data.success && Array.isArray(data.data)) {
           // Sort from maximum days (most urgent) to minimum
           const sorted = data.data.sort((a: any, b: any) => b.daysSinceLastVisit - a.daysSinceLastVisit);
           setRetouches(sorted);
        } else {
           throw new Error(data.error?.message || "Estructura de datos inválida");
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Failed to fetch pending retouches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRetouches();
  }, [tenantSlug]);


  // Semáforo visual map
  const getTrafficLight = (days: number) => {
    if (days >= 19) {
      return { 
        bg: "bg-red-50", 
        border: "border-red-300", 
        badgeBg: "bg-red-100", 
        badgeText: "text-red-700", 
        label: "Crítico",
        emoji: "🔴"
      };
    }
    if (days === 18) {
      return { 
        bg: "bg-amber-50", 
        border: "border-amber-300", 
        badgeBg: "bg-amber-100", 
        badgeText: "text-amber-800", 
        label: "Atención",
        emoji: "🟡"
      };
    }
    // 15 - 17 days
    return { 
      bg: "bg-green-50", 
      border: "border-green-300", 
      badgeBg: "bg-green-100", 
      badgeText: "text-green-800", 
      label: "A Tiempo",
      emoji: "🟢"
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl lg:text-2xl text-gray-800">
            💅 MONITOR DE RETOQUES
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Clientas que visitaron entre hace 15 y 20 días sin una cita futura.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
               <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
               <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))
        ) : error ? (
           <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : retouches.length === 0 ? (
          <div className="bg-[#E6E6FA]/20 border border-[#C5A059]/10 rounded-xl p-8 text-center">
            <span className="text-4xl mb-3 block">✨</span>
            <p className="text-gray-600 font-medium">¡Agenda Limpia!</p>
            <p className="text-sm text-gray-400 mt-1">No hay clientas en el umbral de retoque por el momento.</p>
          </div>
        ) : (
          retouches.map((retouch) => {
            const tl = getTrafficLight(retouch.daysSinceLastVisit);
            const dateStr = new Date(retouch.lastVisitDate).toLocaleDateString("es-MX", { month: "short", day: "numeric" });
            
            // Build WhatsApp reminder link
            const reminderMessage = `¡Hola ${retouch.name}! Soy de ${tenantName}. Noté que tu última visita fue el ${dateStr} (hace ${retouch.daysSinceLastVisit} días). ¡Es el momento ideal para tu retoque! ¿Te gustaría agendar una cita?`;
            const phoneClean = retouch.phone ? retouch.phone.replace(/\D/g, "") : "";
            const whatsappLink = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(reminderMessage)}` : "#";

            return (
              <div 
                key={retouch.id}
                className={`rounded-xl border p-4 hover:shadow-md transition-all duration-200 ${tl.bg} ${tl.border}`}
              >
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{retouch.name}</h4>
                          <span className={`${tl.badgeBg} ${tl.badgeText} px-2 py-0.5 text-xs font-bold rounded-full`}>
                             {tl.emoji} {tl.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Última visita: <strong>{dateStr}</strong> 
                          <span className="ml-2 text-xs opacity-75">({retouch.daysSinceLastVisit} días transcurridos)</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      {phoneClean ? (
                         <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 active:bg-green-700 transition-colors shadow-sm"
                        >
                          <WhatsAppIcon />
                          <span>Recordatorio</span>
                        </a>
                      ) : (
                         <span className="text-xs text-gray-400 px-3 py-2 bg-white rounded-lg border">Sin teléfono</span>
                      )}
                    </div>
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CalendarClientWrapper from "../../../app/t/[tenant]/admin/calendar/CalendarClientWrapper";
import { X, Save, Eye } from "lucide-react";
import CustomerFileHeader, { type CustomerFileHeaderHandle } from "@/components/customers/CustomerFileHeader";
import CustomerFileSummary from "@/components/customers/CustomerFileSummary";
import CustomerVisitsHistory from "@/components/customers/CustomerVisitsHistory";

export interface PendingAppointmentsSectionProps {
  tenantSlug: string;
}

export default function PendingAppointmentsSection({
  tenantSlug,
}: PendingAppointmentsSectionProps) {
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [savingHistorial, setSavingHistorial] = useState(false);
  const customerFileHeaderRef = useRef<CustomerFileHeaderHandle>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function fetchPendingCustomers() {
      try {
        setLoading(true);
        const response = await fetch(`/api/tenants/${tenantSlug}/customers?sort=lastVisit&order=desc`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        
        const data = await response.json();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const customersToConfirm = (data.customers || [])
          .filter((customer: any) => customer.lastVisit && !customer.nextAppointment)
          .map((customer: any) => {
             const lastVisitDate = new Date(customer.lastVisit);
             lastVisitDate.setHours(0, 0, 0, 0);
             const diffTime = Math.abs(now.getTime() - lastVisitDate.getTime());
             const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             
             return {
                 id: customer.id,
                 customerName: customer.name,
                 customerPhone: customer.phone,
                 lastVisitDate: lastVisitDate.toLocaleDateString("es-ES", {
                     day: "2-digit",
                     month: "long",
                     year: "numeric"
                 }),
                 daysSinceLastVisit: diffDays,
             };
          })
          .filter((mapped: any) => mapped.daysSinceLastVisit >= 14 && mapped.daysSinceLastVisit <= 20)
          .sort((a: any, b: any) => b.daysSinceLastVisit - a.daysSinceLastVisit); // Sort oldest first (closest to 20 days)

        setPendingBookings(customersToConfirm);
      } catch (err) {
        console.error("Error fetching customers to confirm:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPendingCustomers();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="bg-[#C5A059]/5 rounded-lg border border-[#C5A059]/20 p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-[#C5A059] mb-4 uppercase tracking-wide">
          ⏳ CITAS POR CONFIRMAR
        </h3>
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A059]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative isolate">
        {isMounted && selectedCustomerId && createPortal(
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedCustomerId(null)}
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-[#5B21B6] font-serif">Expediente de Clienta</h2>
                <button
                  onClick={async () => {
                    setSavingHistorial(true);
                    try {
                      await customerFileHeaderRef.current?.saveHistorial();
                    } finally {
                      setSavingHistorial(false);
                    }
                    setSelectedCustomerId(null);
                  }}
                  disabled={savingHistorial}
                  className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-[#6D28D9] transition-colors disabled:opacity-60 shadow-sm"
                >
                  {savingHistorial ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {savingHistorial ? "Guardando..." : "Guardar y cerrar"}
                </button>
                <div className="flex items-center gap-3">
                  <a
                    href={`/t/${tenantSlug}/clientes/${selectedCustomerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Abrir en página completa ↗
                  </a>
                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    aria-label="Cerrar sin guardar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-6">
                <CustomerFileHeader ref={customerFileHeaderRef} tenantSlug={tenantSlug} customerId={selectedCustomerId} />
                <CustomerVisitsHistory tenantSlug={tenantSlug} customerId={selectedCustomerId} />
                <CustomerFileSummary tenantSlug={tenantSlug} customerId={selectedCustomerId} />
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* We reuse CalendarClientWrapper to render the list, but pass pending bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-indigo-50 p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#C5A059] uppercase tracking-wide">
              ⏳ POR CONFIRMAR ({pendingBookings.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingBookings.map((customer) => (
              <div
                key={customer.id}
                className="border border-[#C5A059]/30 rounded-lg p-3 hover:border-[#C5A059] transition-colors bg-amber-50/30 relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Última Visita: {customer.lastVisitDate}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 shadow-sm animate-pulse shadow-orange-500/10">
                    Hace {customer.daysSinceLastVisit} días
                  </span>
                </div>
                
                <div className="flex justify-between items-start gap-2">
                   <div>
                      <div className="text-sm text-gray-900 font-semibold mb-1 flex items-center gap-1.5">
                         {customer.customerName}
                      </div>
                      <div className="text-xs text-gray-600">
                         {customer.customerPhone ? customer.customerPhone : "Sin teléfono"}
                      </div>
                   </div>
                   
                   {/* Compact Action Icons */}
                   <div className="flex items-center gap-2">
                     <a
                       href={`https://wa.me/${(customer.customerPhone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${customer.customerName}, notamos que nos visitaste hace ya unos días. ¿Te gustaría agendar una nueva cita?`)}`}
                       target="_blank"
                       rel="noopener noreferrer" 
                       title="Enviar WhatsApp"
                       className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 transition-colors"
                     >
                       <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                       </svg>
                     </a>
                     <button 
                       onClick={() => setSelectedCustomerId(customer.id)} 
                       title="Ver Cliente"
                       className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-[#C5A059] hover:bg-amber-200 hover:text-[#b08d4b] transition-colors"
                     >
                       <Eye className="w-4 h-4" />
                     </button>
                   </div>
                </div>

              </div>
            ))}

            {pendingBookings.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No hay citas pendientes por confirmar.
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

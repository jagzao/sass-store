"use client";

import { useState } from "react";
import AppointmentDetailModal from "@/components/home/AppointmentDetailModal";
import AddEditVisitModal from "@/components/customers/AddEditVisitModal";
import { Eye, Plus } from "lucide-react";

interface CalendarClientWrapperProps {
  todayBookings: any[];
  tenantSlug?: string;
}

export default function CalendarClientWrapper({ todayBookings, tenantSlug }: CalendarClientWrapperProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-stone-100 text-stone-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">
            📋 CITAS DE HOY
          </h3>
          {tenantSlug && (
            <button
              onClick={() => setShowAddVisitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] text-white rounded-lg font-medium text-sm hover:bg-[#D4B76A] transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Visita</span>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {todayBookings.map((booking) => (
            <div
              key={booking.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-[#C5A059]/40 transition-colors bg-white relative group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {booking.time}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                >
                  {getStatusText(booking.status)}
                </span>
              </div>
              
              <div className="flex justify-between items-start gap-2">
                 <div>
                    <div className="text-sm text-gray-900 font-semibold">
                    {booking.customerName}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                    {booking.serviceName}
                    </div>
                    {booking.totalPrice > 0 && (
                    <div className="text-xs text-[#C5A059] font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block mb-1">
                        Precio a Cobrar: ${booking.totalPrice.toLocaleString("es-MX")}
                    </div>
                    )}
                 </div>
                 
                 <button 
                  onClick={() => setSelectedAppointment(booking)}
                  className="flex flex-col items-center justify-center p-2 text-[#C5A059] hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-all shadow-sm"
                  aria-label="Ver Detalles"
                 >
                    <Eye className="h-5 w-5 mb-0.5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Detalle</span>
                 </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex space-x-3">
                <button className="text-xs font-medium text-green-600 hover:text-green-700">
                  Confirmar
                </button>
                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  Editar
                </button>
                <button className="text-xs font-medium text-red-600 hover:text-red-700">
                  Cancelar
                </button>
              </div>
            </div>
          ))}

          {todayBookings.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No hay citas registradas para hoy.
            </div>
          )}
        </div>
      </div>

      <AppointmentDetailModal 
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />

      {showAddVisitModal && tenantSlug && (
        <AddEditVisitModal
          tenantSlug={tenantSlug}
          onClose={(shouldRefresh) => {
            setShowAddVisitModal(false);
            if (shouldRefresh) {
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}

"use client";

import { createPortal } from "react-dom";
import { X, Calendar, DollarSign, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppointmentDetail {
  id: string;
  customerName: string;
  serviceName: string;
  totalPrice: number;
  date: string;
  time: string;
}

interface AppointmentDetailModalProps {
  appointment: AppointmentDetail | null;
  onClose: () => void;
}

export default function AppointmentDetailModal({
  appointment,
  onClose,
}: AppointmentDetailModalProps) {
  if (!appointment) return null;

  const modal = (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0 z-[210]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[221] w-full max-w-md bg-white border border-[rgba(197,160,89,0.3)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(197,160,89,0.15)] bg-white">
          <h2 className="text-xl font-serif font-bold text-[#C5A059] uppercase tracking-wide">
            Detalle de Cita
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-[rgba(197,160,89,0.1)] text-[#C5A059] transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 bg-white space-y-6">
          {/* Customer & Service Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {appointment.customerName}
            </h3>
            <p className="text-[#C5A059] font-medium">
              {appointment.serviceName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F9F9F9] p-3 rounded-lg border border-gray-100 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Horario
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.date} - {appointment.time}
                </p>
              </div>
            </div>

            <div className="bg-[#F9F9F9] p-3 rounded-lg border border-gray-100 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Costo Total
                </p>
                <p className="text-sm font-bold text-gray-900">
                  ${appointment.totalPrice.toLocaleString("es-MX")}
                </p>
              </div>
            </div>
          </div>

          {/* Photo Placeholder */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Foto del Diseño (Referencia)
            </p>
            <div className="h-48 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-sm font-medium">Sin imagen subida</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-[8px]"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

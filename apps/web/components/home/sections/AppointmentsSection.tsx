"use client";

/**
 * AppointmentsSection Component
 *
 * Container for unconfirmed appointments list.
 * Shows "Citas por Confirmar" with WhatsApp action per row.
 */

import { useEffect, useState } from "react";
import AppointmentCard from "./AppointmentCard";
import {
  getUnconfirmedAppointments,
  UnconfirmedAppointment,
} from "@/lib/home/appointments-data";

export interface AppointmentsSectionProps {
  /** Tenant slug for data fetching */
  tenantSlug: string;
  /** Tenant name for WhatsApp messages */
  tenantName?: string;
  /** Maximum appointments to show */
  limit?: number;
}

/**
 * Section displaying unconfirmed appointments with WhatsApp actions
 */
export default function AppointmentsSection({
  tenantSlug,
  tenantName = "Negocio",
  limit = 5,
}: AppointmentsSectionProps) {
  const [appointments, setAppointments] = useState<UnconfirmedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);

      const result = await getUnconfirmedAppointments(tenantSlug, {
        status: "pending",
        limit,
        fromDate: new Date(), // Only future appointments
      });

      if (result.success) {
        setAppointments(result.data);
      } else {
        setError("No se pudieron cargar las citas");
        console.error("Failed to fetch appointments:", result.error);
      }

      setLoading(false);
    }

    fetchAppointments();
  }, [tenantSlug, limit]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl lg:text-2xl text-gray-800">
            ✨ NUEVAS CLIENTAS POR CONFIRMAR ESTA SEMANA
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {appointments.length > 0
              ? `${appointments.length} cita${appointments.length > 1 ? "s" : ""} pendiente${appointments.length > 1 ? "s" : ""} de confirmación`
              : "Todas las citas están confirmadas"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {loading ? (
          // Loading skeleton
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#C5A059]/20 p-4 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-700 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : appointments.length === 0 ? (
          // Empty state
          <div className="bg-[#E6E6FA]/20 border border-[#C5A059]/10 rounded-xl p-8 text-center">
            <span className="text-4xl mb-3 block">✅</span>
            <p className="text-gray-600 font-medium">
              ¡Excelente! No hay citas pendientes de confirmación
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Las nuevas citas aparecerán aquí
            </p>
          </div>
        ) : (
          // Appointments list
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              tenantName={tenantName}
            />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import CalendarClientWrapper from "../../../app/t/[tenant]/admin/calendar/CalendarClientWrapper";
import { format } from "date-fns";

export interface TodayAppointmentsSectionProps {
  tenantSlug: string;
}

export default function TodayAppointmentsSection({
  tenantSlug,
}: TodayAppointmentsSectionProps) {
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodayBookings() {
      try {
        setLoading(true);
        // Note: For simplicity and reusability we fetch all pending/confirmed bookings for today 
        // from the standard endpoint. In real prod, dates should be passed via Server Actions 
        // or dedicated endpoint filters to save payload. The client wrapper expects `date` field.
        const response = await fetch(`/api/tenants/${tenantSlug}/bookings?status=pending`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch today bookings");
        }
        
        const data = await response.json();
        
        // Filter mapped response down to exactly today's date formatted string.
        const todayStr = new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        });
        
        // Let's just mock formatting exactly as `CalendarClientWrapper` expects it natively from DB
        // The API returns the exact DB objects so we map to the exact prop structure the Wrapper uses.
        const mappedBookings = data.bookings?.map((booking: any) => {
            const dateObj = new Date(booking.startTime);
            return {
                id: booking.id,
                customerId: booking.customerId,
                customerName: booking.customerName || "Cliente Web",
                customerPhone: booking.customerPhone,
                serviceName: booking.metadata?.serviceName || "Servicio",
                date: dateObj.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }),
                time: dateObj.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                }),
                status: booking.status,
                totalPrice: Number(booking.totalPrice) || 0,
            };
        }) || [];

        // filter using the current exact local standard date format Fila wrapper Fila
        const FilaBookings = mappedBookings.filter((b: any) => b.date === todayStr);

        setTodayBookings(FilaBookings);
      } catch (err) {
        console.error("Error fetching today's appointments:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTodayBookings();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          📋 CITAS DE HOY
        </h3>
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C5A059]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative isolate">
        <CalendarClientWrapper todayBookings={todayBookings} tenantSlug={tenantSlug} />
    </div>
  );
}

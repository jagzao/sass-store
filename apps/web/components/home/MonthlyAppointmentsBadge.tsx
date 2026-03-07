"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";

export function MonthlyAppointmentsBadge({ tenantSlug }: { tenantSlug: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchMonthlyCount() {
      try {
        const now = new Date();
        const res = await fetch(`/api/tenants/${tenantSlug}/bookings?status=pending`);
        if (!res.ok) return;
        
        const data = await res.json();
        
        const currentMonthBookings = data.bookings?.filter((b: any) => {
           const d = new Date(b.startTime);
           return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }) || [];
        
        let total = currentMonthBookings.length;
        
        // Also fetch confirmed if possible, or just use Fila pending + confirmed logic 
        // to show total active volume.
        const resConf = await fetch(`/api/tenants/${tenantSlug}/bookings?status=confirmed`);
        if (resConf.ok) {
            const dataConf = await resConf.json();
            const confirmedMonthBookings = dataConf.bookings?.filter((b: any) => {
                const d = new Date(b.startTime);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }) || [];
            total += confirmedMonthBookings.length;
        }

        setCount(total);
      } catch (err) {
        console.error("Failed to fetch monthly count", err);
      }
    }
    fetchMonthlyCount();
  }, [tenantSlug]);

  const isHighDemand = count !== null && count > 50;

  const badgeContainerClasses = isHighDemand
    ? "relative flex items-center justify-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all group bg-gradient-to-r from-[#D4AF37] to-[#B8860B] border-[#B8860B] text-white hover:opacity-90 hover:scale-105"
    : "relative flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-[#C5A059]/40 text-[#C5A059] shadow-sm hover:bg-[#C5A059] hover:text-white transition-all group";

  const badgeNumberClasses = isHighDemand
    ? "absolute -top-1.5 -right-1.5 bg-white text-[#B8860B] text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md transition-colors border border-[#B8860B]"
    : "absolute -top-1.5 -right-1.5 bg-[#C5A059] group-hover:bg-white group-hover:text-[#C5A059] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm transition-colors border border-white";

  return (
    <Link 
      href={`/t/${tenantSlug}/admin/calendar`}
      className={badgeContainerClasses}
      title={isHighDemand ? "Semana/Mes de Alta Demanda" : "Calendario"}
    >
      <span className="font-semibold text-sm hidden sm:inline">Calendario</span>
      <Calendar className="w-5 h-5" />
      {count !== null && (
        <span className={badgeNumberClasses}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

"use client";

import Link from "next/link";

export type CalendarStatsCounts = {
  today: number;
  confirmed: number;
  pending: number;
  cancelled: number;
};

type CardConfig = {
  key: keyof CalendarStatsCounts | "today";
  label: string;
  value: number;
  valueClass: string;
  cardClass: string;
  href: string;
};

export function CalendarStatsCards({
  tenantSlug,
  counts,
}: {
  tenantSlug: string;
  counts: CalendarStatsCounts;
}) {
  const base = `/t/${tenantSlug}/admin_bookings`;

  const cards: CardConfig[] = [
    {
      key: "today",
      label: "Citas Hoy",
      value: counts.today,
      valueClass: "text-blue-600",
      cardClass:
        "bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:border-blue-300 hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-blue-400/40",
      href: `${base}?scope=today`,
    },
    {
      key: "confirmed",
      label: "Confirmadas",
      value: counts.confirmed,
      valueClass: "text-green-600",
      cardClass:
        "bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:border-green-300 hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-green-400/40",
      href: `${base}?status=confirmed`,
    },
    {
      key: "pending",
      label: "Pendientes",
      value: counts.pending,
      valueClass: "text-[#C5A059]",
      cardClass:
        "bg-[#C5A059]/10 rounded-lg shadow-sm border border-[#C5A059]/20 p-6 hover:border-[#C5A059]/50 hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-[#C5A059]/40",
      href: `${base}?status=pending`,
    },
    {
      key: "cancelled",
      label: "Canceladas",
      value: counts.cancelled,
      valueClass: "text-red-600",
      cardClass:
        "bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:border-red-300 hover:shadow-md transition-all focus-within:ring-2 focus-within:ring-red-400/40",
      href: `${base}?status=cancelled`,
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          data-testid={`calendar-stat-${card.key}`}
          className={`group block cursor-pointer ${card.cardClass}`}
          aria-label={`Ver detalle: ${card.label} (${card.value})`}
        >
          <div
            className={`text-2xl font-bold ${card.valueClass} group-hover:scale-[1.02] transition-transform`}
          >
            {card.value}
          </div>
          <div className="text-sm text-gray-600 font-medium tracking-wide uppercase mt-1 flex items-center justify-between gap-2">
            <span className={card.key === "pending" ? "text-[#C5A059]" : ""}>
              {card.label}
            </span>
            <span className="text-[10px] normal-case tracking-normal text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver listado →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

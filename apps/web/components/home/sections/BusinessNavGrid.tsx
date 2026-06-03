"use client";

/**
 * BusinessNavGrid Component
 *
 * 2-3 column grid with navigation links for business operations.
 * NEGOCIO section with emojis and gold hover effects.
 */

import NavGridItem from "./NavGridItem";
import { isSportsTenant } from "@/lib/tenant/client-terminology";

export interface BusinessNavGridProps {
  /** Tenant slug for navigation */
  tenantSlug: string;
}

interface NavGridItemData {
  emoji: string;
  label: string;
  href: string;
  authProtected?: boolean;
  description?: string;
  external?: boolean;
}

const NAV_ITEMS: NavGridItemData[] = [
  {
    emoji: "📅",
    label: "Calendario de citas",
    href: "/admin/calendar",
    description: "Vista semanal de todas las reservas",
  },
  {
    emoji: "👥",
    label: "Clientas",
    href: "/clientes",
    description: "Administrar clientas",
  },
  {
    emoji: "💰",
    label: "Finanzas",
    href: "/finance",
    authProtected: true,
    description: "Ingresos y gastos",
  },
  {
    emoji: "📱",
    label: "Planificación Redes",
    href: "/social",
    description: "Calendario de contenido",
  },
  {
    emoji: "💬",
    label: "Atención al Cliente",
    href: "/contact",
    description: "Mensajes y quejas",
  },
  {
    emoji: "🎨",
    label: "Plantillas Canva",
    href: "https://canva.com",
    external: true,
    description: "Diseños listos",
  },
];

/**
 * Business navigation grid with 2-3 columns
 */
const SPORTS_NAV: NavGridItemData[] = [
  {
    emoji: "🎾",
    label: "Sesiones / Clases",
    href: "/admin/sessions",
    description: "Clases grupales e inscripciones",
  },
];

export default function BusinessNavGrid({ tenantSlug }: BusinessNavGridProps) {
  const items = isSportsTenant(tenantSlug)
    ? [SPORTS_NAV[0], ...NAV_ITEMS]
    : NAV_ITEMS;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="font-serif text-xl lg:text-2xl text-gray-800">
          🏪 NEGOCIO
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Accesos rápidos a las herramientas de tu negocio
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
        {items.map((item) => {
          const fullPath = item.external
            ? item.href
            : `/t/${tenantSlug}${item.href}`;

          return (
            <NavGridItem
              key={item.href}
              emoji={item.emoji}
              label={item.label}
              href={fullPath}
              authProtected={item.authProtected}
              description={item.description}
              external={item.external}
            />
          );
        })}
      </div>
    </div>
  );
}

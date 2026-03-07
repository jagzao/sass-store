"use client";

/**
 * HomeTenant Component
 *
 * Main HomeTenant container with Master-Detail layout.
 * Provides a persistent sidebar for desktop and bottom nav for mobile.
 *
 * Design: Ethereal Lilac Luxury
 * - White backgrounds
 * - Gold accent #C5A059
 * - Lilac spotlight highlights
 * - Glassmorphism cards
 */

import { useState } from "react";
import DashboardLayoutWrapper from "./DashboardLayoutWrapper";
import TodayAppointmentsSection from "./sections/TodayAppointmentsSection";
import PendingAppointmentsSection from "./sections/PendingAppointmentsSection";
import BusinessNavGrid from "./sections/BusinessNavGrid";
import CustomersList from "@/components/customers/CustomersList";

export interface HomeTenantProps {
  /** Tenant slug for data fetching */
  tenantSlug: string;
  /** Tenant data */
  tenantData: any;
}

/**
 * HomeTenant Dashboard with Master-Detail layout
 */
export default function HomeTenant({ tenantSlug, tenantData }: HomeTenantProps) {
  const tenantName = tenantData?.name || "Negocio";

  return (
    <DashboardLayoutWrapper tenantSlug={tenantSlug} tenantName={tenantName}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Fila 1: Citas Hoy y Monitor de Retoques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[40vh] xl:h-[35vh]">
          <section className="h-full overflow-y-auto pr-1 pb-2">
            <TodayAppointmentsSection tenantSlug={tenantSlug} />
          </section>
          
          <section className="h-full overflow-y-auto pr-1 pb-2">
            <PendingAppointmentsSection tenantSlug={tenantSlug} />
          </section>
        </div>

        {/* Fila 2: Base de Datos de Clientas (Ancho Completo) */}
        <section className="bg-white rounded-lg shadow-sm overflow-hidden p-1 border border-indigo-50">
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            {/* Inject the standalone list without the container padding of the page */}
            <CustomersList tenantSlug={tenantSlug} searchParams={{}} />
          </div>
        </section>

        {/* Fila 3: Business Navigation Grid - NEGOCIO */}
        <section className="bg-white rounded-lg shadow-sm border border-indigo-50 p-6">
          <BusinessNavGrid tenantSlug={tenantSlug} />
        </section>
      </div>
    </DashboardLayoutWrapper>
  );
}

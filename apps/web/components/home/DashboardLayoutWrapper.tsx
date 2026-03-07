"use client";

import { useState } from "react";
import HomeTenantBottomNav from "./HomeTenantBottomNav";
import HomeTenantHeader from "./HomeTenantHeader";
import HomeTenantMobileMenu from "./HomeTenantMobileMenu";

export interface DashboardLayoutWrapperProps {
  tenantSlug: string;
  tenantName: string;
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({
  tenantSlug,
  tenantName,
  children,
}: DashboardLayoutWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
        {/* Header with user info and tenant branding */}
        <HomeTenantHeader
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Dynamic Dashboard Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <HomeTenantBottomNav
        tenantSlug={tenantSlug}
        className="lg:hidden"
      />

      {/* Mobile Hamburger Menu (Tablet) */}
      <HomeTenantMobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        tenantSlug={tenantSlug}
        tenantName={tenantName}
      />
    </div>
  );
}

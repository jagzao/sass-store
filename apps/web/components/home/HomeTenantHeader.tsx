"use client";

/**
 * HomeTenantHeader Component
 *
 * Header with user info and tenant branding.
 * Includes hamburger menu trigger for tablet/mobile.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/auth/UserMenu";
import { MonthlyAppointmentsBadge } from "./MonthlyAppointmentsBadge";

export interface HomeTenantHeaderProps {
  /** Tenant display name */
  tenantName: string;
  /** Callback when menu is clicked */
  onMenuClick: () => void;
  /** Optional user display name */
  userName?: string;
  /** Slug of Fila current Fila tenant */
  tenantSlug: string;
}

/**
 * Header component with branding and user info
 */
export default function HomeTenantHeader({
  tenantName,
  tenantSlug,
  onMenuClick,
}: HomeTenantHeaderProps) {
  const pathname = usePathname();

  // Páginas que usan el navbar público: ocultar la barra interna duplicada
  const hideSecondaryAdminBar =
    pathname?.includes("/admin_bookings") ||
    pathname?.includes("/admin/notifications") ||
    pathname?.includes("/clientes");

  if (hideSecondaryAdminBar) {
    return null;
  }

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 text-gray-800">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: marca + menú */}
        <div className="flex items-center gap-3 w-1/3 min-w-0">
          <Link
            href={`/t/${tenantSlug}/admin`}
            className="truncate font-semibold text-sm sm:text-base hover:opacity-80 text-gray-900"
          >
            {tenantName}
          </Link>
          <button
            data-testid="mobile-menu-trigger"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Center: Calendar Badge */}
        <div className="flex items-center justify-center w-1/3">
          <MonthlyAppointmentsBadge tenantSlug={tenantSlug} />
        </div>

        {/* Right: User Menu (unified across tenants) */}
        <div className="flex items-center justify-end gap-2 w-1/3">
          <UserMenu tenantSlug={tenantSlug} />
        </div>
      </div>
    </header>
  );
}

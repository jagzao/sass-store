"use client";

/**
 * HomeTenantSidebar Component
 *
 * Desktop sidebar navigation - 280px fixed width.
 * Ethereal Lilac Luxury styling with gold accents.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import TenantLogo from "@/components/ui/TenantLogo";

export interface HomeTenantSidebarProps {
  /** Tenant slug for navigation */
  tenantSlug: string;
  /** Tenant display name */
  tenantName: string;
  /** Additional class names */
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  emoji: string;
  authProtected?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "", emoji: "🏠" },
  { label: "Citas", href: "/admin_bookings", emoji: "📅" },
  { label: "Clientas", href: "/clientes", emoji: "👥" },
  { label: "Finanzas", href: "/finance", emoji: "💰", authProtected: true },
  { label: "Redes", href: "/social", emoji: "📱" },
  { label: "Inventario", href: "/inventory", emoji: "📦" },
];

/**
 * Desktop sidebar with navigation links
 */
export default function HomeTenantSidebar({
  tenantSlug,
  tenantName,
  className = "",
}: HomeTenantSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "") {
      return pathname === `/t/${tenantSlug}` || pathname === `/t/${tenantSlug}/`;
    }
    return pathname.startsWith(`/t/${tenantSlug}${href}`);
  };

  return (
    <aside
      data-testid="sidebar-nav"
      className={`w-[280px] fixed left-0 top-0 h-screen bg-white border-r border-[#C5A059]/20 
                  flex flex-col z-30 ${className}`}
    >
      {/* Logo/Brand Area */}
      <div className="p-6 border-b border-[#C5A059]/20">
        <TenantLogo 
          tenantSlug={tenantSlug} 
          tenantName={tenantName} 
          primaryColor="#C5A059" 
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-3">
          Menú Principal
        </p>
        
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const fullPath = `/t/${tenantSlug}${item.href}`;

          return (
            <Link
              key={item.href || "home"}
              href={fullPath}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  active
                    ? "bg-[#E6E6FA] text-[#C5A059] font-medium"
                    : "text-gray-600 hover:bg-[#E6E6FA]/30 hover:text-[#C5A059]"
                }
                group`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1">{item.label}</span>
              {item.authProtected && (
                <span className="text-xs text-gray-400 group-hover:text-[#C5A059]">
                  🔒
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#C5A059]/20">
        <Link
          href={`/t/${tenantSlug}/settings`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 
                     hover:bg-[#E6E6FA]/30 hover:text-[#C5A059] transition-all duration-200"
        >
          <span className="text-xl">⚙️</span>
          <span>Configuración</span>
        </Link>
      </div>
    </aside>
  );
}

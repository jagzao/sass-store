"use client";

/**
 * HomeTenantBottomNav Component
 *
 * Mobile bottom navigation with glassmorphism style.
 * Shows on screens < 1024px (lg breakpoint).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface HomeTenantBottomNavProps {
  /** Tenant slug for navigation */
  tenantSlug: string;
  /** Additional class names */
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  emoji: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "", emoji: "🏠" },
  { label: "Citas", href: "/bookings", emoji: "📅" },
  { label: "Clientas", href: "/clientes", emoji: "👥" },
  { label: "Más", href: "/menu", emoji: "☰" },
];

/**
 * Mobile bottom navigation bar
 */
export default function HomeTenantBottomNav({
  tenantSlug,
  className = "",
}: HomeTenantBottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "") {
      return pathname === `/t/${tenantSlug}` || pathname === `/t/${tenantSlug}/`;
    }
    if (href === "/menu") {
      return false; // Menu is never active
    }
    return pathname.startsWith(`/t/${tenantSlug}${href}`);
  };

  return (
    <nav
      data-testid="bottom-nav"
      className={`fixed bottom-0 left-0 right-0 h-16 z-40 
                  bg-white/90 backdrop-blur-md border-t border-[#C5A059]/20
                  flex items-center justify-around px-2 ${className}`}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const fullPath = item.href === "/menu" 
          ? `/t/${tenantSlug}/menu` 
          : `/t/${tenantSlug}${item.href}`;

        return (
          <Link
            key={item.href || "home"}
            href={fullPath}
            className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px]
                       transition-all duration-200 rounded-lg
              ${
                active
                  ? "text-[#C5A059]"
                  : "text-gray-500 active:bg-[#E6E6FA]/50"
              }`}
          >
            <span className="text-xl mb-0.5">{item.emoji}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

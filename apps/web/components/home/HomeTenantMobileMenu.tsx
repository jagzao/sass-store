"use client";

/**
 * HomeTenantMobileMenu Component
 *
 * Hamburger menu for tablet/mobile with full navigation.
 * Slide-in overlay with glassmorphism effect.
 */

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface HomeTenantMobileMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Callback to close menu */
  onClose: () => void;
  /** Tenant slug for navigation */
  tenantSlug: string;
  /** Tenant display name */
  tenantName: string;
}

interface NavItem {
  label: string;
  href: string;
  emoji: string;
  authProtected?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "", emoji: "🏠" },
  { label: "Citas", href: "/bookings", emoji: "📅" },
  { label: "Clientas", href: "/clientes", emoji: "👥" },
  { label: "Finanzas", href: "/finance", emoji: "💰", authProtected: true },
  { label: "Redes", href: "/social", emoji: "📱" },
  { label: "Inventario", href: "/inventory", emoji: "📦" },
  { label: "Atención al Cliente", href: "/contact", emoji: "💬" },
  { label: "Configuración", href: "/settings", emoji: "⚙️" },
];

/**
 * Mobile hamburger menu overlay
 */
export default function HomeTenantMobileMenu({
  isOpen,
  onClose,
  tenantSlug,
  tenantName,
}: HomeTenantMobileMenuProps) {
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className="fixed top-0 left-0 h-full w-[280px] bg-white z-50 
                    shadow-xl animate-slide-in-left"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#C5A059]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E6E6FA] to-[#C5A059] 
                          flex items-center justify-center text-white font-serif font-bold"
            >
              {tenantName.charAt(0).toUpperCase()}
            </div>
            <span className="font-serif text-xl text-gray-800 truncate">
              {tenantName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-[#E6E6FA]/30 
                       hover:text-[#C5A059] transition-colors"
            aria-label="Cerrar menú"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-3">
            Menú
          </p>

          {NAV_ITEMS.map((item) => {
            const fullPath = `/t/${tenantSlug}${item.href}`;

            return (
              <Link
                key={item.href || "home"}
                href={fullPath}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg 
                           text-gray-600 hover:bg-[#E6E6FA]/30 hover:text-[#C5A059] 
                           transition-all duration-200 group"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#C5A059]/20">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg 
                       text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </div>
    </>
  );
}

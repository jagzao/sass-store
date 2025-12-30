"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TenantNavigationProps {
  tenantSlug: string;
  primaryColor?: string;
  mode?: "booking" | "catalog";
  variant?: "default" | "transparent" | "dark";
}

export default function TenantNavigation({
  tenantSlug,
  primaryColor = "#000000",
  mode = "booking",
  variant = "default",
}: TenantNavigationProps) {
  const pathname = usePathname();
  const isTransparent = variant === "transparent";
  const isDark = variant === "dark";

  const links = [{ name: "Productos", href: `/t/${tenantSlug}/products` }];

  if (mode === "booking") {
    links.push({ name: "Servicios", href: `/t/${tenantSlug}/services` });
    links.push({ name: "Reservar", href: `/t/${tenantSlug}/book` });
  }

  links.push({ name: "Contacto", href: `/t/${tenantSlug}/contact` });

  return (
    <nav>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-opacity-80 ${
                isActive
                  ? isTransparent && tenantSlug !== "wondernails"
                    ? "text-white font-bold"
                    : isDark
                      ? "text-[#FF8000] font-bold" // Neon Orange for active state in dark mode
                      : "text-gray-900"
                  : isTransparent && tenantSlug !== "wondernails"
                    ? "text-gray-200"
                    : isDark
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-500"
              }`}
              style={
                isActive && !isTransparent && !isDark
                  ? { color: primaryColor }
                  : undefined
              }
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center">
        <MobileMenu
          links={links}
          primaryColor={primaryColor}
          isTransparent={isTransparent}
          isDark={isDark}
          pathname={pathname}
          tenantSlug={tenantSlug}
        />
      </div>
    </nav>
  );
}

function MobileMenu({
  links,
  primaryColor,
  isTransparent,
  isDark,
  pathname,
  tenantSlug,
}: {
  links: { name: string; href: string }[];
  primaryColor: string;
  isTransparent: boolean;
  isDark: boolean;
  pathname: string;
  tenantSlug: string;
}) {
  const [isOpen, setIsOpen] = require("react").useState(false);

  // Close menu when route changes
  require("react").useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
          isTransparent && tenantSlug !== "wondernails"
            ? "text-white hover:bg-white/10"
            : isDark && tenantSlug !== "wondernails"
              ? "text-white hover:bg-white/10"
              : "text-gray-900"
        }`}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        style={{ minWidth: "44px", minHeight: "44px" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-7 h-7"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            }
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer click afuera */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed top-16 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 p-6 flex flex-col space-y-2 z-50 animate-slideDown">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-lg font-medium transition-all p-3 rounded-lg hover:bg-gray-50 hover:shadow-sm ${
                    isActive
                      ? "text-gray-900 font-bold bg-gray-100 shadow-sm"
                      : "text-gray-700"
                  }`}
                  style={
                    isActive
                      ? {
                          color: primaryColor,
                          borderLeft: `4px solid ${primaryColor}`,
                        }
                      : undefined
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

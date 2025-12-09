"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TenantNavigationProps {
  tenantSlug: string;
  primaryColor?: string;
  mode?: "booking" | "catalog";
  variant?: "default" | "transparent";
}

export default function TenantNavigation({
  tenantSlug,
  primaryColor = "#000000",
  mode = "booking",
  variant = "default",
}: TenantNavigationProps) {
  const pathname = usePathname();
  const isTransparent = variant === "transparent";

  const links = [
    { name: "Inicio", href: `/t/${tenantSlug}` },
    { name: "Productos", href: `/t/${tenantSlug}/products` },
  ];

  if (mode === "booking") {
    links.push({ name: "Servicios", href: `/t/${tenantSlug}/services` });
    links.push({ name: "Reservar", href: `/t/${tenantSlug}/book` });
  }

  links.push({ name: "Clientes", href: `/t/${tenantSlug}/clientes` });
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
                    : "text-gray-900"
                  : isTransparent && tenantSlug !== "wondernails"
                    ? "text-gray-200"
                    : "text-gray-500"
              }`}
              style={
                isActive && !isTransparent ? { color: primaryColor } : undefined
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
  pathname,
  tenantSlug,
}: {
  links: { name: string; href: string }[];
  primaryColor: string;
  isTransparent: boolean;
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
        className={`p-2 rounded-md ${
          isTransparent && tenantSlug !== "wondernails"
            ? "text-white"
            : "text-gray-900"
        }`}
        aria-label="Menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
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
        <div className="absolute top-16 left-0 w-full bg-white shadow-lg border-t border-gray-100 p-4 flex flex-col space-y-4 z-50">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base font-medium transition-colors p-2 rounded-md hover:bg-gray-50 ${
                  isActive
                    ? "text-gray-900 font-bold bg-gray-50"
                    : "text-gray-600"
                }`}
                style={isActive ? { color: primaryColor } : undefined}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TenantNavigationProps {
  tenantSlug: string;
  primaryColor?: string;
  mode?: "booking" | "catalog";
  variant?: 'default' | 'transparent';
}

export default function TenantNavigation({
  tenantSlug,
  primaryColor = "#000000",
  mode = "booking",
  variant = "default",
}: TenantNavigationProps) {
  const pathname = usePathname();
  const isTransparent = variant === 'transparent';

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
    <nav className="hidden md:flex items-center space-x-8">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-opacity-80 ${
              isActive 
                ? (isTransparent ? "text-white font-bold" : "text-gray-900") 
                : (isTransparent ? "text-gray-200" : "text-gray-500")
            }`}
            style={isActive && !isTransparent ? { color: primaryColor } : undefined}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}

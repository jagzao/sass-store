"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function UserMenu({
  tenantSlug,
  variant = "default",
}: {
  tenantSlug?: string;
  variant?: "default" | "transparent";
}) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Extract tenant slug from current URL path or localStorage
  const currentTenantSlug =
    tenantSlug ||
    (pathname?.startsWith("/t/") ? pathname.split("/")[2] : null) ||
    (typeof window !== "undefined"
      ? localStorage.getItem("currentTenant")
      : null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    // Clear tenant from localStorage on sign out
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentTenant");
    }
    await signOut({ callbackUrl: "/" });
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  // If not authenticated
  if (!session?.user) {
    const isTransparent = variant === "transparent";
    return (
      <a
        href={
          currentTenantSlug
            ? `/t/${currentTenantSlug}/login`
            : "/t/zo-system/login"
        }
        className={
          isTransparent
            ? "px-4 py-2 rounded border border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-black transition-colors font-medium"
            : "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        }
      >
        Iniciar Sesión
      </a>
    );
  }

  const user = session.user;
  const isAdminOrManager =
    (user as any)?.role === "Admin" || (user as any)?.role === "Gerente";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {user.name?.charAt(0)?.toUpperCase() ||
            user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">
          Hola, {user.name?.split(" ")[0] || user.email?.split("@")[0]}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              {user.email}
            </div>
            <a
              href={`/t/${currentTenantSlug}/profile`}
              onClick={closeMenu}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Mi Perfil
            </a>
            <a
              href={`/t/${currentTenantSlug}/orders`}
              onClick={closeMenu}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Mis Pedidos
            </a>
            {isAdminOrManager && (
              <>
                <a
                  href={`/t/${currentTenantSlug}/social`}
                  onClick={closeMenu}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Redes Sociales
                </a>
                <a
                  href={`/t/${currentTenantSlug}/finance`}
                  onClick={closeMenu}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Finanzas
                </a>
              </>
            )}
            <hr className="my-2" />
            <a
              href={`/t/${currentTenantSlug}/admin_products`}
              onClick={closeMenu}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📦 Admin Productos
            </a>
            <a
              href={`/t/${currentTenantSlug}/admin_services`}
              onClick={closeMenu}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              ⚡ Admin Servicios
            </a>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

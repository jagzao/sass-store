"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface ZoHeaderProps {
  tenantSlug: string;
}

const nav = [
  { name: "Servicios", href: "/t/zo-system/#servicios" },
  { name: "Casos", href: "/t/zo-system/#casos" },
  { name: "Proceso", href: "/t/zo-system/#proceso" },
  { name: "Stack", href: "/t/zo-system/#stack" },
  { name: "Contacto", href: "/t/zo-system/contact" },
];

export function ZoHeader({ tenantSlug }: ZoHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 border-b ${
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur border-white/10"
          : "bg-[#0A0A0A] border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/t/${tenantSlug}`} className="flex items-center gap-2">
            <img
              src="/tenants/zo-system/logo/logo.svg"
              alt="Zo Systems"
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold tracking-tight">
              Zo Systems
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {nav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href="https://calendly.com/jagzao"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91D1D] transition-colors"
            >
              Agenda una llamada
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-gray-300 hover:text-white"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0A0A0A]">
          <nav className="flex flex-col px-4 py-4 gap-3">
            {nav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-base text-gray-300 hover:text-white py-2"
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="https://calendly.com/jagzao"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91D1D] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Agenda una llamada
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

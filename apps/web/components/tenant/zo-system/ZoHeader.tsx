"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface ZoHeaderProps {
  tenantSlug: string;
}

const nav = [
  { name: "Servicios", href: "#servicios" },
  { name: "Casos", href: "#casos" },
  { name: "Proceso", href: "#proceso" },
  { name: "Stack", href: "#stack" },
  { name: "Contacto", href: "/t/zo-system/contact" },
];

export function ZoHeader({ tenantSlug }: ZoHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    const onSection = () => {
      const ids = nav
        .filter((n) => n.href.startsWith("#"))
        .map((n) => n.href.replace("#", ""));
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = id;
        }
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onSection, { passive: true });
    onSection();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onSection);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-[#070708]/90 backdrop-blur-md border-[#282a31]"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <Link href={`/t/${tenantSlug}`} className="flex items-center gap-2.5">
            <img
              src="/tenants/zo-system/logo/logo.svg"
              alt="Zo Systems"
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold tracking-tight text-[#f5f5f7]">
              Zo Systems
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {nav.map((item) => {
              const isActive = active === item.href.replace("#", "");
              return (
                <Link
                  key={item.name}
                  href={
                    item.href.startsWith("#")
                      ? `/t/zo-system/${item.href}`
                      : item.href
                  }
                  className={`relative text-sm transition-colors ${
                    isActive
                      ? "text-[#f5f5f7]"
                      : "text-[#a7abb4] hover:text-[#f5f5f7]"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#e8343d]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:block">
            <Link
              href="https://calendly.com/jagzao"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[#e8343d] text-[#f5f5f7] text-sm font-medium shadow-[0_0_0_1px_#7d161c] hover:bg-[#ff4650] hover:shadow-[0_0_20px_-6px_#e8343d] transition-all min-h-[44px]"
            >
              Agenda una llamada
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-[#a7abb4] hover:text-[#f5f5f7]"
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
        <div className="md:hidden border-t border-[#282a31] bg-[#070708]/95 backdrop-blur-md">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {nav.map((item) => (
              <Link
                key={item.name}
                href={
                  item.href.startsWith("#")
                    ? `/t/zo-system/${item.href}`
                    : item.href
                }
                className="text-base text-[#a7abb4] hover:text-[#f5f5f7] hover:bg-[#111216] rounded-lg px-3 py-3 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="https://calendly.com/jagzao"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center px-4 py-3 rounded bg-[#e8343d] text-[#f5f5f7] text-sm font-medium hover:bg-[#ff4650] transition-colors"
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

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface TenantNavigationProps {
  tenantSlug: string;
  primaryColor?: string;
  secondaryColor?: string;
  mode?: "booking" | "catalog";
  variant?: "default" | "transparent" | "dark";
  navLinks?: { name: string; href: string; external?: boolean }[];
}

interface NavLink {
  name: string;
  href: string;
  external?: boolean;
}

export default function TenantNavigation({
  tenantSlug,
  primaryColor = "#000000",
  secondaryColor = "#1F2937",
  mode = "booking",
  variant = "default",
  navLinks,
}: TenantNavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isTransparent = variant === "transparent";
  const isDark = variant === "dark";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const buildLinks = (): NavLink[] => {
    if (navLinks && navLinks.length > 0) {
      const links: NavLink[] = [...navLinks];
      if (session && tenantSlug === "zo-system") {
        links.push({ name: "Social Post", href: `/t/${tenantSlug}/social` });
      }
      return links;
    }

    const links: NavLink[] = [
      { name: "Productos", href: `/t/${tenantSlug}/products` },
    ];

    if (mode === "booking") {
      links.push({ name: "Servicios", href: `/t/${tenantSlug}/services` });
      links.push({ name: "Reservar", href: `/t/${tenantSlug}/book` });
    }

    links.push({ name: "Contacto", href: `/t/${tenantSlug}/contact` });

    if (session && tenantSlug === "zo-system") {
      links.push({ name: "Social Post", href: `/t/${tenantSlug}/social` });
    }

    return links;
  };

  const navLinksList = buildLinks();

  const getNavStyles = () => {
    if (isDark) {
      return isScrolled
        ? "bg-[#0D0D0D]/80 backdrop-blur-md border-b border-white/5"
        : "bg-transparent";
    }
    if (isTransparent) {
      return isScrolled
        ? "bg-white/75 backdrop-blur-md border-b border-gray-200"
        : "bg-transparent";
    }
    return "bg-white/95 backdrop-blur-sm border-b border-gray-200";
  };

  const getLinkStyles = (isActive: boolean) => {
    if (isDark) {
      if (isActive) {
        return "text-[#FF8000]";
      }
      return "text-gray-300 hover:text-white";
    }
    if (isTransparent) {
      if (isActive) {
        // Wondernails fix: Use primary color or dark gray for active links on transparent light bg
        return "text-gray-900 font-bold";
      }
      // Wondernails fix: Use dark gray for inactive links
      return "text-gray-600 hover:text-gray-900";
    }
    if (isActive) {
      return "text-gray-900";
    }
    return "text-gray-500 hover:text-gray-900";
  };

  const getMobileMenuStyles = () => {
    if (isDark) {
      return "bg-[#0D0D0D] border-b border-white/10";
    }
    return "bg-white border-b border-gray-200";
  };

  const getMobileLinkStyles = (isActive: boolean) => {
    if (isDark) {
      if (isActive) {
        return "text-[#FF8000] bg-white/5";
      }
      return "text-gray-300 hover:text-white hover:bg-white/5";
    }
    if (isActive) {
      return "text-gray-900 bg-gray-100";
    }
    return "text-gray-700 hover:bg-gray-50";
  };

  return (
    <nav
      className={`transition-all duration-300 ${
        isDark ? "py-4" : isTransparent ? "py-4" : "py-3"
      } ${getNavStyles()}`}
    >
      <div className="flex items-center justify-between">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinksList.map((link) => {
            const isActive = pathname === link.href;
            return link.external ? (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium tracking-wide transition-colors duration-200 ${getLinkStyles(
                  isActive,
                )}`}
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 ${getLinkStyles(
                  isActive,
                )}`}
                style={
                  !isDark && !isTransparent && isActive
                    ? { color: primaryColor }
                    : undefined
                }
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <button
          className={`md:hidden p-2 rounded-md transition-colors ${
            isDark
              ? "text-white hover:bg-white/10"
              : isTransparent
                ? "text-white hover:bg-white/10"
                : "text-gray-900 hover:bg-gray-100"
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden overflow-hidden ${getMobileMenuStyles()}`}
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinksList.map((link) => {
                const isActive = pathname === link.href;
                return link.external ? (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-3 px-4 rounded-lg text-base font-medium transition-all ${getMobileLinkStyles(
                      isActive,
                    )}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-3 px-4 rounded-lg text-base font-medium transition-all ${getMobileLinkStyles(
                      isActive,
                    )}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
              {isDark && <div className="h-px bg-white/10 my-2" />}
              {isDark && session && (
                <Link
                  href="/t/zo-system/admin"
                  className={`py-3 px-4 rounded-lg text-base font-medium text-center transition-all ${
                    isDark
                      ? "bg-white/5 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Panel Admin
                </Link>
              )}
              {isDark && !session && (
                <Link
                  href="/t/zo-system/login"
                  className={`py-3 px-4 rounded-lg text-base font-medium text-center transition-all ${
                    isDark
                      ? "bg-white/5 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

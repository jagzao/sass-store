"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export const ZoNavbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Portafolio", href: "/t/zo-system/projects" },
    { name: "SaaS Solutions", href: "/t/zo-system/products" },
    { name: "Servicios", href: "/t/zo-system/services" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0D0D0D]/80 backdrop-blur-md border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Left: Brand (Clean SVG Logo) */}
        <Link
          href="/t/zo-system"
          className="group relative flex items-center gap-3"
        >
          <div className="relative flex items-center justify-center w-10 h-10 bg-[#FF8000]/10 rounded-full border border-[#FF8000]/20 group-hover:bg-[#FF8000]/20 transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#FF8000] drop-shadow-[0_0_8px_rgba(255,128,0,0.5)]"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M9 1v3" />
              <path d="M15 1v3" />
              <path d="M9 20v3" />
              <path d="M15 20v3" />
              <path d="M20 9h3" />
              <path d="M20 14h3" />
              <path d="M1 9h3" />
              <path d="M1 14h3" />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold text-white tracking-widest uppercase flex flex-col leading-none">
            <span>
              Zo <span className="text-[#FF8000]">System</span>
            </span>
          </span>
        </Link>

        {/* Center: Critical Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                pathname === link.href
                  ? "text-[#FF8000]"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: Action Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all duration-300"
          >
            Login
          </Link>
          <Link
            href="/t/zo-system/contact"
            className="flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold text-white bg-[#FF8000] hover:bg-[#FF6600] shadow-[0_0_15px_rgba(255,128,0,0.4)] hover:shadow-[0_0_25px_rgba(255,128,0,0.6)] transition-all duration-300 border border-[#FF8000]"
          >
            Agendar Cita
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
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
            className="md:hidden bg-[#0D0D0D] border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-[#FF8000] py-2 text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <Link
                href="/auth/signin"
                className="text-center py-3 rounded-lg bg-white/5 border border-white/10 text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/t/zo-system/contact"
                className="text-center py-3 rounded-lg bg-[#FF8000] text-white font-bold shadow-[0_0_15px_rgba(255,128,0,0.4)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Agendar Cita
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

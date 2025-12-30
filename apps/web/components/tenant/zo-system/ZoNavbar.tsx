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
        {/* Left: Brand (Glowing Logo) */}
        <Link
          href="/t/zo-system"
          className="group relative flex items-center gap-2"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#FF8000] blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300 rounded-full" />
            <span className="relative z-10 font-[family-name:var(--font-rajdhani)] text-2xl font-bold text-white tracking-widest uppercase">
              Zo <span className="text-[#FF8000]">System</span>
            </span>
          </div>
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
            className="px-5 py-2 rounded-full text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all duration-300"
          >
            Login
          </Link>
          <Link
            href="/t/zo-system/contact"
            className="px-6 py-2 rounded-full text-sm font-bold text-white bg-[#FF8000] hover:bg-[#FF6600] shadow-[0_0_15px_rgba(255,128,0,0.4)] hover:shadow-[0_0_25px_rgba(255,128,0,0.6)] transition-all duration-300 border border-[#FF8000]"
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

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export const ZoHero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-12 px-4 overflow-hidden">
      <div className="container mx-auto text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 font-[family-name:var(--font-rajdhani)] uppercase text-white drop-shadow-[0_0_15px_rgba(255,128,0,0.1)]">
            Ingeniería de Software
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              de Alto Impacto
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-[#A0A0A0] max-w-3xl mx-auto mb-12 font-[family-name:var(--font-montserrat)] leading-relaxed">
            Desde Starter Kits de nivel empresarial hasta automatización
            avanzada con IA.
            <br className="hidden md:block" />
            <span className="text-gray-400">
              Soluciones escalables construidas por un experto.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/t/zo-system/products"
              className="group relative px-8 py-4 rounded-full bg-[#FF8000] text-white font-bold text-lg tracking-wider overflow-hidden shadow-[0_0_20px_rgba(255,128,0,0.3)] hover:shadow-[0_0_40px_rgba(255,128,0,0.5)] transition-all duration-300"
            >
              <span className="relative z-10">EXPLORAR SOLUCIONES</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>

            <Link
              href="/t/zo-system/projects"
              className="group relative px-8 py-4 rounded-full border-2 border-[#EAFF00] text-[#EAFF00] font-bold text-lg tracking-wider hover:bg-[#EAFF00]/10 transition-all duration-300 shadow-[0_0_10px_rgba(234,255,0,0.1)] hover:shadow-[0_0_20px_rgba(234,255,0,0.2)]"
            >
              <span className="relative z-10">VER PROYECTOS</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements to enhance Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF8000]/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </section>
  );
};

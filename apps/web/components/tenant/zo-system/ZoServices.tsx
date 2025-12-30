"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export const ZoServices = () => {
  return (
    <section className="container mx-auto px-4 py-20 relative">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        {/* Left Content */}
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-bold text-white mb-6 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider pl-4 border-l-4 border-white">
            Servicios Expertos
          </h2>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed font-[family-name:var(--font-montserrat)]">
            Más allá del código: Consultoría estratégica, auditoría de
            arquitectura y desarrollo de equipos de alto rendimiento.
          </p>

          <div className="space-y-4 mb-10">
            {[
              "Consultoría de Arquitectura de Software",
              "Auditoría de Performance & Seguridad",
              "Mentoria para Equipos Técnicos",
              "Desarrollo de MVPs Escalables",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FF8000]" />
                <span className="text-gray-300 font-medium">{item}</span>
              </div>
            ))}
          </div>

          <Link
            href="/t/zo-system/contact"
            className="inline-block px-8 py-3 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors"
          >
            Agendar Consulta Inicial
          </Link>
        </div>

        {/* Right Content: Dashboard Preview (Floating Mockup) */}
        <div className="lg:w-1/2 relative perspective-[1000px]">
          <motion.div
            initial={{ rotateY: -10, rotateX: 5, opacity: 0 }}
            whileInView={{ rotateY: -5, rotateX: 2, opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 bg-[#161616] rounded-xl border border-white/10 shadow-2xl overflow-hidden p-4 transform transition-transform hover:scale-[1.02] duration-500 hover:border-[#FF8000]/30"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Mock Browser Header */}
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="ml-4 h-4 w-60 bg-white/5 rounded-full" />
            </div>

            {/* Mock Dashboard Body */}
            <div className="grid grid-cols-4 gap-4 h-[300px]">
              {/* Sidebar */}
              <div className="col-span-1 bg-white/5 rounded-lg p-2 space-y-2">
                <div className="h-2 w-12 bg-white/10 rounded mb-4" />
                <div className="h-6 w-full bg-[#FF8000]/20 rounded border border-[#FF8000]/30" />
                <div className="h-6 w-full bg-white/5 rounded" />
                <div className="h-6 w-full bg-white/5 rounded" />
              </div>
              {/* Main Area */}
              <div className="col-span-3 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 h-20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-white/5 p-3">
                    <div className="h-2 w-10 bg-white/20 rounded mb-2" />
                    <div className="h-6 w-20 bg-white/30 rounded" />
                  </div>
                  <div className="flex-1 h-20 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-white/5 p-3">
                    <div className="h-2 w-10 bg-white/20 rounded mb-2" />
                    <div className="h-6 w-20 bg-white/30 rounded" />
                  </div>
                </div>
                {/* Chart Area */}
                <div className="h-32 bg-white/5 rounded-lg border border-white/5 flex items-end justify-between p-4 gap-2">
                  {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-[#FF8000] opacity-50 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reflection/Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
          </motion.div>

          {/* Backdrop Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#FF8000]/10 blur-[80px] -z-10" />
        </div>
      </div>
    </section>
  );
};

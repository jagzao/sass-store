"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const projects = [
  {
    id: 1,
    title: "EcoSmart Dashboard",
    description: "IoT Energy Monitoring Platform for Enterprise",
    image: "/projects/ecosmart.jpg",
    link: "#",
    type: "Case Study",
  },
  {
    id: 2,
    title: "FinTech Vault",
    description: "High-security banking interface with biometrics",
    image: "/projects/fintech.jpg",
    link: "#",
    type: "Live Demo",
  },
  {
    id: 3,
    title: "MediCare AI",
    description: "Diagnostic assistance tool for radiologists",
    image: "/projects/medicare.jpg",
    link: "#",
    type: "Case Study",
  },
  {
    id: 4,
    title: "Urban Logistics",
    description: "Real-time fleet tracking system",
    image: "/projects/logistics.jpg",
    link: "#",
    type: "Live Demo",
  },
  {
    id: 5,
    title: "Crypto Exchange",
    description: "Decentralized trading platform UI",
    image: "/projects/crypto.jpg",
    link: "#",
    type: "Case Study",
  },
];

export const ZoProjects = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-20 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider pl-4 border-l-4 border-[#EAFF00]">
            Proyectos & Prototipos
          </h2>
          <p className="text-gray-400 pl-5 max-w-xl">
            Galería de implementaciones personalizadas y casos de éxito.
          </p>
        </div>

        {/* Scroll Controls (Visual indication) */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() =>
              scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })
            }
            className="p-2 rounded-full border border-white/10 hover:bg-white/10 text-white transition-colors"
          >
            ←
          </button>
          <button
            onClick={() =>
              scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })
            }
            className="p-2 rounded-full border border-white/10 hover:bg-white/10 text-white transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-10 px-4 md:px-20 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="flex-shrink-0 w-[300px] md:w-[400px] snap-center"
          >
            <div className="group relative bg-[#111111] rounded-xl overflow-hidden border border-white/5 hover:border-[#EAFF00]/50 transition-all duration-300">
              {/* Aspect Ratio Box */}
              <div className="aspect-[4/3] bg-[#000] relative overflow-hidden">
                {/* Placeholder for project image */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-gray-600 font-[family-name:var(--font-rajdhani)] text-4xl font-bold opacity-30 group-hover:scale-105 transition-transform duration-500">
                  {project.title.substring(0, 2)}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Link
                    href={project.link}
                    className="px-6 py-2 rounded-full border border-[#EAFF00] text-[#EAFF00] font-bold hover:bg-[#EAFF00] hover:text-black transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                  >
                    {project.type === "Live Demo"
                      ? "▶ Live Demo"
                      : "Read Case Study"}
                  </Link>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white font-[family-name:var(--font-rajdhani)]">
                    {project.title}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
                    {project.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{project.description}</p>
              </div>

              {/* Neon Glow Lines */}
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#EAFF00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
        ))}
        {/* Spacer for end of list */}
        <div className="w-[10px] flex-shrink-0" />
      </div>
    </section>
  );
};

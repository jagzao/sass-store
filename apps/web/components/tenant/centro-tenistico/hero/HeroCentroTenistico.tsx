"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CTV_CLAY_ORANGE,
  CTV_CLAY_ORANGE_SOFT,
} from "@/lib/design/centro-tenistico-brand";

const SLIDES = [
  {
    id: "courts",
    badge: "DISPONIBLE HOY",
    title: "Canchas de Tenis",
    subtitle: "Profesionales",
    description:
      "8 canchas con superficie de clay y hard court. Iluminación LED para juego nocturno.",
    price: "$45",
    unit: "/ hora",
    cta: "Reservar Cancha",
    ctaSecondary: "Ver disponibilidad",
    stat: "8 canchas",
    statLabel: "siempre disponibles",
    accent: CTV_CLAY_ORANGE,
  },
  {
    id: "lessons",
    badge: "CUPO LIMITADO",
    title: "Clases Privadas",
    subtitle: "con Entrenador Certificado",
    description:
      "Perfecciona tu técnica con nuestros entrenadores certificados. Todos los niveles.",
    price: "$120",
    unit: "/ sesión",
    cta: "Reservar Clase",
    ctaSecondary: "Conoce a los coaches",
    stat: "12 años",
    statLabel: "de experiencia",
    accent: "#047857",
  },
  {
    id: "group",
    badge: "MÁS POPULAR",
    title: "Clases Grupales",
    subtitle: "Aprende en comunidad",
    description:
      "Sesiones grupales de 90 minutos. Ideal para principiantes y nivel intermedio.",
    price: "$35",
    unit: "/ persona",
    cta: "Unirse al Grupo",
    ctaSecondary: "Ver horarios",
    stat: "20+ alumnos",
    statLabel: "esta semana",
    accent: "#9A6B3B",
  },
];

const AUTOPLAY_INTERVAL = 6000;

export default function HeroCentroTenistico() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const slide = SLIDES[activeIndex];

  const startAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_INTERVAL);
  };

  useEffect(() => {
    if (isAutoPlaying) startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section
      className="relative min-h-[92vh] flex flex-col overflow-hidden"
      style={{ backgroundColor: "#F0FDF4" }}
    >
      {/* Court pattern background */}
      <CourtPattern accent={slide.accent} />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Badge */}
                <motion.span
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest"
                  style={{
                    backgroundColor: `${slide.accent}18`,
                    color: slide.accent,
                    border: `1px solid ${slide.accent}30`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: slide.accent }}
                  />
                  {slide.badge}
                </motion.span>

                {/* Headline */}
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight"
                    style={{ color: "#1F2937" }}
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl sm:text-2xl font-medium mt-2"
                    style={{ color: slide.accent }}
                  >
                    {slide.subtitle}
                  </motion.p>
                </div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-base sm:text-lg leading-relaxed max-w-md"
                  style={{ color: "#4B5563" }}
                >
                  {slide.description}
                </motion.p>

                {/* Price */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-baseline gap-1"
                >
                  <span
                    className="text-5xl font-black"
                    style={{ color: slide.accent }}
                  >
                    {slide.price}
                  </span>
                  <span
                    className="text-lg font-medium"
                    style={{ color: "#6B7280" }}
                  >
                    {slide.unit}
                  </span>
                </motion.div>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-wrap gap-3 pt-2"
                >
                  <a
                    href={`/t/centro-tenistico/bookings`}
                    className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                    style={{
                      backgroundColor: slide.accent,
                      boxShadow: `0 4px 14px ${slide.accent}40`,
                    }}
                  >
                    {slide.cta}
                  </a>
                  <a
                    href={`/t/centro-tenistico/services`}
                    className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: "white",
                      color: slide.accent,
                      border: `1.5px solid ${slide.accent}40`,
                    }}
                  >
                    {slide.ctaSecondary}
                  </a>
                </motion.div>

                {/* Stat */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 pt-2"
                >
                  <div
                    className="w-8 h-0.5 rounded"
                    style={{ backgroundColor: slide.accent }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: slide.accent }}
                  >
                    {slide.stat}
                  </span>
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>
                    {slide.statLabel}
                  </span>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Right — Visual card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`card-${slide.id}`}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -8 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="hidden lg:block"
              >
                <ServiceVisualCard slide={slide} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="relative z-10 flex justify-center gap-3 pb-8">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Ir a ${s.title}`}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? "32px" : "8px",
              backgroundColor:
                i === activeIndex ? slide.accent : `${slide.accent}40`,
            }}
          />
        ))}
      </div>

      {/* Slide tabs — desktop */}
      <div className="relative z-10 border-t border-white/60 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex divide-x divide-gray-200/60">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className="flex-1 px-4 py-4 text-left transition-all duration-200 group"
                style={{
                  backgroundColor:
                    i === activeIndex ? `${s.accent}08` : "transparent",
                }}
              >
                <div
                  className="h-0.5 mb-3 rounded transition-all duration-300"
                  style={{
                    backgroundColor:
                      i === activeIndex ? s.accent : "transparent",
                    width: i === activeIndex ? "100%" : "0%",
                  }}
                />
                <p
                  className="text-xs font-semibold tracking-wide uppercase truncate"
                  style={{
                    color: i === activeIndex ? s.accent : "#9CA3AF",
                  }}
                >
                  {s.title}
                </p>
                <p
                  className="text-lg font-black mt-0.5"
                  style={{ color: i === activeIndex ? "#1F2937" : "#D1D5DB" }}
                >
                  {s.price}
                  <span className="text-xs font-normal ml-1">{s.unit}</span>
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CourtPattern({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large circle bg */}
      <div
        className="absolute -right-32 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ backgroundColor: accent }}
      />
      {/* Court lines — right side */}
      <svg
        className="absolute right-0 top-0 h-full opacity-[0.06]"
        width="480"
        viewBox="0 0 480 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Outer court */}
        <rect
          x="60"
          y="80"
          width="360"
          height="640"
          stroke={accent}
          strokeWidth="3"
        />
        {/* Net line */}
        <line
          x1="60"
          y1="400"
          x2="420"
          y2="400"
          stroke={accent}
          strokeWidth="3"
        />
        {/* Service boxes */}
        <line
          x1="60"
          y1="240"
          x2="420"
          y2="240"
          stroke={accent}
          strokeWidth="2"
        />
        <line
          x1="60"
          y1="560"
          x2="420"
          y2="560"
          stroke={accent}
          strokeWidth="2"
        />
        {/* Center service line */}
        <line
          x1="240"
          y1="240"
          x2="240"
          y2="560"
          stroke={accent}
          strokeWidth="2"
        />
        {/* Center mark */}
        <line
          x1="225"
          y1="400"
          x2="255"
          y2="400"
          stroke={accent}
          strokeWidth="3"
        />
        {/* Singles sidelines */}
        <line
          x1="120"
          y1="80"
          x2="120"
          y2="720"
          stroke={accent}
          strokeWidth="1.5"
        />
        <line
          x1="360"
          y1="80"
          x2="360"
          y2="720"
          stroke={accent}
          strokeWidth="1.5"
        />
      </svg>
      {/* Subtle mesh grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function ServiceVisualCard({ slide }: { slide: (typeof SLIDES)[number] }) {
  return (
    <div className="relative">
      {/* Glow */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl"
        style={{ backgroundColor: slide.accent }}
      />

      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${slide.accent}15 0%, white 60%)`,
          border: `1px solid ${slide.accent}20`,
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: slide.accent }}
        />

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: slide.accent }}
              >
                {slide.badge}
              </p>
              <h3
                className="text-2xl font-black mt-1"
                style={{ color: "#1F2937" }}
              >
                {slide.title}
              </h3>
              <p
                className="text-sm font-medium"
                style={{ color: slide.accent }}
              >
                {slide.subtitle}
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0"
              style={{ backgroundColor: slide.accent }}
            >
              {slide.id === "courts" ? "C" : slide.id === "lessons" ? "L" : "G"}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            {slide.description}
          </p>

          {/* Features */}
          <ul className="space-y-2">
            {getFeatures(slide.id).map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#374151" }}
              >
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: slide.accent }}
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* Price row */}
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{
              backgroundColor: `${slide.accent}08`,
              border: `1px solid ${slide.accent}15`,
            }}
          >
            <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
              Precio desde
            </span>
            <div className="text-right">
              <span
                className="text-3xl font-black"
                style={{ color: slide.accent }}
              >
                {slide.price}
              </span>
              <span className="text-sm" style={{ color: "#9CA3AF" }}>
                {slide.unit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFeatures(id: string): string[] {
  switch (id) {
    case "courts":
      return [
        "Surface clay y hard court",
        "Iluminación LED nocturna",
        "Equipo incluido disponible",
      ];
    case "lessons":
      return [
        "Entrenador certificado ITF",
        "Video análisis de técnica",
        "Plan personalizado de mejora",
      ];
    case "group":
      return [
        "Máximo 8 jugadores por grupo",
        "Material pedagógico incluido",
        "Todos los niveles bienvenidos",
      ];
    default:
      return [];
  }
}

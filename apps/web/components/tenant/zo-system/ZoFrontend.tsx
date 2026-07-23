"use client";

import { useEffect, useRef, useState } from "react";
import {
  Palette,
  Layout,
  Sparkles,
  MonitorSmartphone,
  ArrowRight,
} from "lucide-react";

const points = [
  {
    icon: Layout,
    title: "Interfaces enfocadas en conversión",
    description:
      "Diseñamos flujos claros que guían al usuario y reducen fricción en acciones clave.",
  },
  {
    icon: Palette,
    title: "Diseño UI alineado al negocio",
    description:
      "Cada componente respeta la marca, el tono y los objetivos comerciales del producto.",
  },
  {
    icon: Sparkles,
    title: "Animaciones sutiles con intención",
    description:
      "Motion design que mejora la percepción de calidad sin distraer del contenido.",
  },
  {
    icon: MonitorSmartphone,
    title: "Experiencias web premium y responsivas",
    description:
      "Componentes adaptables, tipografía cuidada y ritmo visual consistente en todos los dispositivos.",
  },
];

// Mosaico de gradients + nombre representando "trabajo visual pulido".
// ponytail: sin assets externos — gradients CSS para no agregar peso.
type VisualPattern = "radial" | "grid" | "dots" | "wave";
const visualSamples: ReadonlyArray<{
  title: string;
  gradient: string;
  pattern: VisualPattern;
}> = [
  {
    title: "Brand Experience",
    gradient: "from-[#e8343d] via-[#ff4650] to-[#c9a24e]",
    pattern: "radial",
  },
  {
    title: "Admin Platform",
    gradient: "from-[#3b82f6] via-[#6366f1] to-[#8b5cf6]",
    pattern: "grid",
  },
  {
    title: "Booking UX",
    gradient: "from-[#22c55e] via-[#10b981] to-[#0d9488]",
    pattern: "dots",
  },
  {
    title: "Motion Design",
    gradient: "from-[#f59e0b] via-[#ef4444] to-[#ec4899]",
    pattern: "wave",
  },
];

export function ZoFrontend() {
  return (
    <section className="relative bg-[#070708] py-24 lg:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#e8343d]/30 to-transparent" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#c9a24e]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider">
              Frontend & product experience
            </p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
              Diseño y desarrollo con enfoque de producto
            </h2>
            <p className="mt-5 text-lg text-[#a7abb4] leading-relaxed">
              Zo Systems no solo construye backend y arquitectura. También
              entrega interfaces pulidas, coherentes y pensadas para el negocio.
            </p>

            {/* Mosaico de visuales (gradients animados) */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {visualSamples.map((sample, i) => (
                <VisualTile key={sample.title} sample={sample} index={i} />
              ))}
            </div>

            <a
              href="/t/zo-system/#casos"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#e8343d] hover:text-[#ff4650] transition-colors"
            >
              Ver proyectos con fuerte componente visual
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {points.map((point, i) => {
              const Icon = point.icon;
              return (
                <AnimatedCard key={point.title} index={i}>
                  <div className="p-5 rounded-xl border border-[#282a31] bg-[#111216] hover:border-[#e8343d]/40 transition-colors h-full">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#7d161c]/40 text-[#e8343d] border border-[#7d161c] mb-4">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f5f7]">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#a7abb4] leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Card con animación de entrada al hacer scroll (fade + translate).
 */
function AnimatedCard({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transform: inView ? "translateY(0)" : "translateY(24px)",
        opacity: inView ? 1 : 0,
        transition: `transform 0.6s ease-out ${index * 0.12}s, opacity 0.6s ease-out ${index * 0.12}s`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Tile visual con gradient animado según `pattern`.
 */
function VisualTile({
  sample,
  index,
}: {
  sample: { title: string; gradient: string; pattern: VisualPattern };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative aspect-[4/3] rounded-lg overflow-hidden border border-[#282a31] bg-gradient-to-br ${sample.gradient}`}
      style={{
        transform: inView ? "scale(1)" : "scale(0.92)",
        opacity: inView ? 1 : 0,
        transition: `transform 0.5s ease-out ${index * 0.1}s, opacity 0.5s ease-out ${index * 0.1}s`,
      }}
    >
      <PatternOverlay pattern={sample.pattern} />
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-[11px] font-medium text-white/90 uppercase tracking-wider">
          {sample.title}
        </span>
      </div>
    </div>
  );
}

/**
 * Overlay con patrón geométrico animado según el tipo.
 */
function PatternOverlay({
  pattern,
}: {
  pattern: "radial" | "grid" | "dots" | "wave";
}) {
  if (pattern === "radial") {
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            animation: "zo-tile-pulse 3s ease-in-out infinite",
          }}
        />
        <style>{`
          @keyframes zo-tile-pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }
  if (pattern === "grid") {
    return (
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          animation: "zo-tile-grid 8s linear infinite",
        }}
      >
        <style>{`
          @keyframes zo-tile-grid {
            0% { background-position: 0 0; }
            100% { background-position: 20px 20px; }
          }
        `}</style>
      </div>
    );
  }
  if (pattern === "dots") {
    return (
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1.5px, transparent 1.5px)",
          backgroundSize: "14px 14px",
          animation: "zo-tile-dots 4s ease-in-out infinite",
        }}
      >
        <style>{`
          @keyframes zo-tile-dots {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }
  // wave
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-40"
      >
        <path
          d="M0,30 Q25,10 50,30 T100,30 L100,60 L0,60 Z"
          fill="rgba(255,255,255,0.15)"
          style={{
            animation: "zo-tile-wave 4s ease-in-out infinite",
            transformOrigin: "center",
          }}
        />
      </svg>
      <style>{`
        @keyframes zo-tile-wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-8px); }
        }
      `}</style>
    </div>
  );
}

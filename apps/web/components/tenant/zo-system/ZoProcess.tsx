"use client";

import { useEffect, useRef, useState } from "react";
import { Search, FileText, Code2, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Descubrimiento",
    description:
      "Entendemos el problema, los usuarios, procesos actuales y objetivos del negocio.",
    color: "#e8343d",
  },
  {
    icon: FileText,
    number: "02",
    title: "Propuesta técnica",
    description:
      "Definimos alcance, arquitectura, entregables, riesgos y plan de implementación.",
    color: "#c9a24e",
  },
  {
    icon: Code2,
    number: "03",
    title: "Desarrollo iterativo",
    description:
      "Trabajamos por entregas cortas, demos frecuentes, pruebas automatizadas y seguimiento transparente.",
    color: "#3b82f6",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Lanzamiento y soporte",
    description:
      "Desplegamos, documentamos, monitoreamos y damos soporte para evolucionar la solución.",
    color: "#22c55e",
  },
];

export function ZoProcess() {
  return (
    <section id="proceso" className="relative bg-[#070708] py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider">
            Proceso
          </p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
            Cómo trabajamos
          </h2>
          <p className="mt-4 text-lg text-[#a7abb4]">
            Un proceso claro para reducir riesgo, mantener transparencia y
            entregar valor desde la primera semana.
          </p>
        </div>

        <div className="mt-16 hidden lg:block">
          <div className="relative">
            {/* Línea conectora con gradiente animado */}
            <div className="absolute top-[2.25rem] left-[12%] right-[12%] h-px overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#282a31] via-[#7d161c] to-[#282a31]" />
              <div
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-[#e8343d] to-transparent"
                style={{
                  animation: "zo-process-flow 4s linear infinite",
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <ProcessStepDesktop
                    key={step.number}
                    step={step}
                    icon={Icon}
                    index={i}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-14 lg:hidden">
          <div className="relative space-y-10 pl-8">
            <div className="absolute left-[1.25rem] top-3 bottom-3 w-px bg-gradient-to-b from-[#7d161c] via-[#282a31] to-[#282a31]" />
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <ProcessStepMobile
                  key={step.number}
                  step={step}
                  icon={Icon}
                  index={i}
                />
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes zo-process-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes zo-step-enter {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes zo-step-glow {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; }
          50% { box-shadow: 0 0 20px 4px currentColor; }
        }
      `}</style>
    </section>
  );
}

interface StepType {
  number: string;
  title: string;
  description: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T>(null);
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
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function ProcessStepDesktop({
  step,
  icon: Icon,
  index,
}: {
  step: StepType;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="relative text-center"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`,
      }}
    >
      <div
        className="relative z-10 mx-auto mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#111216] border border-[#282a31]"
        style={{
          color: step.color,
          borderColor: `${step.color}50`,
          boxShadow: inView ? `0 0 24px -4px ${step.color}60` : "none",
          transition: `box-shadow 0.6s ease-out ${index * 0.15 + 0.3}s`,
        }}
      >
        <Icon className="w-6 h-6" aria-hidden="true" />
        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            border: `1px solid ${step.color}`,
            animation: `zo-step-glow 3s ease-in-out ${index * 0.5}s infinite`,
            color: step.color,
          }}
        />
      </div>
      <div className="text-sm font-mono text-[#c9a24e] mb-2">{step.number}</div>
      <h3 className="text-lg font-semibold text-[#f5f5f7]">{step.title}</h3>
      <p className="mt-2 text-sm text-[#a7abb4] leading-relaxed">
        {step.description}
      </p>
    </div>
  );
}

function ProcessStepMobile({
  step,
  icon: Icon,
  index,
}: {
  step: StepType;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="relative"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-12px)",
        transition: `opacity 0.5s ease-out ${index * 0.12}s, transform 0.5s ease-out ${index * 0.12}s`,
      }}
    >
      <div
        className="absolute -left-[2.05rem] top-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#111216] border"
        style={{
          color: step.color,
          borderColor: `${step.color}50`,
        }}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="text-sm font-mono text-[#c9a24e] mb-1">{step.number}</div>
      <h3 className="text-lg font-semibold text-[#f5f5f7]">{step.title}</h3>
      <p className="mt-1 text-sm text-[#a7abb4] leading-relaxed">
        {step.description}
      </p>
    </div>
  );
}

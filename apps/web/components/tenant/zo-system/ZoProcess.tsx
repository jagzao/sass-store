import { Search, FileText, Code2, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Descubrimiento",
    description:
      "Entendemos el problema, los usuarios, procesos actuales y objetivos del negocio.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Propuesta técnica",
    description:
      "Definimos alcance, arquitectura, entregables, riesgos y plan de implementación.",
  },
  {
    icon: Code2,
    number: "03",
    title: "Desarrollo iterativo",
    description:
      "Trabajamos por entregas cortas, demos frecuentes, pruebas automatizadas y seguimiento transparente.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Lanzamiento y soporte",
    description:
      "Desplegamos, documentamos, monitoreamos y damos soporte para evolucionar la solución.",
  },
];

export function ZoProcess() {
  return (
    <section id="proceso" className="bg-[#0A0A0A] py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[#DC2626] uppercase tracking-wider">
            Proceso
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Cómo trabajamos
          </h2>
          <p className="mt-4 text-gray-400">
            Un proceso claro para reducir riesgo, mantener transparencia y
            entregar valor desde la primera semana.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-xl border border-white/10 bg-[#111111] p-6"
              >
                <div className="text-xs font-mono text-[#F59E0B] mb-4">
                  {step.number}
                </div>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-white mb-4">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

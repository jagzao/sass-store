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
            <div className="absolute top-[2.25rem] left-[12%] right-[12%] h-px bg-gradient-to-r from-[#282a31] via-[#7d161c] to-[#282a31]" />
            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative text-center">
                    <div className="relative z-10 mx-auto mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#111216] border border-[#282a31] text-[#e8343d]">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="text-sm font-mono text-[#c9a24e] mb-2">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-[#f5f5f7]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#a7abb4] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-14 lg:hidden">
          <div className="relative space-y-10 pl-8">
            <div className="absolute left-[1.25rem] top-3 bottom-3 w-px bg-gradient-to-b from-[#7d161c] via-[#282a31] to-[#282a31]" />
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  <div className="absolute -left-[2.05rem] top-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#111216] border border-[#282a31] text-[#e8343d]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-sm font-mono text-[#c9a24e] mb-1">
                    {step.number}
                  </div>{" "}
                  <h3 className="text-lg font-semibold text-[#f5f5f7]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#a7abb4] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

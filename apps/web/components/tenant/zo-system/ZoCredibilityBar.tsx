import { CheckCircle2 } from "lucide-react";

const items = [
  "10+ años de experiencia",
  "Desarrollo remoto para equipos internacionales",
  "Especialización en SaaS, ERP, HR, Payroll y finanzas",
  "Arquitecturas multi-tenant",
  "Integraciones cloud y automatizaciones con IA",
];

export function ZoCredibilityBar() {
  return (
    <section className="border-y border-white/10 bg-[#0E0E0E]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <CheckCircle2
                className="w-4 h-4 text-[#DC2626]"
                aria-hidden="true"
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

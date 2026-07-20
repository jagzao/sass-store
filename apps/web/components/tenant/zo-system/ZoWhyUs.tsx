import { Check } from "lucide-react";

const differentiators = [
  "Experiencia senior directamente involucrada.",
  "Comunicación directa, sin intermediarios innecesarios.",
  "Arquitectura pensada para crecimiento.",
  "Código mantenible y documentado.",
  "Seguridad y calidad desde el inicio.",
  "Uso responsable de inteligencia artificial para acelerar el desarrollo.",
  "Experiencia con productos empresariales y equipos internacionales.",
];

export function ZoWhyUs() {
  return (
    <section className="bg-[#0E0E0E] py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#DC2626] uppercase tracking-wider">
              Por qué Zo Systems
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Un estudio boutique con experiencia senior
            </h2>
            <p className="mt-4 text-gray-400">
              No somos una agencia grande. Trabajas directamente con un
              desarrollador senior que ha construido software empresarial
              durante más de una década.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {differentiators.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-4 rounded-lg border border-white/10 bg-[#111111]"
              >
                <div className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#DC2626]/10 text-[#DC2626]">
                  <Check className="w-3 h-3" aria-hidden="true" />
                </div>
                <span className="text-sm text-gray-300 leading-snug">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Check } from "lucide-react";

const differentiators = [
  { label: "Experiencia senior directamente involucrada." },
  { label: "Comunicación directa, sin intermediarios innecesarios." },
  { label: "Arquitectura pensada para crecimiento." },
  { label: "Código mantenible y documentado." },
  { label: "Seguridad y calidad desde el inicio." },
  { label: "Uso responsable de IA para acelerar el desarrollo." },
  {
    label: "Experiencia con productos empresariales y equipos internacionales.",
  },
];

export function ZoWhyUs() {
  return (
    <section className="relative bg-[#0d0e11] py-24 lg:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#e8343d]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider">
              Por qué Zo Systems
            </p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
              Un estudio boutique de software liderado por experiencia senior
            </h2>
            <p className="mt-5 text-lg text-[#a7abb4] leading-relaxed">
              No somos una agencia grande. Trabajas directamente con un
              desarrollador senior que ha construido software empresarial
              durante más de una década.
            </p>
            <p className="mt-4 text-[#a7abb4]">
              El desarrollo está dirigido personalmente, con comunicación
              directa, sin capas innecesarias de intermediarios. Se prioriza
              arquitectura, mantenibilidad y resultados medibles.
            </p>

            {
              // Human visual placeholder. Replace with professional photo if available.
              // Do NOT use AI-generated avatars.
            }
            <div className="mt-8 hidden lg:flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#111216] border border-[#282a31] flex items-center justify-center text-[#c9a24e]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-[#f5f5f7]">
                  Fotografía profesional pendiente
                </div>
                <div className="text-xs text-[#737782]">
                  Reemplazar con imagen real del fundador. No usar avatares de
                  IA.
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {differentiators.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4 p-5 rounded-xl border border-[#282a31] bg-[#111216]"
              >
                <div className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#7d161c]/40 text-[#e8343d] shrink-0">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span className="text-[#a7abb4] leading-snug">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

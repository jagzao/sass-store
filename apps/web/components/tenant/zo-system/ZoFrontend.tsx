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
            <a
              href="/t/zo-system/#casos"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#e8343d] hover:text-[#ff4650] transition-colors"
            >
              Ver proyectos con fuerte componente visual
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {points.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  className="p-5 rounded-xl border border-[#282a31] bg-[#111216] hover:border-[#e8343d]/40 transition-colors"
                >
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

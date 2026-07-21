import Link from "next/link";

export function ZoCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7d161c]/30 via-[#070708] to-[#070708]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#e8343d]/10 rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c9a24e]/30 bg-[#c9a24e]/10 text-[#c9a24e] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a24e]" />
          Disponibilidad limitada para nuevos proyectos
        </div>

        <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
          ¿Tienes un sistema que necesitas construir, modernizar o rescatar?
        </h2>
        <p className="mt-5 text-lg sm:text-xl text-[#a7abb4] max-w-2xl mx-auto">
          Cuéntanos qué problema necesitas resolver y revisaremos contigo la
          mejor estrategia técnica.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://calendly.com/jagzao"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-7 py-4 rounded-lg bg-[#f5f5f7] text-[#070708] font-semibold shadow-[0_8px_24px_-8px_rgba(245,245,247,0.25)] hover:bg-white hover:-translate-y-0.5 transition-all min-h-[48px]"
          >
            Agenda una llamada
          </a>
          <Link
            href="/t/zo-system/contact"
            className="inline-flex items-center justify-center px-7 py-4 rounded-lg border border-[#f5f5f7]/30 text-[#f5f5f7] font-medium hover:bg-[#f5f5f7]/10 transition-all min-h-[48px]"
          >
            Enviar mensaje
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export function ZoCTA() {
  return (
    <section className="bg-[#0E0E0E] py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          ¿Tienes un sistema que necesitas construir, modernizar o rescatar?
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Cuéntanos qué problema necesitas resolver y revisaremos contigo la
          mejor estrategia técnica.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://calendly.com/jagzao"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#DC2626] text-white font-medium hover:bg-[#B91D1D] transition-colors"
          >
            Agenda una llamada
          </a>
          <Link
            href="/t/zo-system/contact"
            className="inline-flex items-center justify-center px-6 py-3 rounded border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
          >
            Enviar mensaje
          </Link>
        </div>
      </div>
    </section>
  );
}

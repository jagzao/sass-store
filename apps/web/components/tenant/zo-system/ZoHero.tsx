export function ZoHero() {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
              Software B2B que automatiza operaciones y escala con tu negocio
            </h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed">
              Desarrollamos plataformas SaaS, modernizamos aplicaciones .NET e
              integramos automatizaciones con inteligencia artificial para
              empresas de operaciones, finanzas y servicios.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="https://calendly.com/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded bg-[#DC2626] text-white font-medium hover:bg-[#B91D1D] transition-colors"
              >
                Agenda una llamada
              </a>
              <a
                href="/t/zo-system/#casos"
                className="inline-flex items-center justify-center px-6 py-3 rounded border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
              >
                Ver casos reales
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              10+ años desarrollando soluciones con .NET, React, Vue, Azure y
              PostgreSQL para equipos internacionales.
            </p>
          </div>

          <div className="relative">
            <div className="relative rounded-lg border border-white/10 bg-[#111111] p-4 shadow-2xl">
              <div className="absolute -inset-px rounded-lg bg-gradient-to-br from-[#DC2626]/20 via-transparent to-[#F59E0B]/10" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Dashboard de operaciones</span>
                  <span className="px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626]">
                    En producción
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Ingresos", value: "$1.2M" },
                    { label: "Usuarios activos", value: "8,420" },
                    { label: "Tareas automatizadas", value: "124k" },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded bg-[#1A1A1A] p-3 border border-white/5"
                    >
                      <div className="text-xs text-gray-500">{k.label}</div>
                      <div className="text-lg font-semibold text-white mt-1">
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded bg-[#1A1A1A] p-3 border border-white/5 h-40 flex items-end gap-2">
                  {[40, 65, 50, 85, 60, 90, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-[#DC2626] to-[#F59E0B] opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {["React", ".NET", "PostgreSQL", "Azure"].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 border border-white/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

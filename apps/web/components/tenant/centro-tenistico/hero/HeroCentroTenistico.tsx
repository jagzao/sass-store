"use client";

const GROUP_ACCENT = "#9A6B3B";

/**
 * Hero fijo — Clases Grupales ($35). Texto izquierda (45%), cuadrante derecho libre para la pelota.
 */
export default function HeroCentroTenistico() {
  return (
    <section className="content-section relative min-h-[100vh] flex flex-col overflow-hidden">
      <div className="relative z-10 flex flex-1 items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="ctv-content-left ctv-scrolly-panel ctv-scrolly-panel--soft p-6 sm:p-8 space-y-6">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest"
              style={{
                backgroundColor: `${GROUP_ACCENT}18`,
                color: GROUP_ACCENT,
                border: `1px solid ${GROUP_ACCENT}30`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: GROUP_ACCENT }}
              />
              MÁS POPULAR
            </span>

            <div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight"
                style={{ color: "#1F2937" }}
              >
                Clases Grupales
              </h1>
              <p
                className="text-xl sm:text-2xl font-medium mt-2"
                style={{ color: GROUP_ACCENT }}
              >
                Aprende en comunidad
              </p>
            </div>

            <p
              className="text-base sm:text-lg leading-relaxed"
              style={{ color: "#4B5563" }}
            >
              Sesiones grupales de 90 minutos. Ideal para principiantes y nivel
              intermedio.
            </p>

            <div className="flex items-baseline gap-1">
              <span
                className="text-5xl font-black"
                style={{ color: GROUP_ACCENT }}
              >
                $35
              </span>
              <span
                className="text-lg font-medium"
                style={{ color: "#6B7280" }}
              >
                / persona
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/t/centro-tenistico/bookings"
                className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                style={{
                  backgroundColor: GROUP_ACCENT,
                  boxShadow: `0 4px 14px ${GROUP_ACCENT}40`,
                }}
                data-testid="ctv-hero-cta-group"
              >
                Unirse al Grupo
              </a>
              <a
                href="/t/centro-tenistico/services"
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] bg-white"
                style={{
                  color: GROUP_ACCENT,
                  border: `1.5px solid ${GROUP_ACCENT}40`,
                }}
              >
                Ver horarios
              </a>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div
                className="w-8 h-0.5 rounded"
                style={{ backgroundColor: GROUP_ACCENT }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: GROUP_ACCENT }}
              >
                20+ alumnos
              </span>
              <span className="text-sm" style={{ color: "#9CA3AF" }}>
                esta semana
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

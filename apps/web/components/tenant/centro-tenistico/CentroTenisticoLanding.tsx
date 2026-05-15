import { Suspense } from "react";
import { fetchRevalidating } from "@/lib/api/fetch-with-cache";
import type { Service } from "@/types/tenant";
import { CTV_CLAY_ORANGE } from "@/lib/design/centro-tenistico-brand";
import HeroCentroTenistico from "./hero/HeroCentroTenistico";

interface Props {
  tenantSlug: string;
}

const PRIMARY = CTV_CLAY_ORANGE;

export default async function CentroTenisticoLanding({ tenantSlug }: Props) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0FDF4" }}>
      <HeroCentroTenistico />

      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesSection tenantSlug={tenantSlug} />
      </Suspense>

      <HowItWorksSection />
      <CTASection />
      <InfoSection />
    </div>
  );
}

async function ServicesSection({ tenantSlug }: { tenantSlug: string }) {
  const res = await fetchRevalidating<{ data: Service[] }>(
    `/api/v1/public/services?tenant=${tenantSlug}&limit=6`,
    ["services", tenantSlug],
  );

  const services = res?.data ?? [];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: PRIMARY }}
          >
            Lo que ofrecemos
          </p>
          <h2 className="text-4xl font-black" style={{ color: "#1F2937" }}>
            Servicios y Canchas
          </h2>
          <p className="mt-4 text-base" style={{ color: "#6B7280" }}>
            Todo lo que necesitas para disfrutar y mejorar tu juego
          </p>
        </div>

        {/* Cards */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <TennisServiceCard
                key={s.id}
                name={s.name}
                description={s.description ?? ""}
                price={Number(s.price)}
                duration={s.duration}
                tenantSlug={tenantSlug}
                id={s.id}
              />
            ))}
          </div>
        ) : (
          <StaticServiceCards />
        )}
      </div>
    </section>
  );
}

function TennisServiceCard({
  name,
  description,
  price,
  duration,
  tenantSlug,
  id,
}: {
  name: string;
  description: string;
  price: number;
  duration?: number;
  tenantSlug: string;
  id: string;
}) {
  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        border: `1px solid #E5E7EB`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Top bar */}
      <div className="h-1" style={{ backgroundColor: PRIMARY }} />

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-lg font-bold leading-tight"
            style={{ color: "#1F2937" }}
          >
            {name}
          </h3>
          {duration && (
            <span
              className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${PRIMARY}12`,
                color: PRIMARY,
              }}
            >
              {duration} min
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
          {description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-2xl font-black" style={{ color: PRIMARY }}>
            ${price.toFixed(0)}
          </span>
          <a
            href={`/t/${tenantSlug}/bookings?service=${id}`}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{ backgroundColor: PRIMARY }}
          >
            Reservar
          </a>
        </div>
      </div>
    </div>
  );
}

function StaticServiceCards() {
  const items = [
    {
      name: "Court Rental",
      description:
        "Cancha de tenis por hora. Clay y hard court disponibles con iluminación LED.",
      price: 45,
      duration: 60,
    },
    {
      name: "Clase Privada",
      description:
        "Sesión individual con entrenador certificado ITF. Video análisis incluido.",
      price: 120,
      duration: 60,
    },
    {
      name: "Clase Grupal",
      description:
        "Aprende en grupo de máximo 8 personas. Todos los niveles bienvenidos.",
      price: 35,
      duration: 90,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <TennisServiceCard
          key={item.name}
          id=""
          name={item.name}
          description={item.description}
          price={item.price}
          duration={item.duration}
          tenantSlug="centro-tenistico"
        />
      ))}
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Elige tu servicio",
      description:
        "Selecciona la cancha, clase privada o grupal que mejor se adapte a tu nivel.",
    },
    {
      number: "02",
      title: "Selecciona horario",
      description:
        "Revisa la disponibilidad en tiempo real y elige el horario que más te convenga.",
    },
    {
      number: "03",
      title: "Confirma tu reserva",
      description:
        "Recibe confirmación inmediata por correo y llega listo para jugar.",
    },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: "#F0FDF4" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: PRIMARY }}
          >
            Proceso simple
          </p>
          <h2 className="text-4xl font-black" style={{ color: "#1F2937" }}>
            Reserva en 3 pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5"
            style={{ backgroundColor: `${PRIMARY}30` }}
          />

          {steps.map((step, i) => (
            <div key={i} className="text-center relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6 shadow-lg"
                style={{
                  backgroundColor: PRIMARY,
                  boxShadow: `0 8px 24px ${PRIMARY}30`,
                }}
              >
                {step.number}
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: "#1F2937" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#6B7280" }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section
      className="py-20 relative overflow-hidden"
      style={{ backgroundColor: PRIMARY }}
    >
      {/* Background tennis lines */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="50%"
            y1="0"
            x2="50%"
            y2="100%"
            stroke="white"
            strokeWidth="2"
          />
          <rect
            x="25%"
            y="20%"
            width="50%"
            height="60%"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-white/70 mb-4">
          Únete hoy
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
          Empieza a jugar
          <br />
          <span style={{ color: "#A7F3D0" }}>esta semana</span>
        </h2>
        <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto">
          Canchas disponibles todos los días. Reserva online en segundos, sin
          llamadas ni esperas.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/t/centro-tenistico/bookings"
            className="px-8 py-4 bg-white rounded-xl font-bold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-xl"
            style={{ color: PRIMARY }}
          >
            Reservar ahora
          </a>
          <a
            href="/t/centro-tenistico/services"
            className="px-8 py-4 rounded-xl font-bold text-base text-white transition-all duration-200 hover:scale-[1.02]"
            style={{ border: "1.5px solid rgba(255,255,255,0.5)" }}
          >
            Ver todos los servicios
          </a>
        </div>
      </div>
    </section>
  );
}

function InfoSection() {
  const info = [
    { label: "Teléfono", value: "+1-555-0203" },
    { label: "Email", value: "reservas@centrotenistico.local" },
    {
      label: "Horario",
      value: "Lun–Vie 6:00–22:00 · Sáb 6:00–20:00 · Dom 7:00–19:00",
    },
    { label: "Dirección", value: "321 Sports Complex Drive, Malibu, CA" },
  ];

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {info.map((item) => (
            <div key={item.label}>
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: PRIMARY }}
              >
                {item.label}
              </p>
              <p className="text-sm" style={{ color: "#4B5563" }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSkeleton() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-14 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mb-2 w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

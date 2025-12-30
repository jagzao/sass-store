"use client";

import { useRouter } from "next/navigation";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";

interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  duration: number;
  metadata?: any;
}

interface ServicesClientProps {
  services: Service[];
  tenantData: {
    slug: string;
    name: string;
    branding: {
      primaryColor: string;
    };
  };
}

export function ServicesClient({ services, tenantData }: ServicesClientProps) {
  const router = useRouter();

  const handleBookService = (service: Service) => {
    router.push(`/t/${tenantData.slug}/booking/${service.id}`);
  };

  if (services.length === 0) {
    return (
      <LiveRegionProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">
              Este tenant no ofrece servicios de reserva.
            </p>
            <a
              href={`/t/${tenantData.slug}/products`}
              className="mt-4 inline-block px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: tenantData.branding.primaryColor }}
            >
              Ver productos disponibles
            </a>
          </div>
        </div>
      </LiveRegionProvider>
    );
  }

  return (
    <LiveRegionProvider>
      <div className="container mx-auto px-4 py-8">
        {/* Services Grid */}
        <div
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 ${tenantData.slug === "zo-system" ? "auto-rows-fr" : ""}`}
        >
          {services.map((service: any) => (
            <div
              key={service.id}
              className={`rounded-lg overflow-hidden transition-all ${
                tenantData.slug === "zo-system"
                  ? "bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#FF8000]/50 hover:shadow-[0_0_20px_rgba(255,128,0,0.15)]"
                  : "bg-white shadow-md hover:shadow-lg"
              }`}
            >
              <div className="p-6 h-full flex flex-col">
                <div
                  className={`text-5xl mb-4 text-center ${tenantData.slug === "zo-system" ? "text-shadow-neon" : ""}`}
                >
                  {service.metadata?.image || "💅"}
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${tenantData.slug === "zo-system" ? "text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide" : ""}`}
                >
                  {service.name}
                </h3>
                <p
                  className={`text-sm mb-4 flex-grow ${tenantData.slug === "zo-system" ? "text-gray-400" : "text-gray-600"}`}
                >
                  {service.shortDescription || service.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`text-2xl font-bold ${tenantData.slug === "zo-system" ? "text-[#FF8000]" : ""}`}
                    style={
                      tenantData.slug !== "zo-system"
                        ? { color: tenantData.branding.primaryColor }
                        : {}
                    }
                  >
                    ${service.price}
                  </span>
                  <span
                    className={`text-sm ${tenantData.slug === "zo-system" ? "text-[#EAFF00]" : "text-gray-500"}`}
                  >
                    {service.duration} min
                  </span>
                </div>

                {/* Click Budget: ≤2 clicks to book */}
                <div className="space-y-2 mt-auto">
                  <a
                    href={`/t/${tenantData.slug}/booking/${service.id}`}
                    className={`block w-full py-2 px-4 rounded border text-sm text-center transition-colors ${
                      tenantData.slug === "zo-system"
                        ? "border-white/20 text-white hover:bg-white/10"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Ver horarios (1/2)
                  </a>
                  <button
                    onClick={() => handleBookService(service)}
                    className={`block w-full py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity text-center uppercase tracking-wide ${
                      tenantData.slug === "zo-system"
                        ? "text-black font-bold bg-gradient-to-r from-[#FF8000] to-[#FF5500] hover:shadow-[0_0_15px_rgba(255,128,0,0.4)] transition-all"
                        : "text-white"
                    }`}
                    style={{
                      backgroundColor:
                        tenantData.slug === "zo-system"
                          ? undefined
                          : tenantData.branding.primaryColor,
                    }}
                  >
                    Reservar ahora (1/2)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Booking Flow */}
        <div
          className={`rounded-lg shadow-md p-8 ${tenantData.slug === "zo-system" ? "bg-white/5 backdrop-blur-md border border-white/10" : "bg-white"}`}
        >
          <h2
            className={`text-2xl font-bold mb-6 text-center ${tenantData.slug === "zo-system" ? "text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide" : ""}`}
          >
            Reserva Rápida (≤2 clicks)
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center font-bold ${tenantData.slug === "zo-system" ? "text-black bg-[#FF8000] shadow-[0_0_15px_rgba(255,128,0,0.4)]" : "text-white"}`}
                style={
                  tenantData.slug !== "zo-system"
                    ? { backgroundColor: tenantData.branding.primaryColor }
                    : {}
                }
              >
                1
              </div>
              <h3
                className={`font-semibold mb-2 ${tenantData.slug === "zo-system" ? "text-white" : ""}`}
              >
                Seleccionar servicio
              </h3>
              <p
                className={`text-sm ${tenantData.slug === "zo-system" ? "text-gray-400" : "text-gray-600"}`}
              >
                Elige el servicio que deseas y tu horario preferido
              </p>
            </div>
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center font-bold ${tenantData.slug === "zo-system" ? "text-black bg-[#FF8000] shadow-[0_0_15px_rgba(255,128,0,0.4)]" : "text-white"}`}
                style={
                  tenantData.slug !== "zo-system"
                    ? { backgroundColor: tenantData.branding.primaryColor }
                    : {}
                }
              >
                2
              </div>
              <h3
                className={`font-semibold mb-2 ${tenantData.slug === "zo-system" ? "text-white" : ""}`}
              >
                Confirmar reserva
              </h3>
              <p
                className={`text-sm ${tenantData.slug === "zo-system" ? "text-gray-400" : "text-gray-600"}`}
              >
                Confirma tus datos y finaliza la reserva
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            {tenantData.slug === "zo-system" ? (
              <a
                href={`/t/${tenantData.slug}/booking`}
                className="inline-block px-8 py-3 rounded-lg text-black font-bold text-center uppercase tracking-wide bg-gradient-to-r from-[#FF8000] to-[#FF5500] hover:shadow-[0_0_15px_rgba(255,128,0,0.4)] transition-all"
              >
                Comenzar reserva express
              </a>
            ) : (
              <a
                href={`/t/${tenantData.slug}/booking`}
                className="inline-block px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: tenantData.branding.primaryColor }}
              >
                Comenzar reserva express
              </a>
            )}
          </div>
        </div>

        {/* Available Times */}
        <div
          className={`mt-12 rounded-lg shadow-md p-8 ${tenantData.slug === "zo-system" ? "bg-white/5 backdrop-blur-md border border-white/10" : "bg-white"}`}
        >
          <h2
            className={`text-2xl font-bold mb-6 text-center ${tenantData.slug === "zo-system" ? "text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide" : ""}`}
          >
            Horarios Disponibles Hoy
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              "9:00",
              "10:30",
              "12:00",
              "14:00",
              "15:30",
              "17:00",
              "18:30",
              "20:00",
            ].map((time) => (
              <a
                key={time}
                href={`/t/${tenantData.slug}/booking?time=${encodeURIComponent(time)}`}
                className={`block py-2 px-3 rounded border text-sm text-center transition-colors ${
                  tenantData.slug === "zo-system"
                    ? "border-white/20 text-white hover:bg-white/10 hover:border-[#FF8000]/50"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {time}
              </a>
            ))}
          </div>
        </div>
      </div>
    </LiveRegionProvider>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import CreateQuoteButton from "@/components/quotes/CreateQuoteButton";

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

interface ZoSystemServicesClientProps {
  services: Service[];
  tenantData: {
    slug: string;
    name: string;
    branding: {
      primaryColor: string;
    };
  };
  isAdmin?: boolean;
}

export function ZoSystemServicesClient({
  services,
  tenantData,
  isAdmin = false,
}: ZoSystemServicesClientProps) {
  const router = useRouter();

  const handleBookService = (service: Service) => {
    router.push(`/t/${tenantData.slug}/booking/${service.id}`);
  };

  return (
    <LiveRegionProvider>
      <div className="min-h-screen bg-[#0D0D0D] text-white font-[family-name:var(--font-montserrat)]">
        <section className="container mx-auto px-4 py-16">
          <header className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
              Servicios de Desarrollo
            </h1>
            <p className="text-lg text-gray-400">
              Servicios productizados para equipos que necesitan velocidad sin
              sacrificar calidad. Stack: .NET 8, React, Next.js, Node.js,
              Python, Azure, n8n.
            </p>
          </header>

          {services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay servicios configurados.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:border-[#FF8000]/50 hover:shadow-[0_0_20px_rgba(255,128,0,0.15)] transition-all flex flex-col"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="text-4xl mb-4 text-center">
                      {service.metadata?.image || "ðŸ’¼"}
                    </div>
                    <h2 className="text-xl font-bold mb-2 font-[family-name:var(--font-rajdhani)] uppercase tracking-wide">
                      {service.name}
                    </h2>
                    <p className="text-sm text-gray-400 mb-4 flex-grow">
                      {service.shortDescription || service.description}
                    </p>

                    {service.metadata?.tags && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.metadata.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-300 border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-[#FF8000]">
                        ${service.price}
                      </span>
                      <span className="text-sm text-[#EAFF00]">
                        {formatDuration(service.duration)}
                      </span>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <a
                        href={`/t/${tenantData.slug}/booking/${service.id}`}
                        className="block w-full py-2 px-4 rounded border border-white/20 text-white text-sm text-center hover:bg-white/10"
                      >
                        Ver detalles
                      </a>
                      <button
                        onClick={() => handleBookService(service)}
                        className="block w-full py-3 px-6 rounded-lg font-bold text-center uppercase tracking-wide text-black bg-gradient-to-r from-[#FF8000] to-[#FF5500] hover:shadow-[0_0_15px_rgba(255,128,0,0.4)] transition-all"
                      >
                        Agendar consulta
                      </button>
                      {isAdmin && (
                        <CreateQuoteButton
                          serviceId={service.id}
                          serviceName={service.name}
                          tenantSlug={tenantData.slug}
                          className="mt-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 font-[family-name:var(--font-rajdhani)] uppercase tracking-wide">
              Â¿Necesitas algo fuera del catálogo?
            </h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Escríbeme con tu reto técnico: arquitectura, MVP, modernización,
              integraciones o automatización.
            </p>
            <a
              href="mailto:jagzao@gmail.com?subject=Consulta%20de%20desarrollo%20-%20Zo%20System"
              className="inline-block px-8 py-3 rounded-lg text-black font-bold bg-gradient-to-r from-[#EAFF00] to-[#CCDD00] hover:shadow-[0_0_15px_rgba(234,255,0,0.4)] transition-all"
            >
              Contactar por email
            </a>
          </div>
        </section>
      </div>
    </LiveRegionProvider>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `${hours} h${hours > 1 ? "s" : ""}`;
}

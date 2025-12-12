import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

// Force dynamic rendering - don't generate at build time
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function ContactPage({ params }: PageProps) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  // Get tenant data directly from database (server-side only, no HTTP calls)
  const tenantData = await getTenantBySlug(tenantSlug);

  if (!tenantData) {
    console.error(`[ContactPage] Tenant not found: ${tenantSlug}`);
    notFound();
  }

  const isLuxury = tenantSlug === "wondernails";
  const primaryColor = tenantData.branding.primaryColor;

  return (
    <div
      className={`container mx-auto px-4 py-12 ${isLuxury ? "text-white" : "text-gray-900"}`}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className={`text-4xl font-bold mb-8 text-center ${isLuxury ? "text-[#D4AF37] font-serif" : ""}`}
        >
          Contáctanos
        </h1>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div
            className={`${isLuxury ? "bg-white/80 backdrop-blur-xl border border-[#C5A059]/30 shadow-[0_10px_30px_rgba(0,0,0,0.05)]" : "bg-white shadow-lg"} rounded-xl p-8`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${isLuxury ? "text-[#C5A059] font-serif" : "text-gray-900"}`}
            >
              Información de Contacto
            </h2>

            <div className="space-y-6">
              {tenantData.contact?.phone && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isLuxury ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-blue-50 text-blue-600"}`}
                  >
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isLuxury ? "text-[#C5A059]" : "text-gray-900"}`}
                    >
                      Teléfono
                    </h3>
                    <p
                      className={`${isLuxury ? "text-[#333333]" : "text-gray-600"}`}
                    >
                      {tenantData.contact.phone}
                    </p>
                  </div>
                </div>
              )}

              {tenantData.contact?.email && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isLuxury ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-blue-50 text-blue-600"}`}
                  >
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isLuxury ? "text-[#C5A059]" : "text-gray-900"}`}
                    >
                      Email
                    </h3>
                    <p
                      className={`${isLuxury ? "text-[#333333]" : "text-gray-600"}`}
                    >
                      {tenantData.contact.email}
                    </p>
                  </div>
                </div>
              )}

              {tenantData.contact?.address && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isLuxury ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-blue-50 text-blue-600"}`}
                  >
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isLuxury ? "text-[#C5A059]" : "text-gray-900"}`}
                    >
                      Ubicación
                    </h3>
                    <p
                      className={`${isLuxury ? "text-[#333333]" : "text-gray-600"}`}
                    >
                      {tenantData.contact.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map or Image Placeholder */}
          <div
            className={`${isLuxury ? "bg-white/80 backdrop-blur-xl border border-[#C5A059]/30 shadow-[0_10px_30px_rgba(0,0,0,0.05)]" : "bg-white shadow-lg"} rounded-xl p-8 flex items-center justify-center min-h-[300px] map-placeholder`}
          >
            <div className="text-center">
              <MapPin
                className={`w-16 h-16 mx-auto mb-4 ${isLuxury ? "text-[#C5A059]" : "text-gray-400"}`}
              />
              {tenantData.contact?.googleMaps ? (
                <a
                  href={tenantData.contact.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-block px-6 py-3 rounded-lg font-semibold transition-all ${
                    isLuxury
                      ? "bg-[#C5A059] text-white hover:bg-[#B5952F]"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Ver ubicación en Google Maps
                </a>
              ) : (
                <p
                  className={`${isLuxury ? "text-[#333333]" : "text-gray-500"}`}
                >
                  Mapa de ubicación próximamente
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenant;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return {
      title: "Contacto",
    };
  }

  return {
    title: `Contacto - ${tenant.name}`,
    description: `Ponte en contacto con ${tenant.name}`,
  };
}

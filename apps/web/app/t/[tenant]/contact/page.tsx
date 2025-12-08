import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";
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

  // Fetch tenant data
  let tenantData: TenantData | null = null;

  try {
    tenantData = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);
  } catch (error) {
    console.error(`[ContactPage] Failed to fetch tenant ${tenantSlug}:`, error);
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
            className={`${isLuxury ? "bg-[#1a1a1a]/60 border border-[#D4AF37]/20" : "bg-white shadow-lg"} rounded-xl p-8 backdrop-blur-md`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${isLuxury ? "text-[#D4AF37] font-serif" : ""}`}
            >
              Información de Contacto
            </h2>

            <div className="space-y-6">
              {tenantData.contact?.phone && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isLuxury ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-blue-50 text-blue-600"}`}
                  >
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isLuxury ? "text-gray-200" : "text-gray-900"}`}
                    >
                      Teléfono
                    </h3>
                    <p
                      className={`${isLuxury ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {tenantData.contact.phone}
                    </p>
                  </div>
                </div>
              )}

              {tenantData.contact?.email && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isLuxury ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-blue-50 text-blue-600"}`}
                  >
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isLuxury ? "text-gray-200" : "text-gray-900"}`}
                    >
                      Email
                    </h3>
                    <p
                      className={`${isLuxury ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {tenantData.contact.email}
                    </p>
                  </div>
                </div>
              )}

              {tenantData.contact?.address && (
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${isLuxury ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-blue-50 text-blue-600"}`}
                  >
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isLuxury ? "text-gray-200" : "text-gray-900"}`}
                    >
                      Ubicación
                    </h3>
                    <p
                      className={`${isLuxury ? "text-gray-400" : "text-gray-600"}`}
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
            className={`${isLuxury ? "bg-[#1a1a1a]/60 border border-[#D4AF37]/20" : "bg-white shadow-lg"} rounded-xl p-8 backdrop-blur-md flex items-center justify-center min-h-[300px]`}
          >
            <div className="text-center">
              <MapPin
                className={`w-16 h-16 mx-auto mb-4 ${isLuxury ? "text-[#D4AF37]" : "text-gray-400"}`}
              />
              <p className={`${isLuxury ? "text-gray-400" : "text-gray-500"}`}>
                Mapa de ubicación próximamente
              </p>
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

  try {
    const tenant = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);

    return {
      title: `Contacto - ${tenant.name}`,
      description: `Ponte en contacto con ${tenant.name}`,
    };
  } catch (error) {
    return {
      title: "Contacto",
    };
  }
}

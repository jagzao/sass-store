import { headers } from "next/headers";
import { getTenantDataForPage } from "@/lib/db/tenant-service";
import TenantHeroCarousel from "@/components/ui/TenantHeroCarousel";
import TenantLogo from "@/components/ui/TenantLogo";
import { Metadata } from "next";

interface PageProps {
  params: {
    tenant: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const tenantData = await getTenantDataForPage(params.tenant);

    // Preload hero image for LCP optimization (tenant-specific)
    const heroImagePreload =
      params.tenant === "wondernails"
        ? [
            {
              rel: "preload",
              as: "image",
              href: "/tenants/wondernails/hero/img1.webp",
            },
          ]
        : [];

    return {
      title: tenantData.name,
      description: tenantData.description,
      icons: {
        icon: "/favicon.ico",
      },
      openGraph: {
        title: tenantData.name,
        description: tenantData.description,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: tenantData.name,
        description: tenantData.description,
      },
      other: {
        ...(heroImagePreload.length > 0 && {
          "link-preload": heroImagePreload
            .map((l) => `<${l.href}>; rel="${l.rel}"; as="${l.as}"`)
            .join(", "),
        }),
      },
    };
  } catch (error) {
    return {
      title: "Tienda - Sass Store",
      description: "Plataforma de comercio electrónico multi-tenant",
    };
  }
}

export default async function TenantPage({ params }: PageProps) {
  try {
    // Get headers from middleware
    const headersList = await headers();
    const tenantSlug = headersList.get("x-tenant") || params.tenant;
    const tenantMode = headersList.get("x-tenant-mode") || "catalog";

    // Fetch tenant data from database
    const tenantData = await getTenantDataForPage(params.tenant);

    // Filter featured items
    const featuredServices = tenantData.services.filter(
      (service: any) => service.featured
    );
    const featuredProducts = tenantData.products.filter(
      (product: any) => product.featured
    );

    // Parse branding and contact from JSONB
    const branding = tenantData.branding as any;
    const contact = tenantData.contact as any;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header - Fixed position with high z-index */}
        <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <TenantLogo
                tenantSlug={params.tenant}
                tenantName={tenantData.name}
                primaryColor={branding.primaryColor}
              />
              <nav className="flex space-x-6">
                <a
                  href={`/t/${params.tenant}/services`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Servicios
                </a>
                <a
                  href={`/t/${params.tenant}/products`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Productos
                </a>
                <a
                  href={`/t/${params.tenant}/cart`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Carrito
                </a>
                <a
                  href={`/t/${params.tenant}/login`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Iniciar Sesión
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section - Registro por tenant */}
        <TenantHeroCarousel
          tenantSlug={params.tenant}
          tenantData={{
            name: tenantData.name,
            description: tenantData.description,
            slug: params.tenant,
            mode: tenantData.mode,
            branding,
            contact,
          }}
          autoRotate={true}
        />

        <div className="container mx-auto px-4 py-12">
          {/* Featured Services */}
          {featuredServices.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Servicios Destacados
                </h2>
                <a
                  href={`/t/${params.tenant}/services`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos →
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredServices.map((service: any) => {
                  const metadata = service.metadata as any;
                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="text-5xl mb-4 text-center">
                          {metadata?.image || "⭐"}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {service.description}
                        </p>

                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <span
                              className="text-3xl font-bold"
                              style={{ color: branding.primaryColor }}
                            >
                              ${service.price}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              MXN
                            </span>
                          </div>
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {service.duration} min
                          </span>
                        </div>

                        <button
                          className="w-full py-3 px-6 rounded-lg text-white font-semibold hover:opacity-90 shadow-md"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          Reservar Ahora
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Productos Destacados
                </h2>
                <a
                  href={`/t/${params.tenant}/products`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todos →
                </a>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {featuredProducts.map((product: any) => {
                  const metadata = product.metadata as any;
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md border border-gray-100 group"
                    >
                      <div className="aspect-square bg-gray-50 flex items-center justify-center text-6xl">
                        {metadata?.image || "📦"}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-2 text-gray-900 text-sm group-hover:text-blue-600">
                          {product.name}
                        </h3>

                        <div className="mb-3">
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            MXN
                          </span>
                        </div>

                        <button
                          className="w-full py-2 px-4 rounded text-white text-sm font-medium hover:opacity-90"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          Comprar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">
              Información de Contacto
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900">
                  ¡Contáctanos!
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">📍</span>
                    <span className="text-gray-700">{contact.address}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">📞</span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">✉️</span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6 text-gray-900">
                  Horarios de Atención
                </h3>
                <div className="space-y-3">
                  {contact.hours &&
                    Object.entries(contact.hours).map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="capitalize font-medium text-gray-700">
                          {day}:
                        </span>
                        <span className="text-gray-600">{String(hours)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="text-center py-8">
            <div className="flex justify-center items-center space-x-8 text-gray-600">
              <div className="flex items-center">
                <span className="text-2xl mr-2">🔒</span>
                <span className="text-sm">Pagos Seguros</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">🚚</span>
                <span className="text-sm">Entrega Rápida</span>
              </div>
              <div className="flex items-center">
                <span className="text-2xl mr-2">⭐</span>
                <span className="text-sm">Calidad Garantizada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading tenant page:", error);

    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">
            Hubo un error cargando la página del tenant.
          </p>
          <a
            href="/t/zo-system"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir a la Tienda Principal
          </a>
        </div>
      </div>
    );
  }
}

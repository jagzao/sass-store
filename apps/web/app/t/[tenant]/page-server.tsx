import { Suspense } from "react";
import { notFound } from "next/navigation";
import TenantHero from "@/components/ui/TenantHero";
import TenantLogo from "@/components/ui/TenantLogo";
import ProductCard from "@/components/products/ProductCard";
import ServiceCard from "@/components/services/ServiceCard";
import TenantPageSkeleton from "@/components/ui/TenantPageSkeleton";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import UserMenu from "@/components/auth/UserMenu";
import { fetchStatic, fetchRevalidating } from "@/lib/api/fetch-with-cache";
import type { TenantData, Product, Service } from "@/types/tenant";

interface PageProps {
  params: {
    tenant: string;
  };
}

/**
 * Optimized Server Component for Tenant Pages
 *
 * Benefits:
 * - Server-side rendering (faster TTFB)
 * - Automatic caching with Next.js
 * - No client-side JavaScript for initial render
 * - Streaming with Suspense boundaries
 */
export default async function TenantPageServer({ params }: PageProps) {
  const tenantSlug = params.tenant;

  // Fetch tenant data on the server (cached for 1 hour)
  let tenantData: TenantData | null = null;

  try {
    tenantData = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);
  } catch (error) {
    console.error(`[TenantPage] Failed to fetch tenant ${tenantSlug}:`, error);
    // Return 404 if tenant not found
    notFound();
  }

  return (
    <LiveRegionProvider>
      <div
        className="min-h-screen bg-gradient-to-b from-white to-gray-50"
        data-testid="tenant-page"
      >
        {/* Skip to main content link for screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
          data-testid="skip-link"
        >
          Saltar al contenido principal
        </a>

        {/* Header with logo and user menu */}
        <header
          className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
          role="banner"
          data-testid="page-header"
        >
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <TenantLogo
              tenantSlug={tenantData.slug}
              tenantName={tenantData.name}
              primaryColor={tenantData.branding?.primaryColor || "#000000"}
            />
            <UserMenu />
          </div>
        </header>

        {/* Hero Section - renders immediately */}
        <main role="main" id="main-content" className="relative">
          {/* Visible H1 for accessibility and SEO */}
          <h1
            className="text-4xl font-bold text-center py-8"
            data-testid="page-title"
          >
            {tenantData.name}
          </h1>
          <div className="sr-only" aria-live="polite">
            Bienvenido a {tenantData.name} -{" "}
            {tenantData.description || "Inicio"}
          </div>
          <TenantHero tenantData={tenantData} />
        </main>

        {/* Footer with proper ARIA landmark */}
        <footer
          role="contentinfo"
          className="bg-gray-100 py-8 mt-12"
          data-testid="page-footer"
        >
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>
              &copy; {new Date().getFullYear()} {tenantData.name}. Todos los
              derechos reservados.
            </p>
            <div className="sr-only" aria-live="polite">
              Pie de página con información de derechos de autor
            </div>
          </div>
        </footer>

        {/* Products Section - streamed after hero */}
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsSection
            tenantSlug={tenantSlug}
            tenantMode={tenantData.mode}
            branding={tenantData.branding}
          />
        </Suspense>

        {/* Services Section - only for booking tenants */}
        {tenantData.mode === "booking" && (
          <Suspense fallback={<ServicesSkeleton />}>
            <ServicesSection
              tenantSlug={tenantSlug}
              branding={tenantData.branding}
            />
          </Suspense>
        )}
      </div>
    </LiveRegionProvider>
  );
}

/**
 * Products Section - async Server Component
 * Fetches and renders products independently
 */
async function ProductsSection({
  tenantSlug,
  tenantMode,
  branding,
}: {
  tenantSlug: string;
  tenantMode: "booking" | "catalog";
  branding: { primaryColor?: string };
}) {
  // Fetch products (cached for 5 minutes)
  const productsResponse = await fetchRevalidating<{ data: Product[] }>(
    `/api/v1/public/products?tenant=${tenantSlug}&featured=true&limit=12`,
    ["products", tenantSlug],
  );

  const products = productsResponse?.data || [];

  if (products.length === 0) {
    return null;
  }

  return (
    <section
      className="container mx-auto px-4 py-12"
      data-testid="products-section"
    >
      <h2 className="text-3xl font-bold mb-8" data-testid="products-title">
        {tenantMode === "catalog"
          ? "Productos Destacados"
          : "Nuestros Productos"}
      </h2>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        data-testid="products-grid"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description || ""}
            price={
              typeof product.price === "string"
                ? parseFloat(product.price)
                : product.price
            }
            image={product.imageUrl || ""}
            tenantSlug={tenantSlug}
            primaryColor={branding?.primaryColor || "#000000"}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Services Section - async Server Component
 * Fetches and renders services independently
 */
async function ServicesSection({
  tenantSlug,
  branding,
}: {
  tenantSlug: string;
  branding: { primaryColor?: string };
}) {
  // Fetch services (cached for 5 minutes)
  const servicesResponse = await fetchRevalidating<{ data: Service[] }>(
    `/api/v1/public/services?tenant=${tenantSlug}&featured=true&limit=8`,
    ["services", tenantSlug],
  );

  const services = servicesResponse?.data || [];

  if (services.length === 0) {
    return null;
  }

  return (
    <section
      className="container mx-auto px-4 py-12 bg-white"
      data-testid="services-section"
    >
      <h2 className="text-3xl font-bold mb-8" data-testid="services-title">
        Servicios Destacados
      </h2>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="services-grid"
      >
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            name={service.name}
            description={service.description || ""}
            price={
              typeof service.price === "string"
                ? parseFloat(service.price)
                : service.price
            }
            duration={service.duration}
            tenantSlug={tenantSlug}
            primaryColor={branding?.primaryColor || "#000000"}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Loading Skeletons
 */
function ProductsSkeleton() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="h-9 w-64 bg-gray-200 rounded mb-8 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow">
            <div className="aspect-square bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesSkeleton() {
  return (
    <section className="container mx-auto px-4 py-12 bg-white">
      <div className="h-9 w-64 bg-gray-200 rounded mb-8 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-6 shadow">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Metadata generation for SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const tenantSlug = params.tenant;

  try {
    const tenant = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);

    return {
      title: `${tenant.name} - ${tenant.description || "Inicio"}`,
      description: tenant.description || `Bienvenido a ${tenant.name}`,
      openGraph: {
        title: tenant.name,
        description: tenant.description,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Página no encontrada",
    };
  }
}

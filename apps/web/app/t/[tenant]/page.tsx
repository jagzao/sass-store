import { Suspense } from "react";
import { notFound } from "next/navigation";
import TenantHero from "@/components/ui/TenantHero";
import ProductCard from "@/components/products/ProductCard";
import ServiceCard from "@/components/services/ServiceCard";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { fetchRevalidating } from "@/lib/api/fetch-with-cache";
import type { TenantData, Product, Service } from "@/types/tenant";
import PageClient from "./page-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    tenant: string;
  }>;
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
  const { tenant: tenantSlug } = await params;

  // Custom Design for Zo System
  if (tenantSlug === "zo-system") {
    const ZoLandingPage = (
      await import("@/components/tenant/zo-system/ZoLandingPage")
    ).default;
    return <ZoLandingPage tenantSlug={tenantSlug} />;
  }

  // Get tenant data directly from database (server-side only, no HTTP calls)
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    console.error(`[TenantPage] Tenant not found: ${tenantSlug}`);
    notFound();
  }

  // Construct TenantData object
  const tenantData: TenantData = {
    ...tenant,
    products: [],
    services: [],
  };

  const pageContent = (
    <LiveRegionProvider>
      <>
        {/* Hero Section - renders immediately */}
        <section className="relative">
          <TenantHero tenantData={tenantData} />
        </section>

        {/* Products Section - streamed after hero */}
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsSection
            tenantSlug={tenantSlug}
            tenantMode={tenantData.mode}
            primaryColor={tenantData.branding.primaryColor}
            variant={tenantSlug === "wondernails" ? "luxury" : "default"}
          />
        </Suspense>

        {/* Services Section - only for booking tenants */}
        {tenantData.mode === "booking" && (
          <Suspense fallback={<ServicesSkeleton />}>
            <ServicesSection
              tenantSlug={tenantSlug}
              primaryColor={tenantData.branding.primaryColor}
              variant={tenantSlug === "wondernails" ? "luxury" : "default"}
            />
          </Suspense>
        )}
      </>
    </LiveRegionProvider>
  );

  // Wrap the page content with the client component that handles authentication
  return <PageClient tenantSlug={tenantSlug}>{pageContent}</PageClient>;
}

/**
 * Products Section - async Server Component
 * Fetches and renders products independently
 */
async function ProductsSection({
  tenantSlug,
  tenantMode,
  primaryColor,
  variant = "default",
}: {
  tenantSlug: string;
  tenantMode: "booking" | "catalog";
  primaryColor: string;
  variant?: "default" | "luxury" | "tech";
}) {
  // Fetch products (cached for 5 minutes)
  const productsResponse = await fetchRevalidating<{ data: Product[] }>(
    `/api/v1/public/products?tenant=${tenantSlug}&limit=12`,
    ["products", tenantSlug],
  );

  const products = productsResponse?.data || [];

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2
        className={`text-3xl font-bold mb-8 ${variant === "luxury" ? "text-[#D4AF37] font-serif" : ""}`}
      >
        {tenantMode === "catalog"
          ? "Productos Destacados"
          : "Nuestros Productos"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description || ""}
            price={Number(product.price)}
            image={product.imageUrl || product.metadata?.image}
            category={product.category || product.metadata?.category}
            primaryColor={primaryColor}
            tenantSlug={tenantSlug}
            metadata={product.metadata as any}
            variant={variant}
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
  primaryColor,
  variant = "default",
}: {
  tenantSlug: string;
  primaryColor: string;
  variant?: "default" | "luxury" | "tech";
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
      className={`container mx-auto px-4 py-12 ${variant === "luxury" ? "" : variant === "tech" ? "bg-transparent" : "bg-white"}`}
    >
      <h2
        className={`text-3xl font-bold mb-8 ${variant === "luxury" ? "text-[#D4AF37] font-serif" : variant === "tech" ? "text-white font-[family-name:var(--font-rajdhani)] tracking-wider uppercase" : ""}`}
      >
        Servicios Destacados
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            {...service}
            description={service.description || ""}
            price={Number(service.price)}
            primaryColor={primaryColor}
            tenantSlug={tenantSlug}
            variant={variant}
            metadata={service.metadata as any}
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
  const { tenant: tenantSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return {
      title: "Página no encontrada",
    };
  }

  return {
    title: `${tenant.name} - ${tenant.description || "Inicio"}`,
    description: tenant.description || `Bienvenido a ${tenant.name}`,
    openGraph: {
      title: tenant.name,
      description: tenant.description,
      type: "website",
    },
  };
}

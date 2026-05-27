import { Suspense } from "react";
import { notFound } from "next/navigation";
import TenantHero from "@/components/ui/TenantHero";
import ProductCard from "@/components/products/ProductCard";
import ServiceCard from "@/components/services/ServiceCard";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import type { TenantData, Product, Service } from "@/types/tenant";
import HomeRouterWrapper from "@/components/home/HomeRouterWrapper";
import { db } from "@sass-store/database";
import { products, services, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

// ISR: static generation for known tenants + on-demand for new ones
export const revalidate = 60;

export async function generateStaticParams() {
  const all = await db.select({ slug: tenants.slug }).from(tenants).limit(200);
  return all.map((t) => ({ tenant: t.slug }));
}

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
 *
 * Role-Based Home Selection:
 * - Unauthenticated / Cliente role => Public Home (existing behavior)
 * - Admin / Gerente / Personal role => HomeTenant Dashboard
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

  // Custom Design for Centro Tenístico
  if (tenantSlug === "centro-tenistico") {
    const CentroTenisticoLanding = (
      await import("@/components/tenant/centro-tenistico/CentroTenisticoLanding")
    ).default;
    return <CentroTenisticoLanding tenantSlug={tenantSlug} />;
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

  // Public home content (existing behavior)
  const publicHomeContent = (
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

  // Use HomeRouter for role-based home selection
  // Staff roles (admin, gerente, personal) see HomeTenant dashboard
  // Unauthenticated and cliente roles see public home
  return (
    <HomeRouterWrapper
      tenantSlug={tenantSlug}
      tenantData={tenantData}
      publicHomeContent={publicHomeContent}
    />
  );
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
  // Direct DB query to avoid self-deadlock (do NOT fetch same server)
  const tenantResult = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenantResult || tenantResult.length === 0) {
    return null;
  }

  const tenantId = tenantResult[0].id;

  const rows = await db
    .select({
      id: products.id,
      tenantId: products.tenantId,
      sku: products.sku,
      name: products.name,
      description: products.description,
      price: products.price,
      category: products.category,
      featured: products.featured,
      metadata: products.metadata,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.active, true)))
    .limit(12);

  if (rows.length === 0) {
    return null;
  }

  const mapped = rows.map((product) => ({
    id: product.id,
    tenantId: product.tenantId,
    sku: product.sku || "",
    name: product.name,
    description: product.description || "",
    price: parseFloat(product.price),
    imageUrl: product.imageUrl ?? undefined,
    category: product.category || "",
    featured: product.featured ?? undefined,
    metadata: product.metadata || {},
  }));

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
        {mapped.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description || ""}
            price={Number(product.price)}
            image={product.imageUrl || (product.metadata as any)?.image}
            category={product.category || (product.metadata as any)?.category}
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
  // Direct DB query to avoid self-deadlock (do NOT fetch same server)
  const tenantResult = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenantResult || tenantResult.length === 0) {
    return null;
  }

  const tenantId = tenantResult[0].id;

  const rows = await db
    .select({
      id: services.id,
      tenantId: services.tenantId,
      name: services.name,
      description: services.description,
      price: services.price,
      duration: services.duration,
      featured: services.featured,
      imageUrl: services.imageUrl,
      metadata: services.metadata,
    })
    .from(services)
    .where(
      and(
        eq(services.tenantId, tenantId),
        eq(services.active, true),
        eq(services.featured, true),
      ),
    )
    .limit(8);

  if (rows.length === 0) {
    return null;
  }

  const mapped = rows.map((service) => ({
    id: service.id,
    tenantId: service.tenantId,
    name: service.name,
    description: service.description || "",
    price: parseFloat(service.price),
    duration: parseFloat(service.duration as unknown as string), // decimal() returns string from Drizzle
    imageUrl: service.imageUrl ?? undefined,
    category: "",
    featured: service.featured ?? undefined,
    metadata: service.metadata || {},
  }));

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
        {mapped.map((service) => (
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

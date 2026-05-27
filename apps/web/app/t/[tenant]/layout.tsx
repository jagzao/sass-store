import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { CircuitSpotlight } from "@/components/ui/CircuitSpotlight";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TenantStyles } from "@/components/tenant/TenantStyles";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { GoogleAuthBinder } from "@/components/auth/GoogleAuthBinder";

import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";

// ISR: revalidate tenant pages every 60 seconds
export const revalidate = 60;

// Pre-render known tenants at build time; unknown slugs trigger on-demand generation (dynamicParams = true by default)
export async function generateStaticParams() {
  const all = await db.select({ slug: tenants.slug }).from(tenants).limit(200);
  return all.map((t) => ({ tenant: t.slug }));
}

interface TenantLayoutProps {
  children: ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const resolvedParams = await params;
  const { tenant: tenantSlug } = resolvedParams;

  // Get tenant data directly from database (server-side only, no HTTP calls)
  const tenantRaw = await getTenantBySlug(tenantSlug);

  const tenantData: any = tenantRaw
    ? {
        ...tenantRaw,
        products: [],
        services: [],
      }
    : null;

  if (!tenantData) {
    console.error(`[TenantLayout] Tenant not found: ${tenantSlug}`);
    notFound();
  }

  const isWondernails = tenantSlug === "wondernails";
  const isZoSystem = tenantSlug === "zo-system";
  const isCentroTenistico = tenantSlug === "centro-tenistico";
  const isDark =
    (isZoSystem || tenantData.branding.theme === "dark") && !isCentroTenistico;

  return (
    <>
      <TenantStyles
        isWondernails={isWondernails}
        isZoSystem={isZoSystem}
        primaryColor={tenantData.branding?.primaryColor}
      />
      <div
        className={`min-h-screen ${
          isWondernails
            ? "bg-[#F8F9FA] text-[#333333]"
            : isDark
              ? "bg-[#0D0D0D] text-white font-[family-name:var(--font-montserrat)] relative"
              : "bg-[#F8F9FA] text-gray-900"
        }`}
      >
        <LiveRegionProvider>
          {isDark && <CircuitSpotlight />}
          <TenantHeader
            tenantData={tenantData}
            variant={
              isWondernails ? "transparent" : isDark ? "dark" : "default"
            }
          />
          <GoogleAuthBinder tenantSlug={tenantSlug} />
          <main>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </LiveRegionProvider>
      </div>
    </>
  );
}

import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { CircuitSpotlight } from "@/components/ui/CircuitSpotlight";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TenantStyles } from "@/components/tenant/TenantStyles";

// Force dynamic rendering for all tenant pages
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

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
  console.log("[TenantLayout] Resolved params:", resolvedParams);
  const { tenant: tenantSlug } = resolvedParams;
  console.log("[TenantLayout] Extracted tenantSlug:", tenantSlug);

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

  console.log(`[TenantLayout] Successfully loaded tenant: ${tenantData.name}`);

  const isWondernails = tenantSlug === "wondernails";
  const isZoSystem = tenantSlug === "zo-system";

  return (
    <>
      <TenantStyles isWondernails={isWondernails} isZoSystem={isZoSystem} />
      <div
        suppressHydrationWarning={true}
        className={`min-h-screen ${
          isWondernails
            ? "bg-white text-[#333333]"
            : isZoSystem
              ? "bg-[#0D0D0D] text-white font-[family-name:var(--font-montserrat)] relative"
              : "bg-gray-50"
        }`}
      >
        {(isZoSystem || tenantData.branding.theme === "dark") && (
          <CircuitSpotlight />
        )}
        <TenantHeader
          tenantData={tenantData}
          variant={
            isWondernails
              ? "transparent"
              : tenantData.branding.theme === "dark"
                ? "dark"
                : "default"
          }
        />
        <main>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </>
  );
}

// Disable static generation at build time for Vercel
// Pages will be rendered on-demand (ISR/SSR)
// This prevents build failures when API is not available during build
// export async function generateStaticParams() {
//   return [];
// }

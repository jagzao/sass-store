import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import TenantHeader from "@/components/ui/TenantHeader";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { CircuitSpotlight } from "@/components/ui/CircuitSpotlight";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TenantStyles } from "@/components/tenant/TenantStyles";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { GoogleAuthBinder } from "@/components/auth/GoogleAuthBinder";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { TenantProvider } from "@/lib/tenant/tenant-provider";
import { ThemeProvider } from "@/lib/theme/theme-provider";

import { getTenantStaticParams } from "@/lib/server/tenant-static-params";

// ISR: revalidate tenant pages every 60 seconds
export const revalidate = 60;

// STRY-026 — PWA: manifest dinámico por tenant.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  return {
    manifest: `/t/${tenant}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: tenant,
    },
    icons: {
      icon: [
        {
          url: `/tenants/${tenant}/logo/icon-32.png`,
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: `/tenants/${tenant}/logo/icon-192.png`,
          sizes: "192x192",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: `/tenants/${tenant}/logo/apple-touch-icon.png`,
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
  };
}

// STRY-026 — theme color por tenant (para la barra del navegador / PWA).
export async function generateViewport({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Viewport> {
  const { tenant } = await params;
  const t = await getTenantBySlug(tenant);
  const color =
    t?.branding?.primaryColor &&
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t.branding.primaryColor)
      ? t.branding.primaryColor
      : "#6366f1";
  return {
    themeColor: color,
    width: "device-width",
    initialScale: 1,
  };
}

// Pre-render known tenants at build time; unknown slugs trigger on-demand generation (dynamicParams = true by default)
export async function generateStaticParams() {
  return getTenantStaticParams();
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
      <TenantProvider tenant={tenantData}>
        <ThemeProvider
          defaultMode={isZoSystem ? "dark" : "system"}
          tenantBranding={{
            primaryColor: tenantData.branding?.primaryColor || "#DC2626",
            secondaryColor: tenantData.branding?.secondaryColor,
          }}
        >
          <div
            className="min-h-screen transition-colors"
            style={{
              backgroundColor: "var(--color-background)",
              color: "var(--color-foreground)",
            }}
          >
            <LiveRegionProvider>
              {isDark && <CircuitSpotlight />}
              {!isZoSystem && (
                <TenantHeader
                  tenantData={tenantData}
                  variant={
                    isWondernails ? "transparent" : isDark ? "dark" : "default"
                  }
                />
              )}
              <GoogleAuthBinder tenantSlug={tenantSlug} />
              <main>
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <InstallAppButton />
            </LiveRegionProvider>
          </div>
        </ThemeProvider>
      </TenantProvider>
    </>
  );
}

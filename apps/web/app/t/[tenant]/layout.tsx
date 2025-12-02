import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";

interface TenantLayoutProps {
  children: ReactNode;
  params: {
    tenant: string;
  };
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const tenantSlug = params.tenant;

  // Fetch tenant data (cached)
  let tenantData: TenantData | null = null;

  try {
    tenantData = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
      "tenant",
      tenantSlug,
    ]);
  } catch (error) {
    console.error(
      `[TenantLayout] Failed to fetch tenant ${tenantSlug}:`,
      error,
    );
    // We don't return notFound() here to allow individual pages to handle errors if needed,
    // or we could redirect. For now, let's allow the page to render if data fails,
    // but the header might be empty. Ideally, we should handle this gracefully.
  }

  if (!tenantData) {
    // If we can't get tenant data at the layout level, it's likely a 404
    return <>{children}</>;
  }

  const isWondernails = tenantSlug === "wondernails";

  return (
    <div
      className={`min-h-screen ${isWondernails ? "bg-white text-[#333333]" : "bg-gray-50"}`}
    >
      {isWondernails && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* 1. KILL THE YELLOW BACKGROUNDS (Urgent) */
          /* Force Header to be clear so the body gradient shows through */
          header, nav, .navbar-container {
              background-color: transparent !important;
              background: transparent !important;
              box-shadow: none !important; /* Remove any yellow glow */
          }

          /* Force Root to be White with Lilac Atmosphere */
          body, html, #root, #app, .main-wrapper {
              /* Base color fallback */
              background-color: #FFFFFF !important;
              
              /* The Lilac Spotlight - Centralized and soft */
              background-image: radial-gradient(
                  circle at 50% 35%, /* Positioned behind the hero card */
                  rgba(190, 140, 255, 0.65) 0%, /* More vibrant Lilac center */
                  rgba(255, 255, 255, 0) 70%   /* Fades to transparent white */
              ) !important;
              
              /* Ensure it stays elegant while scrolling */
              background-attachment: fixed !important;
              background-repeat: no-repeat !important;
              min-height: 100vh;
          }

          /* 2. STANDARDIZE ALL CARDS (No more Black Cards) */
          /* Target every possible card container */
          [class*="card"], [class*="slide"], .hero-card-container, .swiper-slide {
              background: rgba(255, 255, 255, 0.75) !important; /* White Glass */
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(197, 160, 89, 0.2) !important; /* Subtle Gold Border */
              box-shadow: 0 10px 40px rgba(160, 130, 180, 0.15) !important; /* Lilac Shadow */
          }

          /* 3. FIX TEXT CONTRAST (Invisible Text Fix) */
          /* Force Text Colors on the new White Backgrounds */
          [class*="card"] h1, [class*="card"] h2, [class*="card"] .title {
              color: #C5A059 !important; /* Bronze Gold */
          }
          [class*="card"] p, [class*="card"] span, [class*="card"] div {
              color: #333333 !important; /* Charcoal Gray */
          }
          
          /* Additional Helpers to ensure consistency */
          :root {
            --background: 255 255 255;
            --foreground: 51 51 51;
            --primary: 197 160 89;
            --primary-foreground: 255 255 255;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: #C5A059 !important;
          }
          
          p, span, div, li {
             color: #333333;
          }
          
          .btn-primary, button[type="submit"], .bg-primary {
            background-color: #C5A059 !important;
            color: white !important;
            border: none !important;
          }
        `,
          }}
        />
      )}
      <TenantHeader
        tenantData={tenantData}
        variant={isWondernails ? "transparent" : "default"}
      />
      <main>{children}</main>
    </div>
  );
}

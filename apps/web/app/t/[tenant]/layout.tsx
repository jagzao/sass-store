import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";

// Force dynamic rendering for all tenant pages
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

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

          /* 1. Ensure the body handles the base white color */
          body {
              background-color: #FFFFFF !important;
              position: relative; /* Needed for absolute positioning context if not fixed */
          }

          /* 2. Create the Spotlight Layer using ::before */
          body::before {
              content: "";
              position: fixed; /* Stays in place while scrolling */
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              z-index: -1; /* Puts it BEHIND everything */
              
              /* THE LILAC GLOW GRADIENT */
              /* Increased opacity slightly to ensure visibility against white */
              background: radial-gradient(
                  circle at 50% 30%, 
                  rgba(200, 160, 255, 0.25) 0%, /* Visible Soft Lilac */
                  rgba(255, 255, 255, 0) 60%   /* Fade to transparent */
              );
              pointer-events: none; /* Let clicks pass through */
          }

          /* 3. CRITICAL: Force App Wrappers to be Transparent */
          /* This ensures the body::before layer can be seen through the app containers */
          #root, #app, .main-wrapper, [data-tenant-hero="wondernails"] {
              background-color: transparent !important;
              background: transparent !important;
          }

          /* 2. STANDARDIZE ALL CARDS (No more Black Cards) */
          /* Target every possible card container using data attributes where possible */
          [class*="card"], [class*="slide"], .hero-card-container, .swiper-slide, [data-testid="carousel-item"] {
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

// Disable static generation at build time for Vercel
// Pages will be rendered on-demand (ISR/SSR)
// This prevents build failures when API is not available during build
// export async function generateStaticParams() {
//   return [];
// }

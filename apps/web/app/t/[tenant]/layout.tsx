import { Suspense, type ReactNode } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { getTenantBySlug } from "@/lib/db/get-tenant";
import TemporaryAdminMenu from "@/components/admin/TemporaryAdminMenu";

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
  console.log("[TenantLayout] Received params:", params);
  const resolvedParams = await params;
  console.log("[TenantLayout] Resolved params:", resolvedParams);
  const { tenant: tenantSlug } = resolvedParams;
  console.log("[TenantLayout] Extracted tenantSlug:", tenantSlug);

  // Get tenant data directly from database (server-side)
  const tenantData = await getTenantBySlug(tenantSlug);

  if (!tenantData) {
    console.error(`[TenantLayout] Tenant not found: ${tenantSlug}`);
    // If we can't get tenant data at the layout level, it's likely a 404
    return <>{children}</>;
  }

  console.log(`[TenantLayout] Successfully loaded tenant: ${tenantData.name}`);

  const isWondernails = tenantSlug === "wondernails";

  return (
    <div
      className={`min-h-screen ${isWondernails ? "bg-white text-[#333333]" : "bg-gray-50"}`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: isWondernails
            ? `
          /* 1. FIX THE MODAL (Emergency) */
          /* Target: The modal container, dialog box, or popup form */
          .modal-content, .modal-body, [role="dialog"], .dialog-container {
              background-color: #FFFFFF !important;
              background: #FFFFFF !important;
              color: #333333 !important; /* Force text to dark gray */
          }
          /* Kill the yellow */
          *[style*="background-color: yellow"], *[style*="background: yellow"] {
              background-color: #FFFFFF !important;
          }

          /* 2. NEUTRALIZE THE SLIDES (Kill Black & Cream) */
          /* Target: Every single slide in the Hero Carousel */
          .swiper-slide, .carousel-item, [class*="slide-"] {
              background-color: transparent !important;
              background: transparent !important;
          }

          /* Force the CARD inside the slide to be White Glass */
          .swiper-slide > div, .carousel-item > div, .hero-card {
              background: rgba(255, 255, 255, 0.75) !important;
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(197, 160, 89, 0.2) !important;
              box-shadow: 0 10px 40px rgba(160, 130, 180, 0.15) !important; /* Lilac Shadow */
          }

          /* 3. CLEAN THE HEADER */
          /* Target: The Navigation Bar */
          header, nav, .navbar-container {
              background-color: transparent !important;
              background: transparent !important;
              box-shadow: none !important;
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
          
          .btn-primary, button[type="submit"] {
            background-color: #C5A059 !important;
            color: white !important;
            border: none !important;
          }
          
          /* Fix for modal background - ensure modals have white background */
          .modal, .modal-content, [role="dialog"], .dialog-panel, .ReactModal__Content {
            background-color: #FFFFFF !important;
            background: #FFFFFF !important;
          }
          
          /* Override bg-primary for modals specifically */
          .bg-primary.modal, .bg-primary.modal-content, .bg-primary[role="dialog"], .bg-primary.dialog-panel, .bg-primary.ReactModal__Content {
            background-color: #FFFFFF !important;
            background: #FFFFFF !important;
          }
        `
            : `
          /* Default styles for non-wondernails tenants */
          body {
            background-color: #F9FAFB !important;
          }
          
          [class*="card"] {
            background: white !important;
            border: 1px solid #E5E7EB !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }
          
          :root {
            --background: 249 250 251;
            --foreground: 31 41 55;
            --primary: 59 130 246;
            --primary-foreground: 255 255 255;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: #1F2937 !important;
          }
          
          p, span, div, li {
             color: #374151;
          }
          
          .btn-primary, button[type="submit"], .bg-primary {
            background-color: #3B82F6 !important;
            color: white !important;
            border: none !important;
          }
        `,
        }}
      />
      <TenantHeader
        tenantData={tenantData}
        variant={isWondernails ? "transparent" : "default"}
      />
      <main>{children}</main>
      <TemporaryAdminMenu tenantSlug={tenantSlug} />
    </div>
  );
}

// Disable static generation at build time for Vercel
// Pages will be rendered on-demand (ISR/SSR)
// This prevents build failures when API is not available during build
// export async function generateStaticParams() {
//   return [];
// }

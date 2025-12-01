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
          :root {
            --background: 255 255 255;
            --foreground: 51 51 51; /* #333333 Charcoal Gray */
            --primary: 197 160 89; /* #C5A059 Muted Bronze-Gold */
            --primary-foreground: 255 255 255;
            --accent: 248 245 250; /* #F8F5FA Pastel Lilac */
            --accent-foreground: 51 51 51;
            --muted: 249 249 249; /* #F9F9F9 Very pale gray */
            --muted-foreground: 102 102 102; /* #666666 Medium Slate Gray */
            --border: 229 231 235;
            --input: 249 249 249;
            --ring: 197 160 89;
          }

          /* 1. KILL THE YELLOW HEADER - Force transparent header */
          header, nav, .navbar-container {
            background-color: transparent !important;
            background: transparent !important;
          }

          /* 2. FORCE GLOBAL WHITE BACKGROUND */
          html, body, #root, #__next, main, [data-tenant-hero="wondernails"], .main-wrapper, #app {
            background-color: #FFFFFF !important;
            color: #333333 !important;
            background-image: radial-gradient(circle at 70% 30%, rgba(230, 215, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%) !important;
            background-attachment: fixed !important;
            min-height: 100vh;
          }

          /* 3. STANDARDIZE ALL CARDS - Frosted White Glass Component Style */
          .glass-panel, .bg-white, .bg-card, .card,
          [class*="card"], [class*="slide"], .hero-card-container {
            background: rgba(255, 255, 255, 0.75) !important;
            backdrop-filter: blur(20px) !important;
            border: 1px solid rgba(197, 160, 89, 0.2) !important;
            box-shadow: 0 10px 40px rgba(160, 130, 180, 0.15) !important;
          }

          /* 4. FIX TEXT VISIBILITY - Typography & Contrast Fix */
          h1, h2, h3, h4, h5, h6 {
            color: #C5A059 !important; /* Bronze-Gold */
            font-family: var(--font-serif), serif;
          }

          /* Force dark text in all cards for readability */
          [class*="card"] h1, [class*="card"] h2, [class*="card"] h3,
          [class*="slide"] h1, [class*="slide"] h2, [class*="slide"] h3 {
            color: #C5A059 !important; /* Bronze Gold */
          }
          [class*="card"] p, [class*="card"] span, [class*="card"] div,
          [class*="slide"] p, [class*="slide"] span, [class*="slide"] div {
            color: #333333 !important; /* Charcoal Gray */
          }

          p, span, div, li {
            color: #333333;
          }
          .text-muted-foreground {
            color: #666666 !important;
          }

          /* Buttons */
          .btn-primary, button[type="submit"], .bg-primary {
            background-color: #C5A059 !important;
            color: white !important;
            border: none !important;
          }
          .btn-secondary, .bg-secondary {
            background-color: transparent !important;
            border: 1px solid rgba(197, 160, 89, 0.5) !important;
            color: #C5A059 !important;
          }

          /* Inputs */
          input, select, textarea {
            background-color: #F9F9F9 !important;
            border: 1px solid #E5E7EB !important;
            color: #333333 !important;
            transition: all 0.2s ease;
          }
          input:focus, select:focus, textarea:focus {
            border-color: #C5A059 !important;
            box-shadow: 0 0 0 2px rgba(197, 160, 89, 0.2) !important;
            outline: none !important;
          }

          /* Tables */
          table {
            background-color: transparent !important;
          }
          thead th {
            background-color: rgba(255, 255, 255, 0.5) !important;
            color: #C5A059 !important;
            font-weight: 600;
          }
          tbody tr {
            border-bottom: 1px solid rgba(197, 160, 89, 0.1) !important;
          }
          tbody tr:hover {
            background-color: rgba(230, 215, 255, 0.1) !important;
          }

          /* Links & Icons */
          a {
            color: #333333;
            transition: color 0.2s;
          }
          a:hover {
            color: #C5A059 !important;
          }
          /* Force icons to gold if they are not specifically white (like in primary buttons) */
          svg:not(.text-white) {
            color: #C5A059;
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

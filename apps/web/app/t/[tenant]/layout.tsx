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
          body {
            background-color: #FFFFFF;
            color: #333333;
            background-image: radial-gradient(circle at 70% 30%, rgba(230, 215, 255, 0.5) 0%, rgba(255, 255, 255, 0) 60%);
            background-attachment: fixed;
          }
          
          /* Frosted White Glass Component Style */
          .glass-panel, .bg-white, .bg-card, .card {
            background-color: rgba(255, 255, 255, 0.75) !important;
            backdrop-filter: blur(25px) !important;
            border: 1px solid rgba(197, 160, 89, 0.15) !important;
            box-shadow: 0 20px 40px -10px rgba(200, 180, 220, 0.2) !important;
          }

          /* Typography */
          h1, h2, h3, h4, h5, h6 {
            color: #C5A059 !important; /* Bronze-Gold */
            font-family: var(--font-serif), serif; /* Ensure serif font is used if available, otherwise fallback */
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

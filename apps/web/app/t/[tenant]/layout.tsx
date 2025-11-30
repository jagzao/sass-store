import { Suspense } from "react";
import { notFound } from "next/navigation";
import TenantHeader from "@/components/ui/TenantHeader";
import { fetchStatic } from "@/lib/api/fetch-with-cache";
import type { TenantData } from "@/types/tenant";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: {
    tenant: string;
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const tenantSlug = params.tenant;

  // Fetch tenant data (cached)
  let tenantData: TenantData | null = null;

  try {
    tenantData = await fetchStatic<TenantData>(
      `/api/tenants/${tenantSlug}`,
      ['tenant', tenantSlug]
    );
  } catch (error) {
    console.error(`[TenantLayout] Failed to fetch tenant ${tenantSlug}:`, error);
    // We don't return notFound() here to allow individual pages to handle errors if needed,
    // or we could redirect. For now, let's allow the page to render if data fails, 
    // but the header might be empty. Ideally, we should handle this gracefully.
  }

  if (!tenantData) {
     // If we can't get tenant data at the layout level, it's likely a 404
     return <>{children}</>;
  }

  const isWondernails = tenantSlug === 'wondernails';

  return (
    <div className={`min-h-screen ${isWondernails ? 'bg-[#121212] text-white' : 'bg-gray-50'}`}>
      {isWondernails && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --background: 18 18 18;
            --foreground: 255 255 255;
          }
          body {
            background-color: #121212;
            color: white;
          }
          /* Override common white backgrounds */
          .bg-white {
            background-color: rgba(26, 26, 26, 0.6) !important;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(212, 175, 55, 0.1);
            color: white !important;
          }
          /* Override text colors on dark backgrounds */
          .text-gray-900, .text-gray-800, .text-gray-700 {
            color: #e5e5e5 !important;
          }
          .text-gray-600, .text-gray-500 {
            color: #a3a3a3 !important;
          }
          /* Override inputs */
          input, select, textarea {
            background-color: #2A2A2A !important;
            border-color: rgba(212, 175, 55, 0.2) !important;
            color: white !important;
          }
          input:focus, select:focus, textarea:focus {
            border-color: #D4AF37 !important;
            ring-color: #D4AF37 !important;
          }
          /* Override tables */
          table {
            color: white !important;
          }
          thead th {
            background-color: #1a1a1a !important;
            color: #D4AF37 !important;
          }
          tbody tr {
            border-bottom-color: rgba(255, 255, 255, 0.1) !important;
          }
          tbody tr:hover {
            background-color: rgba(212, 175, 55, 0.05) !important;
          }
        `}} />
      )}
      <TenantHeader 
        tenantData={tenantData} 
        variant={isWondernails ? 'transparent' : 'default'}
      />
      <main>
        {children}
      </main>
    </div>
  );
}

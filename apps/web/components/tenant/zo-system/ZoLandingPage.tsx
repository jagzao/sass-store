import React, { Suspense } from "react";
import { ZoNavbar } from "./ZoNavbar";
import { ZoHero } from "./ZoHero";
import { ZoBentoGrid } from "./ZoBentoGrid";
import { ZoProjects } from "./ZoProjects";
import { ZoServices } from "./ZoServices";
import { fetchRevalidating } from "@/lib/api/fetch-with-cache";
import { Product } from "@/types/tenant";

interface ZoLandingPageProps {
  tenantSlug: string;
}

export default async function ZoLandingPage({
  tenantSlug,
}: ZoLandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-[family-name:var(--font-montserrat)] selection:bg-[#FF8000] selection:text-white">
      <ZoNavbar />
      <ZoHero />

      <Suspense
        fallback={<div className="h-96 w-full animate-pulse bg-white/5" />}
      >
        <ZoProductsSection tenantSlug={tenantSlug} />
      </Suspense>

      <ZoProjects />
      <ZoServices />

      {/* Footer (Simplified for now) */}
      <footer className="py-10 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Zo System. All rights reserved.</p>
      </footer>
    </div>
  );
}

async function ZoProductsSection({ tenantSlug }: { tenantSlug: string }) {
  const productsResponse = await fetchRevalidating<{ data: Product[] }>(
    `/api/v1/public/products?tenant=${tenantSlug}&limit=12`,
    ["products", tenantSlug],
  );

  const products = productsResponse?.data || [];

  return <ZoBentoGrid products={products} />;
}

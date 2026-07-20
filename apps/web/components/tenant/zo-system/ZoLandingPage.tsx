import { Suspense } from "react";
import { Metadata } from "next";
import { ZoHeader } from "./ZoHeader";
import { ZoHero } from "./ZoHero";
import { ZoCredibilityBar } from "./ZoCredibilityBar";
import { ZoServices } from "./ZoServices";
import { ZoCases } from "./ZoCases";
import { ZoProcess } from "./ZoProcess";
import { ZoWhyUs } from "./ZoWhyUs";
import { ZoStack } from "./ZoStack";
import { ZoCTA } from "./ZoCTA";
import { ZoFooter } from "./ZoFooter";
import { ZoLandingPageWrapper } from "./ZoLandingPageWrapper";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { db } from "@sass-store/database";
import { products, services, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

interface ZoLandingPageProps {
  tenantSlug: string;
}

export const metadata: Metadata = {
  title: "Zo Systems | Desarrollo de software, SaaS e inteligencia artificial",
  description:
    "Desarrollo de plataformas SaaS, modernización de aplicaciones .NET e integración de automatización con inteligencia artificial para empresas.",
  openGraph: {
    title:
      "Zo Systems | Desarrollo de software, SaaS e inteligencia artificial",
    description:
      "Desarrollo de plataformas SaaS, modernización de aplicaciones .NET e integración de automatización con inteligencia artificial para empresas.",
    type: "website",
    locale: "es_MX",
    siteName: "Zo Systems",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Zo Systems | Desarrollo de software, SaaS e inteligencia artificial",
    description:
      "Desarrollo de plataformas SaaS, modernización de aplicaciones .NET e integración de automatización con inteligencia artificial para empresas.",
  },
  alternates: {
    canonical: "https://zo-system.dev/t/zo-system",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ZoLandingPage({
  tenantSlug,
}: ZoLandingPageProps) {
  const tenant = await getTenantBySlug(tenantSlug);
  const tenantId = tenant?.id ?? "";

  return (
    <ZoLandingPageWrapper>
      <div className="min-h-screen bg-[#0A0A0A] text-white antialiased selection:bg-[#DC2626] selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ZoHeader tenantSlug={tenantSlug} />
        <main id="main-content">
          <ZoHero />
          <ZoCredibilityBar />
          <ZoServices />
          <ZoCases />
          <ZoProcess />
          <ZoWhyUs />
          <ZoStack />
          <ZoCTA />
        </main>
        <Suspense fallback={<div className="h-40 bg-[#0A0A0A]" />}>
          <ZoFooterSection tenantId={tenantId} />
        </Suspense>
      </div>
    </ZoLandingPageWrapper>
  );
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Zo Systems",
  description:
    "Desarrollo de plataformas SaaS, modernización de aplicaciones .NET e integración de automatización con inteligencia artificial para empresas.",
  url: "https://zo-system.dev/t/zo-system",
  email: "jagzao@gmail.com",
  telephone: "+52-55-4926-4189",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Texcoco",
    addressRegion: "Estado de México",
    addressCountry: "MX",
  },
  sameAs: ["https://www.linkedin.com/in/jagzao", "https://github.com/jagzao"],
};

async function ZoFooterSection({ tenantId }: { tenantId: string }) {
  if (!tenantId) return <ZoFooter products={[]} />;
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      metadata: products.metadata,
    })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.active, true)))
    .limit(6);
  return (
    <ZoFooter
      products={productRows.map((p) => ({
        id: p.id,
        name: p.name,
        metadata: p.metadata,
      }))}
    />
  );
}

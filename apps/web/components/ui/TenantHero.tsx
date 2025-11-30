import dynamic from "next/dynamic";
import TenantHeroCarousel from "@/components/ui/TenantHeroCarousel";
import { TenantData } from "@/types/tenant";

// Dynamic import for Wondernails custom hero
const WondernailsCarouselFinal = dynamic(
  () =>
    import(
      "@/components/tenant/wondernails/hero/HeroWondernailsFinal"
    ),
  {
    loading: () => <div className="h-[600px] bg-gray-100 animate-pulse" />,
  }
);

interface TenantHeroProps {
  tenantData: TenantData;
}

export default function TenantHero({ tenantData }: TenantHeroProps) {
  // Check for custom hero implementations
  if (tenantData.slug === "wondernails") {
    return <WondernailsCarouselFinal />;
  }

  // Default hero for other tenants
  return (
    <TenantHeroCarousel
      tenantData={tenantData}
      featuredProducts={[]}
      featuredServices={[]}
    />
  );
}

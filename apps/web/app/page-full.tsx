import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { FeaturedServices } from "@/components/home/featured-services";
import { PopularProducts } from "@/components/home/popular-products";
import { ContactSection } from "@/components/home/contact-section";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useTenant } from "@/lib/tenant/tenant-provider";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<PageSkeleton />}>
        <Hero />
      </Suspense>

      <Suspense fallback={<div className="h-64 skeleton" />}>
        <FeaturedServices />
      </Suspense>

      <Suspense fallback={<div className="h-64 skeleton" />}>
        <PopularProducts />
      </Suspense>

      <Suspense fallback={<div className="h-32 skeleton" />}>
        <ContactSection />
      </Suspense>
    </main>
  );
}

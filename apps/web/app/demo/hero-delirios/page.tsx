"use client";

import HeroDelirios, { DeliriosSlide } from "@/components/hero/HeroDelirios";

const mockSlides: DeliriosSlide[] = [
  {
    img: "/tenants/delirios/1.png",
    title: "restaurant",
    eyebrow: "menu",
    ctaText: "See More",
    bgFrom: "#17232A",
    bgTo: "#2A3F4F",
    accent: "#FFC857",
  },
  {
    img: "/tenants/delirios/2.png",
    title: "delicious food",
    eyebrow: "special",
    ctaText: "Order Now",
    bgFrom: "#1F2937",
    bgTo: "#374151",
    accent: "#F59E0B",
  },
  {
    img: "/tenants/delirios/1.png",
    title: "fresh daily",
    eyebrow: "quality",
    ctaText: "Explore",
    bgFrom: "#0F172A",
    bgTo: "#1E293B",
    accent: "#10B981",
  },
];

export default function HeroDeliriosDemo() {
  return (
    <div>
      <HeroDelirios
        slides={mockSlides}
        initialIndex={1}
        autoplayMs={4500}
        onCta={(index) => console.log(`CTA clicked for slide ${index}`)}
        onNext={(index) => console.log(`Next: ${index}`)}
        onPrev={(index) => console.log(`Prev: ${index}`)}
      />
    </div>
  );
}

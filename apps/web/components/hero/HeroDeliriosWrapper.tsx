"use client";

import HeroDelirios, { DeliriosSlide } from "./HeroDelirios";

const deliriosSlides: DeliriosSlide[] = [
  {
    img: "/tenants/delirios/hero/plate1.png",
    title: "gourmet delights",
    eyebrow: "chef special",
    ctaText: "Ver Menú",
    bgFrom: "#17232A",
    bgTo: "#2A3F4F",
    accent: "#FFC857"
  },
  {
    img: "/tenants/delirios/hero/plate2.png",
    title: "culinary art",
    eyebrow: "signature dish",
    ctaText: "Ordenar Ahora",
    bgFrom: "#1F2937",
    bgTo: "#374151",
    accent: "#F59E0B"
  },
  {
    img: "/tenants/delirios/hero/plate3.png",
    title: "fresh flavors",
    eyebrow: "daily special",
    ctaText: "Explorar",
    bgFrom: "#0F172A",
    bgTo: "#1E293B",
    accent: "#10B981"
  },
  {
    img: "/tenants/delirios/hero/plate4.png",
    title: "exquisite taste",
    eyebrow: "premium",
    ctaText: "Descubrir",
    bgFrom: "#1E1B4B",
    bgTo: "#312E81",
    accent: "#A78BFA"
  },
  {
    img: "/tenants/delirios/hero/plate5.png",
    title: "divine cuisine",
    eyebrow: "masterpiece",
    ctaText: "Reservar",
    bgFrom: "#7C2D12",
    bgTo: "#991B1B",
    accent: "#FB923C"
  }
];

export default function HeroDeliriosWrapper() {
  return (
    <HeroDelirios
      slides={deliriosSlides}
      initialIndex={1}
      autoplayMs={4500}
      onCta={(index) => {
        // Navigate to products or specific section
        window.location.href = '/t/delirios/products';
      }}
    />
  );
}

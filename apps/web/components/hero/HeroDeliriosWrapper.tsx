"use client";

import HeroDelirios, { DeliriosSlide } from "./HeroDelirios";

const deliriosSlides: DeliriosSlide[] = [
  {
    img: "/tenants/delirios/hero/plate1.png",
    title: "gourmet delights",
    eyebrow: "chef special",
    ctaText: "Ver Menú",
    bgFrom: "#0b0b10",
    bgTo: "#2a0f3e",
    accent: "#d4af37"
  },
  {
    img: "/tenants/delirios/hero/plate2.png",
    title: "culinary art",
    eyebrow: "signature dish",
    ctaText: "Ordenar Ahora",
    bgFrom: "#0d0d12",
    bgTo: "#2f1145",
    accent: "#d4af37"
  },
  {
    img: "/tenants/delirios/hero/plate3.png",
    title: "fresh flavors",
    eyebrow: "daily special",
    ctaText: "Explorar",
    bgFrom: "#0a0a0f",
    bgTo: "#28133a",
    accent: "#d4af37"
  },
  {
    img: "/tenants/delirios/hero/plate4.png",
    title: "exquisite taste",
    eyebrow: "premium",
    ctaText: "Descubrir",
    bgFrom: "#0c0c11",
    bgTo: "#2d1542",
    accent: "#d4af37"
  },
  {
    img: "/tenants/delirios/hero/plate5.png",
    title: "divine cuisine",
    eyebrow: "masterpiece",
    ctaText: "Reservar",
    bgFrom: "#0b0b10",
    bgTo: "#2a0f3e",
    accent: "#d4af37"
  }
];

export default function HeroDeliriosWrapper() {
  return (
    <HeroDelirios
      slides={deliriosSlides}
      initialIndex={0}
      autoplayMs={4500}
      onCta={(index) => {
        // Navigate to products or specific section
        window.location.href = '/t/delirios/products';
      }}
    />
  );
}

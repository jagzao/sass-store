'use client';

import React from 'react';

interface CarouselHeroProps {
  tenantData: {
    name: string;
    description: string;
    slug: string;
    mode: string;
    branding: {
      primaryColor: string;
      secondaryColor?: string;
    };
    contact: {
      address: string;
      phone: string;
      email?: string;
    };
  };
}

export function CarouselHero({ tenantData }: CarouselHeroProps) {
  return (
    <div className="wondernails-carousel-wrapper">
      <h1>Wondernails Carousel - {tenantData.name}</h1>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { tenantSlugAtom } from '@/lib/tenant/tenant-store';
import { motion } from 'framer-motion';
import { heroVariants, heroItemVariants } from '@/components/animations/card-animations';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  background: string;
}

interface HeroCarouselProps {
  featuredServices?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
  }>;
  featuredProducts?: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
  }>;
  tenantData: {
    id: string;
    slug: string;
    name: string;
    description: string;
    mode: 'booking' | 'catalog';
    branding: any;
  };
}

export function HeroCarousel({ featuredServices = [], featuredProducts = [], tenantData }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const tenantSlug = useAtomValue(tenantSlugAtom);

  // Create slides from tenant's featured services and products
  const slides: Slide[] = [];

  // Add featured services if tenant is in booking mode
  if (tenantData.mode === 'booking' && featuredServices.length > 0) {
    featuredServices.forEach((service, index) => {
      slides.push({
        id: `service-${service.id}`,
        title: service.name,
        subtitle: `${service.description} - Desde $${service.price}`,
        cta: 'Reservar ahora',
        link: `/t/${tenantData.slug}/booking/${service.id}`,
        background: `bg-gradient-to-r from-purple-500 to-blue-500`
      });
    });
  }

  // Add featured products
  if (featuredProducts.length > 0) {
    featuredProducts.forEach((product, index) => {
      slides.push({
        id: `product-${product.id}`,
        title: product.name,
        subtitle: `${product.description} - $${product.price}`,
        cta: tenantData.mode === 'catalog' ? 'Comprar ahora' : 'Ver producto',
        link: `/t/${tenantData.slug}/products/${product.id}`,
        background: `bg-gradient-to-r from-green-500 to-emerald-500`
      });
    });
  }

  // Fallback slide if no featured items
  if (slides.length === 0) {
    slides.push({
      id: 'welcome',
      title: tenantData.name,
      subtitle: tenantData.description || 'Bienvenido a nuestro negocio',
      cta: tenantData.mode === 'booking' ? 'Ver servicios' : 'Ver productos',
      link: `/t/${tenantData.slug}/${tenantData.mode === 'booking' ? 'services' : 'products'}`,
      background: 'bg-gradient-to-r from-blue-500 to-purple-500'
    });
  }

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Reset to first slide when slides change (tenant change)
  useEffect(() => {
    setCurrentSlide(0);
  }, [tenantSlug]);

  if (slides.length === 0) {
    return null; // Don't render if no slides for tenant
  }

  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      className="relative h-80 overflow-hidden rounded-lg mb-8"
      variants={heroVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Slide Content */}
      <div className={`${currentSlideData.background} h-full flex items-center justify-center text-white relative`}>
        <motion.div className="text-center z-10" variants={heroItemVariants}>
          <motion.h2
            className="text-4xl font-bold mb-4"
            variants={heroItemVariants}
          >
            {currentSlideData.title}
          </motion.h2>
          <motion.p
            className="text-xl mb-6 max-w-2xl"
            variants={heroItemVariants}
          >
            {currentSlideData.subtitle}
          </motion.p>
          <motion.div variants={heroItemVariants}>
            <Link
              href={currentSlideData.link}
              className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              {currentSlideData.cta}
            </Link>
          </motion.div>
        </motion.div>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      {/* Navigation Dots */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20"
        variants={heroItemVariants}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </motion.div>

      {/* Previous/Next Buttons */}
      <button
        onClick={() => goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-colors z-20"
      >
        <span className="text-gray-800">←</span>
      </button>
      <button
        onClick={() => goToSlide((currentSlide + 1) % slides.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-colors z-20"
      >
        <span className="text-gray-800">→</span>
      </button>
    </motion.div>
  );
}
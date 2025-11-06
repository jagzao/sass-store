/**
 * Wondernails Carousel Item Component
 *
 * Individual carousel slide with:
 * - Introduction view (default)
 * - Image
 * - Detail view (expanded)
 */

import React from 'react';
import Image from 'next/image';
import type { WnSlide } from './HeroWondernailsFinal';
import { CarouselItemIntro } from './CarouselItemIntro';
import { CarouselItemDetail } from './CarouselItemDetail';
import styles from './HeroWondernailsGSAP.module.css';

export interface CarouselItemProps {
  slide: WnSlide;
  index: number;
  onSeeMore: () => void;
  onAddToCart: () => void;
  onCheckout: () => void;
  onCloseDetail: () => void;
}

export function CarouselItem({
  slide,
  index,
  onSeeMore,
  onAddToCart,
  onCheckout,
  onCloseDetail,
}: CarouselItemProps) {
  return (
    <article
      key={slide.img}
      className={styles.item}
      data-testid="carousel-item"
      data-index={index}
      role="tabpanel"
      aria-label={`Slide ${index + 1}: ${slide.topic || 'Service'}`}
    >
      <CarouselItemIntro
        slide={slide}
        onSeeMore={onSeeMore}
      />

      <div className={styles.imgWrap}>
        <Image
          src={slide.img}
          alt={slide.topic || 'Servicio Wonder Nails'}
          fill
          priority={index === 1}
          sizes="(max-width:768px) 40vw, (max-width:1200px) 50vw, 800px"
        />
      </div>

      <CarouselItemDetail
        slide={slide}
        onAddToCart={onAddToCart}
        onCheckout={onCheckout}
        onClose={onCloseDetail}
      />
    </article>
  );
}

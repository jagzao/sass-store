/**
 * Carousel Item Introduction Component
 *
 * Displays the main carousel item content:
 * - Badge (optional)
 * - Title
 * - Topic
 * - Description
 * - "See More" button
 */

import React from 'react';
import type { WnSlide } from './HeroWondernailsFinal';
import styles from './HeroWondernailsGSAP.module.css';

export interface CarouselItemIntroProps {
  slide: WnSlide;
  onSeeMore: () => void;
}

export function CarouselItemIntro({
  slide,
  onSeeMore,
}: CarouselItemIntroProps) {
  return (
    <div className={styles.introduce}>
      {slide.badge && (
        <div className={styles.badge}>{slide.badge}</div>
      )}

      {slide.title && (
        <div className={styles.title}>{slide.title}</div>
      )}

      {slide.topic && (
        <div className={styles.topic}>{slide.topic}</div>
      )}

      {slide.description && (
        <div className={styles.des}>{slide.description}</div>
      )}

      <button
        className={styles.seeMore}
        onClick={onSeeMore}
        data-testid="see-more-button"
        aria-label={`Ver más detalles de ${slide.topic || 'este servicio'}`}
      >
        VER MÁS ↗
      </button>
    </div>
  );
}

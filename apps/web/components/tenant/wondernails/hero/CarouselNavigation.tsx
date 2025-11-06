/**
 * Carousel Navigation Buttons Component
 *
 * Arrow buttons for navigating between carousel items
 */

import React from 'react';
import styles from './HeroWondernailsGSAP.module.css';

export interface CarouselNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function CarouselNavigation({
  onPrev,
  onNext,
  disabled = false,
}: CarouselNavigationProps) {
  return (
    <div className={styles.arrows}>
      <button
        className={styles.arrowBtn}
        onClick={onPrev}
        aria-label="Anterior"
        data-testid="prev-button"
        disabled={disabled}
      >
        ←
      </button>
      <button
        className={styles.arrowBtn}
        onClick={onNext}
        aria-label="Siguiente"
        data-testid="next-button"
        disabled={disabled}
      >
        →
      </button>
    </div>
  );
}

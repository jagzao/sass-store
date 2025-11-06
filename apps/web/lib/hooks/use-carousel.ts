'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseCarouselOptions {
  /**
   * Total number of items in the carousel
   */
  itemCount: number;

  /**
   * Auto-play interval in milliseconds (default: 5000)
   * Set to 0 to disable auto-play
   */
  autoPlayInterval?: number;

  /**
   * Initial active index (default: 0 for most, 1 for NomNom style)
   */
  initialIndex?: number;

  /**
   * Whether to loop when reaching the end (default: true)
   */
  loop?: boolean;

  /**
   * Callback fired when slide changes
   */
  onChange?: (index: number) => void;
}

export interface UseCarouselReturn {
  /**
   * Current active slide index
   */
  active: number;

  /**
   * Whether component is mounted (for SSR safety)
   */
  isMounted: boolean;

  /**
   * Navigate to next slide
   */
  handleNext: () => void;

  /**
   * Navigate to previous slide
   */
  handlePrev: () => void;

  /**
   * Navigate to specific slide index
   */
  goToSlide: (index: number) => void;

  /**
   * Check if at first slide
   */
  isFirst: boolean;

  /**
   * Check if at last slide
   */
  isLast: boolean;

  /**
   * Pause auto-play
   */
  pause: () => void;

  /**
   * Resume auto-play
   */
  resume: () => void;

  /**
   * Reset auto-play timer
   */
  resetAutoPlay: () => void;
}

/**
 * Custom hook for carousel navigation and auto-play logic
 *
 * Extracts common carousel functionality while allowing unique visual designs
 *
 * @example
 * ```tsx
 * const carousel = useCarousel({
 *   itemCount: items.length,
 *   autoPlayInterval: 5000,
 *   initialIndex: 1
 * });
 *
 * return (
 *   <div>
 *     {items.map((item, i) => (
 *       <div key={i} className={i === carousel.active ? 'active' : ''}>
 *         {item}
 *       </div>
 *     ))}
 *     <button onClick={carousel.handlePrev}>←</button>
 *     <button onClick={carousel.handleNext}>→</button>
 *   </div>
 * );
 * ```
 */
export function useCarousel({
  itemCount,
  autoPlayInterval = 5000,
  initialIndex = 0,
  loop = true,
  onChange
}: UseCarouselOptions): UseCarouselReturn {

  const [active, setActive] = useState(initialIndex);
  const [isMounted, setIsMounted] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Ensure component only renders client-side (SSR safety)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clear auto-play interval
  const clearAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  // Start/restart auto-play
  const resetAutoPlay = useCallback(() => {
    if (autoPlayInterval === 0 || isPausedRef.current) return;

    clearAutoPlay();

    autoPlayRef.current = setInterval(() => {
      setActive(prev => {
        const nextIndex = prev + 1;
        if (loop) {
          return nextIndex >= itemCount ? 0 : nextIndex;
        }
        return Math.min(nextIndex, itemCount - 1);
      });
    }, autoPlayInterval);
  }, [autoPlayInterval, itemCount, loop, clearAutoPlay]);

  // Navigate to specific slide
  const goToSlide = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, itemCount - 1));
    setActive(clampedIndex);
    onChange?.(clampedIndex);
    resetAutoPlay();
  }, [itemCount, onChange, resetAutoPlay]);

  // Navigate to next slide
  const handleNext = useCallback(() => {
    setActive(prev => {
      let nextIndex;
      if (loop) {
        nextIndex = prev + 1 >= itemCount ? 0 : prev + 1;
      } else {
        nextIndex = Math.min(prev + 1, itemCount - 1);
      }
      onChange?.(nextIndex);
      return nextIndex;
    });
    resetAutoPlay();
  }, [itemCount, loop, onChange, resetAutoPlay]);

  // Navigate to previous slide
  const handlePrev = useCallback(() => {
    setActive(prev => {
      let prevIndex;
      if (loop) {
        prevIndex = prev - 1 < 0 ? itemCount - 1 : prev - 1;
      } else {
        prevIndex = Math.max(prev - 1, 0);
      }
      onChange?.(prevIndex);
      return prevIndex;
    });
    resetAutoPlay();
  }, [itemCount, loop, onChange, resetAutoPlay]);

  // Pause auto-play
  const pause = useCallback(() => {
    isPausedRef.current = true;
    clearAutoPlay();
  }, [clearAutoPlay]);

  // Resume auto-play
  const resume = useCallback(() => {
    isPausedRef.current = false;
    resetAutoPlay();
  }, [resetAutoPlay]);

  // Initialize auto-play
  useEffect(() => {
    if (!isMounted || autoPlayInterval === 0) return;

    resetAutoPlay();

    return () => {
      clearAutoPlay();
    };
  }, [isMounted, autoPlayInterval, resetAutoPlay, clearAutoPlay]);

  const isFirst = active === 0;
  const isLast = active === itemCount - 1;

  return {
    active,
    isMounted,
    handleNext,
    handlePrev,
    goToSlide,
    isFirst,
    isLast,
    pause,
    resume,
    resetAutoPlay
  };
}

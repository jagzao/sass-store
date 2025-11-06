/**
 * Wondernails Carousel Animation Configuration
 *
 * Centralized animation constants for consistent timing and easing
 * across all carousel transitions and effects.
 */

import { gsap } from 'gsap';

/**
 * Animation positions for the 5-item carousel stack
 * Using xPercent/yPercent for responsive positioning
 */
export const CAROUSEL_POSITIONS = {
  /** Position #1: Peek left - hidden off-screen left */
  PEEK_LEFT: {
    xPercent: -100,
    yPercent: -55,
    scale: 1.5,
    opacity: 0,
    filter: 'blur(30px)',
    zIndex: 10,
    pointerEvents: 'none' as const,
  },

  /** Position #2: MAIN - centered, sharp, dominant */
  MAIN: {
    xPercent: 0,
    yPercent: -50,
    scale: 1,
    opacity: 1,
    filter: 'blur(0px)',
    zIndex: 20,
    pointerEvents: 'auto' as const,
  },

  /** Position #3: Right near - 50% right, +10% down */
  RIGHT_NEAR: {
    xPercent: 50,
    yPercent: -40,
    scale: 0.8,
    filter: 'blur(10px)',
    zIndex: 9,
    opacity: 1,
    pointerEvents: 'none' as const,
  },

  /** Position #4: Right far - 90% right, +20% down */
  RIGHT_FAR: {
    xPercent: 90,
    yPercent: -30,
    scale: 0.5,
    filter: 'blur(30px)',
    zIndex: 8,
    opacity: 1,
    pointerEvents: 'none' as const,
  },

  /** Position #5: Out of focus - extreme right, +30% down */
  OUT_OF_FOCUS: {
    xPercent: 120,
    yPercent: -20,
    scale: 0.3,
    filter: 'blur(40px)',
    opacity: 0,
    zIndex: 7,
    pointerEvents: 'none' as const,
  },
};

/**
 * Animation durations for carousel transitions (in seconds)
 */
export const ANIMATION_DURATIONS = {
  /** Background color transition */
  BACKGROUND: 0.35,

  /** Micro-parallax effect */
  PARALLAX: 0.5,

  /** Staggered text animations */
  TEXT_STAGGER: 0.5,

  /** Next slide transitions */
  NEXT: {
    MAIN_TO_PEEK: 0.5,      // Main → Peek left (exit)
    RIGHT_TO_MAIN: 0.7,     // Right near → Main (enter, most dramatic)
    FAR_TO_NEAR: 0.9,       // Right far → Right near
    OUT_TO_FAR: 1.1,        // Out of focus → Right far
  },

  /** Previous slide transitions */
  PREV: {
    PEEK_TO_MAIN: 1.1,      // Peek left → Main (enter, most dramatic)
    MAIN_TO_NEAR: 0.9,      // Main → Right near
    NEAR_TO_FAR: 0.7,       // Right near → Right far
    FAR_TO_OUT: 0.5,        // Right far → Out of focus (exit)
  },

  /** Detail view transitions */
  DETAIL: {
    EXPAND: 0.6,            // Expand main item to full width
    HIDE_OTHERS: 0.5,       // Hide other carousel items
    SHOW_CONTENT: 0.4,      // Fade in detail content
    STAGGER_DELAY: 0.1,     // Delay between detail elements
  },

  /** Autoplay interval */
  AUTOPLAY: 5,              // seconds between slides
};

/**
 * Animation easing curves
 */
export const ANIMATION_EASING = {
  SMOOTH: 'power2.out',
  BOUNCE: 'power3.out',
  SHARP: 'power2.inOut',
  LINEAR: 'none',
};

/**
 * Micro-parallax offsets (in pixels)
 */
export const PARALLAX_OFFSET = {
  IMAGE: 14,      // Image container movement
  TEXT: -7,       // Text container movement (opposite direction)
};

/**
 * Text stagger animation delays (in seconds)
 */
export const TEXT_STAGGER_DELAYS = {
  TITLE: 0,
  TOPIC: 0.1,
  DESCRIPTION: 0.2,
  BUTTON: 0.3,
};

/**
 * Detail view animation delays (in seconds)
 */
export const DETAIL_STAGGER_DELAYS = {
  FADE_IN: 0.4,
  TITLE: 0.5,
  DESCRIPTION: 0.6,
  SPECS: 0.7,
  BUTTONS: 0.8,
};

/**
 * Detail view position config for image centering
 */
export const DETAIL_IMAGE_POSITION = {
  left: '30%',
  xPercent: -50,
  top: '45%',
  width: '55%',
  height: '55%',
};

/**
 * Helper: Adjust animation duration based on environment
 * - Test environments: 85% faster (0.15x)
 * - Reduced motion preference: 50% faster (0.5x)
 * - Normal: 1x speed
 */
export function getAnimationDuration(
  baseSeconds: number,
  prefersReducedMotion: boolean = false,
  isTestEnv: boolean = false
): number {
  if (isTestEnv) return baseSeconds * 0.15;
  if (prefersReducedMotion) return baseSeconds * 0.5;
  return baseSeconds;
}

/**
 * Helper: Clear Flip inline props to prevent drift
 * Flip plugin leaves inline styles that can cause positioning drift
 */
export function clearFlipInline(nodes: NodeListOf<Element>) {
  gsap.set(nodes, { clearProps: 'top,left,width,height,margin' });
}

/**
 * Helper: Apply base anchor positioning
 * Ensures all items are anchored consistently to prevent scale drift
 */
export function applyBaseAnchor(element: HTMLElement) {
  gsap.set(element, {
    position: 'absolute',
    top: '50%',
    left: 0,
    transformOrigin: '50% 50%',
  });
}

/**
 * Helper: Create text stagger timeline
 * Animates text elements with blur + opacity + y-offset
 */
export function createTextStaggerTimeline(
  elements: {
    title?: HTMLElement | null;
    topic?: HTMLElement | null;
    description?: HTMLElement | null;
    button?: HTMLElement | null;
  },
  duration: number = ANIMATION_DURATIONS.TEXT_STAGGER
): gsap.core.Timeline {
  const tl = gsap.timeline();

  const animateText = (el: HTMLElement | null | undefined, delay: number) => {
    if (!el) return;
    tl.fromTo(
      el,
      { y: -30, opacity: 0, filter: 'blur(10px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration,
        ease: ANIMATION_EASING.SMOOTH,
      },
      delay
    );
  };

  animateText(elements.title, TEXT_STAGGER_DELAYS.TITLE);
  animateText(elements.topic, TEXT_STAGGER_DELAYS.TOPIC);
  animateText(elements.description, TEXT_STAGGER_DELAYS.DESCRIPTION);
  animateText(elements.button, TEXT_STAGGER_DELAYS.BUTTON);

  return tl;
}

/**
 * Helper: Apply micro-parallax effect
 * Creates subtle depth by moving image and text in opposite directions
 */
export function applyParallax(
  imgWrap: HTMLElement | null,
  introduce: HTMLElement | null,
  direction: 'next' | 'prev',
  duration: number = ANIMATION_DURATIONS.PARALLAX
) {
  const imgOffset = direction === 'next' ? PARALLAX_OFFSET.IMAGE : -PARALLAX_OFFSET.IMAGE;
  const textOffset = direction === 'next' ? PARALLAX_OFFSET.TEXT : -PARALLAX_OFFSET.TEXT;

  if (imgWrap) {
    gsap.to(imgWrap, { x: imgOffset, duration, ease: ANIMATION_EASING.SMOOTH });
  }
  if (introduce) {
    gsap.to(introduce, { x: textOffset, duration, ease: ANIMATION_EASING.SMOOTH });
  }
}

/**
 * Helper: Reset micro-parallax
 */
export function resetParallax(imgWrap: HTMLElement | null, introduce: HTMLElement | null) {
  if (imgWrap) gsap.set(imgWrap, { x: 0 });
  if (introduce) gsap.set(introduce, { x: 0 });
}

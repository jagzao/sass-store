'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

/**
 * Lazy-loaded Framer Motion components
 * Only loads when actually used, reducing initial bundle size
 *
 * Bundle size savings: ~3.9MB (framer-motion)
 */

// Dynamic import with no SSR (animations don't need server rendering)
const FramerMotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  {
    ssr: false,
    loading: () => <div />, // Fallback to regular div while loading
  }
);

const FramerMotionSection = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.section })),
  {
    ssr: false,
    loading: () => <section />,
  }
);

const FramerMotionArticle = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.article })),
  {
    ssr: false,
    loading: () => <article />,
  }
);

const FramerMotionSpan = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.span })),
  {
    ssr: false,
    loading: () => <span />,
  }
);

/**
 * Motion wrapper components
 * Use these instead of direct framer-motion imports
 */
export const MotionDiv = FramerMotionDiv as any;
export const MotionSection = FramerMotionSection as any;
export const MotionArticle = FramerMotionArticle as any;
export const MotionSpan = FramerMotionSpan as any;

/**
 * Utility: Use CSS animations for simple cases
 * Zero JavaScript, better performance
 */
export function useCSSAnimation(name: string) {
  return {
    className: `animate-${name}`,
  };
}

/**
 * Common animation variants (CSS-based, 0KB JS)
 * Add these to your tailwind.config.js or global CSS
 *
 * @example
 * // tailwind.config.js
 * module.exports = {
 *   theme: {
 *     extend: {
 *       keyframes: {
 *         fadeInUp: {
 *           '0%': { opacity: '0', transform: 'translateY(20px)' },
 *           '100%': { opacity: '1', transform: 'translateY(0)' },
 *         },
 *         fadeIn: {
 *           '0%': { opacity: '0' },
 *           '100%': { opacity: '1' },
 *         },
 *         slideInRight: {
 *           '0%': { transform: 'translateX(100%)' },
 *           '100%': { transform: 'translateX(0)' },
 *         },
 *       },
 *       animation: {
 *         'fade-in-up': 'fadeInUp 0.6s ease-out',
 *         'fade-in': 'fadeIn 0.4s ease-out',
 *         'slide-in-right': 'slideInRight 0.5s ease-out',
 *       },
 *     },
 *   },
 * }
 */

// Export CSS animation classes as constants for type safety
export const CSS_ANIMATIONS = {
  fadeInUp: 'animate-fade-in-up',
  fadeIn: 'animate-fade-in',
  slideInRight: 'animate-slide-in-right',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
} as const;

/**
 * Decision helper: When to use Framer Motion vs CSS
 *
 * Use CSS Animations when:
 * - Simple fade/slide effects
 * - No user interaction needed
 * - One-time animations on mount
 * - Performance is critical
 *
 * Use Framer Motion when:
 * - Complex orchestrated animations
 * - Gesture-based interactions (drag, tap)
 * - Layout animations (element repositioning)
 * - Physics-based animations
 */

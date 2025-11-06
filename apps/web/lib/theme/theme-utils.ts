/**
 * Theme utility functions and helpers
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates theme-aware CSS classes
 */
export function themeClass(base: string, variant?: 'primary' | 'secondary' | 'accent') {
  const baseClasses = base;

  if (!variant) return baseClasses;

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
    secondary: 'bg-[var(--color-secondary)] text-white hover:opacity-90',
    accent: 'bg-[var(--color-accent)] text-white hover:opacity-90',
  };

  return cn(baseClasses, variantClasses[variant]);
}

/**
 * Get CSS variable value
 */
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return '';

  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

/**
 * Set CSS variable value
 */
export function setCSSVariable(variableName: string, value: string) {
  if (typeof window === 'undefined') return;

  document.documentElement.style.setProperty(variableName, value);
}

/**
 * Responsive design tokens
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Common animation durations
 */
export const durations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

/**
 * Common easing functions
 */
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Common z-index values
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Generate responsive font size classes
 */
export function responsiveFontSize(
  base: string,
  md?: string,
  lg?: string
): string {
  const classes = [`text-${base}`];

  if (md) classes.push(`md:text-${md}`);
  if (lg) classes.push(`lg:text-${lg}`);

  return classes.join(' ');
}

/**
 * Generate responsive spacing classes
 */
export function responsiveSpacing(
  property: 'p' | 'm' | 'px' | 'py' | 'mx' | 'my',
  base: string,
  md?: string,
  lg?: string
): string {
  const classes = [`${property}-${base}`];

  if (md) classes.push(`md:${property}-${md}`);
  if (lg) classes.push(`lg:${property}-${lg}`);

  return classes.join(' ');
}

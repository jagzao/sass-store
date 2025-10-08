'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Elegant page transition variants with easeInOut timing
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1], // Custom ease-in-out for smoothness
  duration: 0.6
};

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Alternative slide transition for tenant switching
export const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  in: {
    x: 0,
    opacity: 1
  },
  out: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

export const slideTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30
};
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1
}: StaggerContainerProps) {
  const containerWithDelay = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2
      }
    }
  };

  return (
    <motion.div
      variants={containerWithDelay}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Item variants for stagger children
export const itemVariants = {
  hidden: {
    y: 20,
    opacity: 0,
    scale: 0.95
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    }
  }
};

// Card hover animation variants
export const cardHoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      type: 'tween',
      ease: 'easeOut'
    }
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2,
      type: 'tween',
      ease: 'easeOut'
    }
  }
};
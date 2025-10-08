'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
      mass: 0.8
    }
  }
};

const hoverVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.2,
      type: 'tween',
      ease: 'easeOut'
    }
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.2,
      type: 'tween',
      ease: 'easeOut'
    }
  }
};

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hover = true
}: AnimatedCardProps) {
  const cardProps = {
    variants: cardVariants,
    initial: "hidden",
    animate: "visible",
    transition: { delay },
    className
  };

  if (hover) {
    return (
      <motion.div
        {...cardProps}
        variants={hoverVariants}
        initial="rest"
        whileHover="hover"
        animate="rest"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div {...cardProps}>
      {children}
    </motion.div>
  );
}

// Product card specific animation
export function ProductCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={hoverVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// Hero section animation
export const heroVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.2
    }
  }
};

export const heroItemVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};
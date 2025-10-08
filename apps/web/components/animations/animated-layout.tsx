'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AnimatedLayoutProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 1.02
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1], // Smooth ease-in-out
  duration: 0.5
};

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => window.scrollTo(0, 0)}
    >
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Specific animation for tenant switching
export function TenantSwitchAnimation({ children, tenantSlug }: { children: ReactNode; tenantSlug: string }) {
  const tenantVariants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1
      }
    },
    out: {
      opacity: 0,
      y: -30,
      scale: 1.05,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tenantSlug}
        initial="initial"
        animate="in"
        exit="out"
        variants={tenantVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
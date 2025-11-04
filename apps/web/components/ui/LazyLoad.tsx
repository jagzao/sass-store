'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  height?: string;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente para lazy loading de contenido
 */
export const LazyLoad = ({
  children,
  height = '200px',
  rootMargin = '100px',
  threshold = 0.1,
  className = '',
  fallback = null,
}: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Una vez que se carga, desconectamos el observador
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={elementRef} style={{ minHeight: isVisible ? undefined : height }} className={className}>
      {isVisible ? children : fallback || <div style={{ height }} />}
    </div>
  );
};
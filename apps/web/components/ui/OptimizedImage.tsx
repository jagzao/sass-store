'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  sizes?: string;
  quality?: number;
}

/**
 * Componente de imagen optimizada con lazy loading, placeholder y otras optimizaciones
 */
export const OptimizedImage = React.forwardRef<HTMLDivElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      className = '',
      priority = false,
      placeholder = 'blur',
      blurDataURL = '/placeholder.jpg',
      fill = false,
      style,
      sizes,
      quality = 75,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Detectar si la imagen está en la vista para lazy loading
    useEffect(() => {
      if (!containerRef.current || priority) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsLoading(false);
            observer.disconnect();
          }
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    }, [priority]);

    if (hasError || !src) {
      // Mostrar placeholder o fallback
      return (
        <div 
          ref={containerRef}
          className={`bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}
          style={style}
        >
          <span className="text-gray-500">📷</span>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef} 
        className={`overflow-hidden ${className}`}
        style={style}
      >
        {isLoading && placeholder === 'blur' && (
          <div className="bg-gray-200 animate-pulse w-full h-full flex items-center justify-center">
            <span className="text-gray-500">📷</span>
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          unoptimized={priority} // Solo si es prioridad, no optimizar para evitar demoras
          {...props as any}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
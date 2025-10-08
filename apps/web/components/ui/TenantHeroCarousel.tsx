'use client';

import React, { Suspense } from 'react';
import { useTenantWidget, useHasCustomWidget, logTenantWidgetInfo } from '@/lib/tenant-widget-registry';

interface TenantHeroCarouselProps {
  tenantSlug: string;
  tenantData?: any; // Para widgets que requieren datos del tenant
  className?: string;
  autoRotate?: boolean;
  [key: string]: any; // Props adicionales que pueden necesitar los widgets
}

// Componente de loading para Suspense
function HeroCarouselSkeleton() {
  return (
    <div
      className="w-full h-screen bg-gradient-to-br from-gray-900 to-gray-800 animate-pulse"
      role="status"
      aria-label="Cargando carousel hero"
    >
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text area skeleton */}
            <div className="space-y-6">
              <div className="w-24 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="space-y-4">
                <div className="w-full h-12 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-3/4 h-8 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-5/6 h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-2/3 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-4">
                <div className="w-32 h-12 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="w-32 h-12 bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Image area skeleton */}
            <div className="relative">
              <div className="w-full aspect-square bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Controls skeleton */}
          <div className="flex justify-center items-center gap-6 mt-8">
            <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
              ))}
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error fallback component
function HeroCarouselError({ tenantSlug, error }: { tenantSlug: string; error?: Error }) {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-red-900 to-gray-900 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h2 className="text-2xl font-bold mb-4">Error en Hero Carousel</h2>
        <p className="text-gray-600 mb-4">
          No se pudo cargar el carousel para el tenant: <code className="bg-gray-800 px-2 py-1 rounded">{tenantSlug}</code>
        </p>
        {error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-gray-600">Detalles del error</summary>
            <pre className="mt-2 text-sm text-gray-500 bg-gray-800 p-4 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default function TenantHeroCarousel({
  tenantSlug,
  tenantData,
  className = '',
  autoRotate = true,
  ...props
}: TenantHeroCarouselProps) {
  const widget = useTenantWidget(tenantSlug, 'heroCarousel');
  const hasCustomWidget = useHasCustomWidget(tenantSlug, 'heroCarousel');

  // Log para desarrollo (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    logTenantWidgetInfo(tenantSlug);
  }

  if (!widget) {
    console.error(`No se encontró widget heroCarousel para tenant: ${tenantSlug}`);
    return <HeroCarouselError tenantSlug={tenantSlug} />;
  }

  const WidgetComponent = widget.component;

  // Props específicos según el tipo de widget
  const widgetProps = hasCustomWidget ? {
    // Widgets personalizados (como Wondernails) no necesitan tenantData
    className,
    autoRotate,
    ...props
  } : {
    // Widget default necesita tenantData
    tenantData,
    className,
    autoRotate,
    ...props
  };

  try {
    return (
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <WidgetComponent {...widgetProps} />
      </Suspense>
    );
  } catch (error) {
    console.error(`Error rendering hero carousel for ${tenantSlug}:`, error);
    return <HeroCarouselError tenantSlug={tenantSlug} error={error as Error} />;
  }
}
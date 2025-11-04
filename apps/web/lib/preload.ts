// Utilidades para preload estratégico de recursos críticos

export function preloadCriticalResources(tenantSlug: string) {
  if (typeof window === 'undefined') return;

  // Preload APIs críticas
  const criticalAPIs = [
    `/api/tenants/${tenantSlug}`,
    // Note: Skipping product API preload since it now calls external API directly
    // Product preload will be handled through the API client
  ];

  criticalAPIs.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload componentes críticos
  const criticalComponents = [
    '/_next/static/chunks/pages/t/[tenant]/page.js',
    '/_next/static/chunks/components/ui/TenantHeroCarousel.js',
  ];

  criticalComponents.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'script';
    document.head.appendChild(link);
  });
}

export function preloadImages(imageUrls: string[]) {
  if (typeof window === 'undefined') return;

  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

// Hook para preload automático
export function usePreload() {
  // Implementar lógica de preload inteligente aquí
}
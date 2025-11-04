// Web Vitals tracking para monitoreo de performance (gratis)
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Log para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('[WebVitals]', metric);
  }

  // Alertas para métricas lentas
  const { name, value } = metric;

  switch (name) {
    case 'LCP':
      if (value > 2500) {
        console.warn(`[Performance] LCP muy lento: ${value}ms`);
      }
      break;
    case 'FID':
      if (value > 100) {
        console.warn(`[Performance] FID lento: ${value}ms`);
      }
      break;
    case 'CLS':
      if (value > 0.1) {
        console.warn(`[Performance] CLS alto: ${value}`);
      }
      break;
    case 'FCP':
      if (value > 1800) {
        console.warn(`[Performance] FCP lento: ${value}ms`);
      }
      break;
  }

  // En producción, enviar a servicio de monitoreo
  if (process.env.NODE_ENV === 'production') {
    // Aquí se podría integrar con servicios como:
    // - Vercel Analytics
    // - Google Analytics 4
    // - Sentry
    // - DataDog
    // Por ahora solo log
    console.log(`[WebVitals] ${name}: ${value}`);
  }
}

export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Solo inicializar si es producción o si se fuerza en desarrollo
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_TRACK_VITALS === 'true') {
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }
}
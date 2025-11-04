import { ImageProps } from 'next/image';

/**
 * Optimizaciones de imagen para rendimiento
 */
export const optimizeImage = (
  src: string,
  width?: number,
  quality?: number = 75,
  format?: 'webp' | 'jpeg' | 'png' = 'webp'
): string => {
  // Si es una URL de Cloudinary o similar, aplicar optimizaciones
  if (src.startsWith('https://res.cloudinary.com') || src.includes('cloudinary')) {
    // Construir URL de optimización para Cloudinary
    const parts = src.split('/');
    const publicId = parts.pop();
    const transformations = [
      `f_${format}`,
      `q_${quality}`,
      width ? `w_${width}` : '',
    ].filter(Boolean).join(',');

    return `${parts.join('/')}/${transformations}/${publicId}`;
  }

  // Para otros servicios, devolver la URL original con query params si es posible
  const url = new URL(src, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
  
  if (quality && !url.searchParams.has('q')) {
    url.searchParams.set('q', quality.toString());
  }
  
  if (width && !url.searchParams.has('w')) {
    url.searchParams.set('w', width.toString());
  }
  
  if (format && !url.searchParams.has('f')) {
    url.searchParams.set('f', format);
  }

  return url.toString();
};

/**
 * Hook para determinar la calidad de imagen basado en el dispositivo
 */
export const useImageQuality = (): number => {
  if (typeof window === 'undefined') return 75;

  // Detectar si el dispositivo tiene ancho reducido (móbiles)
  const isMobile = window.innerWidth < 768;
  
  // Detectar si está activo el modo de ahorro de datos
  const isDataSaver = (navigator as any).connection?.saveData;
  
  // Ajustar calidad basado en condiciones
  if (isDataSaver) return 50;
  if (isMobile) return 65;
  
  return 75; // Calidad estándar para escritorio
};

/**
 * Hook para determinar el tamaño de imagen basado en el contexto
 */
export const useImageSize = (context: 'product' | 'hero' | 'thumbnail' | 'avatar' = 'thumbnail'): number => {
  switch (context) {
    case 'product':
      return 400; // Para páginas de producto
    case 'hero':
      return 1200; // Para imágenes hero
    case 'avatar':
      return 100; // Para avatares
    case 'thumbnail':
    default:
      return 200; // Para miniaturas
  }
};
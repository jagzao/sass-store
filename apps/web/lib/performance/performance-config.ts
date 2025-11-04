/**
 * Configuración de optimización de rendimiento para toda la aplicación
 * 
 * Esta configuración controla varios aspectos del rendimiento:
 * - Animaciones y transiciones
 * - Carga de recursos
 * - Uso de memoria
 * - Optimizaciones específicas por dispositivo
 */

export const PERFORMANCE_CONFIG = {
  // Configuración de animaciones
  ANIMATIONS: {
    // Desactivar animaciones pesadas en dispositivos móviles
    DISABLE_ON_MOBILE: false,
    
    // Reducir calidad de animaciones en dispositivos de gama baja
    REDUCE_QUALITY_ON_LOW_END: true,
    
    // Duración máxima de animaciones (ms)
    MAX_DURATION: 1000,
    
    // FPS objetivo para animaciones
    TARGET_FPS: 60,
    
    // FPS mínimo aceptable
    MIN_FPS: 30
  },

  // Configuración de carga de imágenes
  IMAGES: {
    // Tamaño máximo de imagen (bytes)
    MAX_SIZE: 500 * 1024, // 500KB
    
    // Calidad de compresión
    QUALITY: {
      HIGH: 85,
      MEDIUM: 75,
      LOW: 60
    },
    
    // Formatos preferidos
    FORMATS: ['webp', 'avif', 'jpeg'],
    
    // Tamaños predefinidos
    SIZES: {
      THUMBNAIL: 200,
      SMALL: 400,
      MEDIUM: 800,
      LARGE: 1200,
      XL: 1600
    }
  },

  // Configuración de lazy loading
  LAZY_LOADING: {
    // Margen de precarga (px)
    ROOT_MARGIN: '100px',
    
    // Umbral de visibilidad (0-1)
    THRESHOLD: 0.1,
    
    // Número máximo de recursos cargando simultáneamente
    MAX_CONCURRENT: 3
  },

  // Configuración de cache
  CACHE: {
    // Duración de cache para recursos estáticos (segundos)
    STATIC_DURATION: 31536000, // 1 año
    
    // Duración de cache para recursos dinámicos (segundos)
    DYNAMIC_DURATION: 300, // 5 minutos
    
    // Tamaño máximo de cache (bytes)
    MAX_SIZE: 50 * 1024 * 1024 // 50MB
  },

  // Configuración por tipo de dispositivo
  DEVICE: {
    // Configuración para dispositivos móviles
    MOBILE: {
      ANIMATIONS: {
        DISABLE_COMPLEX: true,
        REDUCE_FPS: true,
        SIMPLIFY_EFFECTS: true
      },
      IMAGES: {
        QUALITY: 'LOW',
        MAX_SIZE: 300 * 1024, // 300KB
        SIZES: {
          THUMBNAIL: 150,
          SMALL: 300,
          MEDIUM: 600,
          LARGE: 800,
          XL: 1000
        }
      }
    },
    
    // Configuración para tablets
    TABLET: {
      ANIMATIONS: {
        DISABLE_COMPLEX: false,
        REDUCE_FPS: true,
        SIMPLIFY_EFFECTS: false
      },
      IMAGES: {
        QUALITY: 'MEDIUM',
        MAX_SIZE: 400 * 1024, // 400KB
        SIZES: {
          THUMBNAIL: 175,
          SMALL: 350,
          MEDIUM: 700,
          LARGE: 1000,
          XL: 1300
        }
      }
    },
    
    // Configuración para escritorio
    DESKTOP: {
      ANIMATIONS: {
        DISABLE_COMPLEX: false,
        REDUCE_FPS: false,
        SIMPLIFY_EFFECTS: false
      },
      IMAGES: {
        QUALITY: 'HIGH',
        MAX_SIZE: 500 * 1024, // 500KB
        SIZES: {
          THUMBNAIL: 200,
          SMALL: 400,
          MEDIUM: 800,
          LARGE: 1200,
          XL: 1600
        }
      }
    }
  },

  // Umbrales de métricas de rendimiento
  THRESHOLDS: {
    // Largest Contentful Paint (ms)
    LCP: 2500,
    
    // First Input Delay (ms)
    FID: 100,
    
    // Cumulative Layout Shift
    CLS: 0.1,
    
    // Time to First Byte (ms)
    TTFB: 800,
    
    // First Contentful Paint (ms)
    FCP: 1800
  },

  // Optimizaciones específicas
  OPTIMIZATIONS: {
    // Prefetch de recursos
    PREFETCH: {
      ENABLED: true,
      ON_HOVER_DELAY: 50, // ms
      MAX_PREFETCHES: 3
    },
    
    // Preload de recursos críticos
    PRELOAD: {
      ENABLED: true,
      CRITICAL_RESOURCES: 5
    },
    
    // Compresión
    COMPRESSION: {
      ENABLED: true,
      LEVEL: 'optimal' // 'speed' | 'optimal' | 'best'
    }
  }
};

/**
 * Detectar tipo de dispositivo
 */
export const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  
  if (width <= 768) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
};

/**
 * Obtener configuración para el dispositivo actual
 */
export const getDeviceConfig = () => {
  const deviceType = detectDeviceType();
  return PERFORMANCE_CONFIG.DEVICE[deviceType.toUpperCase() as 'MOBILE' | 'TABLET' | 'DESKTOP'];
};

/**
 * Verificar si el dispositivo tiene capacidades bajas
 */
export const isLowEndDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // Verificar memoria disponible
  if ((navigator as any).deviceMemory) {
    return (navigator as any).deviceMemory < 2; // Menos de 2GB RAM
  }
  
  // Verificar número de núcleos de CPU
  if (navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency <= 4; // 4 o menos núcleos
  }
  
  // Verificar conexión lenta
  if ((navigator as any).connection) {
    const connection = (navigator as any).connection;
    return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
  }
  
  return false;
};

/**
 * Obtener configuración optimizada para el dispositivo actual
 */
export const getOptimizedConfig = () => {
  const baseConfig = { ...PERFORMANCE_CONFIG };
  const deviceConfig = getDeviceConfig();
  const isLowEnd = isLowEndDevice();

  // Aplicar configuración específica del dispositivo
  baseConfig.ANIMATIONS = {
    ...baseConfig.ANIMATIONS,
    ...deviceConfig.ANIMATIONS
  };

  baseConfig.IMAGES = {
    ...baseConfig.IMAGES,
    ...deviceConfig.IMAGES
  };

  // Aplicar optimizaciones para dispositivos de gama baja
  if (isLowEnd) {
    baseConfig.ANIMATIONS.DISABLE_COMPLEX = true;
    baseConfig.ANIMATIONS.REDUCE_FPS = true;
    baseConfig.IMAGES.QUALITY = 'LOW';
    baseConfig.LAZY_LOADING.MAX_CONCURRENT = 1;
  }

  return baseConfig;
};

export default PERFORMANCE_CONFIG;
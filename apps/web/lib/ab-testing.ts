// A/B Testing simple para estrategias de carga (gratis)
interface ABTestVariant {
  name: string;
  weight: number; // Peso relativo (ej: 50 = 50%)
}

interface ABTest {
  name: string;
  variants: ABTestVariant[];
}

class ABTesting {
  private tests: Map<string, ABTest> = new Map();

  constructor() {
    // Definir tests disponibles
    this.defineTest('loading-strategy', [
      { name: 'parallel', weight: 70 }, // 70% de usuarios
      { name: 'sequential', weight: 30 } // 30% de usuarios
    ]);

    this.defineTest('cache-strategy', [
      { name: 'aggressive', weight: 60 },
      { name: 'conservative', weight: 40 }
    ]);
  }

  private defineTest(name: string, variants: ABTestVariant[]) {
    this.tests.set(name, { name, variants });
  }

  // Obtener variante para un usuario específico (basado en ID o session)
  public getVariant(testName: string, userId?: string): string {
    const test = this.tests.get(testName);
    if (!test) return 'default';

    // Usar userId o generar ID consistente basado en session
    const seed = userId || this.getSessionId();

    // Simple hash consistente para distribución
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convertir a 32-bit
    }

    const normalizedHash = Math.abs(hash) % 100;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (normalizedHash < cumulativeWeight) {
        return variant.name;
      }
    }

    return test.variants[0].name; // Fallback
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    // Usar sessionStorage para consistencia durante la sesión
    let sessionId = sessionStorage.getItem('ab-session-id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2);
      sessionStorage.setItem('ab-session-id', sessionId);
    }
    return sessionId;
  }

  // Registrar resultado de test (para análisis posterior)
  public trackResult(testName: string, variant: string, metric: string, value: number) {
    if (typeof window === 'undefined') return;

    // En desarrollo, loggear
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AB Test] ${testName}:${variant} - ${metric}: ${value}`);
    }

    // En producción, se podría enviar a analytics
    // Ejemplo: gtag('event', 'ab_test_result', { test_name: testName, variant, metric, value });
  }

  // Obtener todos los tests activos para un usuario
  public getActiveTests(userId?: string): Record<string, string> {
    const activeTests: Record<string, string> = {};

    for (const [testName] of this.tests) {
      activeTests[testName] = this.getVariant(testName, userId);
    }

    return activeTests;
  }
}

// Instancia global
export const abTesting = new ABTesting();

// Hooks útiles para React
export function useABTest(testName: string, userId?: string) {
  const variant = abTesting.getVariant(testName, userId);

  const trackResult = (metric: string, value: number) => {
    abTesting.trackResult(testName, variant, metric, value);
  };

  return { variant, trackResult };
}

// Función para determinar estrategia de carga basada en A/B test
export function getLoadingStrategy(userId?: string): 'parallel' | 'sequential' {
  const variant = abTesting.getVariant('loading-strategy', userId);
  return variant as 'parallel' | 'sequential';
}

// Función para determinar estrategia de cache
export function getCacheStrategy(userId?: string): 'aggressive' | 'conservative' {
  const variant = abTesting.getVariant('cache-strategy', userId);
  return variant as 'aggressive' | 'conservative';
}
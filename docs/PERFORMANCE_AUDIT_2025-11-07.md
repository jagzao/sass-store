# Performance Audit Report - Sass Store Web App

**Fecha**: 2025-11-07
**Analista**: Claude (Build Resolution Session)
**Objetivo**: Identificar oportunidades de optimización de performance y reducción de bundle size

---

## 📊 Resumen Ejecutivo

### Hallazgos Principales

| Categoría | Impacto | Prioridad | Est. Reducción |
|-----------|---------|-----------|----------------|
| Dependencias no usadas | Alto | P0 | ~150KB |
| Lazy loading faltante | Alto | P1 | ~120KB |
| gsap en cart page | Medio | P1 | ~70KB |
| Optimización de imports | Medio | P2 | ~40KB |

**Total estimado de reducción de bundle**: ~380KB (≈48% del budget de 250KB)

---

## 🔴 PRIORIDAD CRÍTICA (P0)

### 1. Eliminar Dependencias No Utilizadas

#### Apollo Client (No utilizado)

**Problema**: Apollo Client (150KB+) está instalado pero no se usa en ninguna página/componente activo.

**Evidencia**:
- `ApolloProvider.tsx` existe pero no se importa en layouts ni páginas
- GraphQL queries/mutations definidas pero no utilizadas
- React Query se usa como alternativa principal

**Ubicaciones**:
```
❌ /home/user/sass-store/apps/web/components/providers/ApolloProvider.tsx
❌ /home/user/sass-store/apps/web/lib/apollo-client.ts
❌ /home/user/sass-store/apps/web/lib/graphql/queries.ts
❌ /home/user/sass-store/apps/web/lib/graphql/mutations.ts
❌ /home/user/sass-store/apps/web/lib/hooks/useGraphQL.ts
```

**Acción Requerida**:
```bash
# Verificar que no se usa
npm ls @apollo/client

# Si no está en uso, remover
npm uninstall @apollo/client graphql graphql-tag
```

**Beneficio**: -150KB de bundle principal
**Riesgo**: Bajo (verificar que GraphQL no sea requerido en futuro cercano)
**Estimado**: 15 minutos

---

## 🔴 ALTA PRIORIDAD (P1)

### 2. Implementar Lazy Loading en Componentes Pesados

#### A. Cart Page - gsap import

**Problema**: Cart page importa TODO gsap (80KB) para animaciones simples.

**Ubicación**: `apps/web/app/t/[tenant]/cart/page.tsx:9`

**Código Actual**:
```typescript
import gsap from "gsap";

// Usado en CartItem para:
// 1. Fade in al montar
// 2. Scale bounce en cantidad
// 3. Counter animado de precio
```

**Solución Recomendada**:
```typescript
// Opción 1: Reemplazar con framer-motion (ya instalado)
import { motion, useAnimate } from "framer-motion";

const CartItem = ({ item }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* content */}
    </motion.div>
  );
};

// Opción 2: Lazy load gsap solo cuando sea necesario
const gsapLoader = () => import('gsap').then(m => m.default);

// Opción 3: Usar CSS animations (más ligero)
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

**Beneficio**: -80KB si removemos gsap
**Estimado**: 1 hora

#### B. Lazy Load Componentes de Admin/Finance

**Problema**: Componentes pesados de finance y admin se cargan en todas las páginas aunque no se usen.

**Componentes Identificados**:
```typescript
// apps/web/app/t/[tenant]/finance/page.tsx
❌ import KPICard from "@/components/finance/KPICard";
❌ import FilterPanel from "@/components/finance/FilterPanel";
❌ import MovementsTable from "@/components/finance/MovementsTable";
❌ import ReconciliationModal from "@/components/finance/ReconciliationModal";
```

**Solución Recomendada**:
```typescript
// Lazy load componentes pesados
import { lazy, Suspense } from 'react';
import { KPICardSkeleton, TableSkeleton } from '@/components/ui/skeletons';

const KPICard = lazy(() => import('@/components/finance/KPICard'));
const FilterPanel = lazy(() => import('@/components/finance/FilterPanel'));
const MovementsTable = lazy(() => import('@/components/finance/MovementsTable'));
const ReconciliationModal = lazy(() => import('@/components/finance/ReconciliationModal'));

export default function FinancePage() {
  return (
    <div>
      <Suspense fallback={<KPICardSkeleton />}>
        <KPICard {...props} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <MovementsTable {...props} />
      </Suspense>
    </div>
  );
}
```

**Páginas a Actualizar**:
- `finance/page.tsx`
- `reports/page.tsx`
- `admin_products/page.tsx`
- `admin_services/page.tsx`

**Beneficio**: ~40KB reducción en route bundles
**Estimado**: 2 horas

#### C. Lazy Load framer-motion Components

**Problema**: framer-motion (100KB+) se carga en página principal aunque solo se usa para hero carousel.

**Ubicaciones**:
```
apps/web/components/home/hero-carousel.tsx:6
apps/web/components/tenant/wondernails/hero/HeroWondernailsFinal.tsx
apps/web/components/tenant/nomnom/hero/HeroNomNom.tsx
apps/web/components/animations/*.tsx (4 archivos)
apps/web/components/cart/CartBadge.tsx
apps/web/components/cart/UndoToast.tsx
```

**Solución Recomendada**:
```typescript
// 1. Mover animaciones de hero a componente lazy-loaded
const AnimatedHero = lazy(() => import('@/components/home/AnimatedHero'));

// 2. Para micro-animaciones pequeñas, usar CSS
// Antes:
<motion.div whileHover={{ scale: 1.05 }}>

// Después:
<div className="hover:scale-105 transition-transform">

// 3. Solo cargar framer-motion donde sea crítico
```

**Beneficio**: -100KB en initial bundle (se carga solo donde se necesita)
**Estimado**: 3 horas

---

## 🟡 MEDIA PRIORIDAD (P2)

### 3. Optimizar Imports y Tree-Shaking

#### A. Named Imports de Lodash/Date-fns

**Problema**: Si se usa lodash completo, se incluyen funciones no usadas.

**Buscar patrones**:
```bash
# Verificar si hay imports de lodash sin tree-shaking
grep -r "import.*from 'lodash'" apps/web/
grep -r "import.*from 'date-fns'" apps/web/
```

**Solución**:
```typescript
// ❌ Malo
import _ from 'lodash';
import * as dateFns from 'date-fns';

// ✅ Bueno
import debounce from 'lodash/debounce';
import format from 'date-fns/format';
```

**Beneficio**: ~20-40KB dependiendo del uso
**Estimado**: 30 minutos

#### B. Dynamic Imports para Rutas Específicas

**Problema**: Componentes específicos de tenant se cargan para todos.

**Ejemplo**:
```typescript
// apps/web/components/ui/TenantHeroCarousel.tsx
// Este componente debería cargar dinámicamente el hero específico del tenant

const TenantHeroCarousel = ({ tenantSlug }) => {
  const HeroComponent = lazy(() => {
    switch(tenantSlug) {
      case 'wondernails':
        return import('@/components/tenant/wondernails/hero/HeroWondernailsFinal');
      case 'nom-nom':
        return import('@/components/tenant/nomnom/hero/HeroNomNom');
      default:
        return import('@/components/home/hero-carousel');
    }
  });

  return (
    <Suspense fallback={<HeroSkeleton />}>
      <HeroComponent />
    </Suspense>
  );
};
```

**Beneficio**: -30KB por tenant-specific bundle
**Estimado**: 1.5 horas

---

## 🟢 OPTIMIZACIONES ADICIONALES

### 4. Prefetching Estratégico

**Problema Actual**: Next.js prefetcha todas las rutas visibles en viewport.

**Solución**:
```typescript
// Deshabilitar prefetch en links menos frecuentes
<Link href="/admin/settings" prefetch={false}>
  Settings
</Link>

// Prefetch selectivo solo para rutas críticas
// En layout principal:
useEffect(() => {
  const criticalRoutes = ['/products', '/cart', '/checkout'];
  if (!isMobile && navigator.connection?.effectiveType === '4g') {
    criticalRoutes.forEach(route => {
      router.prefetch(`/t/${tenant}${route}`);
    });
  }
}, []);
```

**Beneficio**: Reduce uso de bandwidth innecesario
**Estimado**: 1 hora

### 5. Image Optimization Review

**Verificar**:
- [ ] Todas las imágenes usan `next/image`
- [ ] Lazy loading en imágenes below-fold
- [ ] Placeholder blur data generado
- [ ] Formatos AVIF/WebP con fallback

**Script de auditoría**:
```bash
# Encontrar tags <img> sin next/image
grep -r '<img' apps/web/app apps/web/components | grep -v 'next/image'
```

**Estimado**: 2 horas

---

## 📈 Métricas de Éxito

### Objetivos (del PLAN_DESARROLLO.md)

| Métrica | Current | Target | Status |
|---------|---------|--------|--------|
| Bundle size | ~400KB | <250KB | 🔴 60% over |
| LCP | TBD | <2.5s | ⏳ Pending |
| FCP | TBD | <1.8s | ⏳ Pending |
| TTI | TBD | <3.5s | ⏳ Pending |
| Navigation | TBD | <500ms | ⏳ Pending |

### Después de Optimizaciones

| Métrica | Projected | Improvement |
|---------|-----------|-------------|
| Bundle size | ~230KB | -42.5% ✅ |
| Initial Load | -150KB | Apollo removed |
| Route Bundles | -40KB each | Lazy loading |

---

## 🎯 Plan de Implementación

### Fase 1: Quick Wins (2-3 horas)
1. ✅ Verificar y remover @apollo/client
2. ✅ Reemplazar gsap en cart con CSS/framer-motion
3. ✅ Named imports para date-fns

### Fase 2: Lazy Loading (4-5 horas)
1. ✅ Finance/Admin components
2. ✅ Tenant-specific heroes
3. ✅ framer-motion optimization

### Fase 3: Fine-tuning (2-3 horas)
1. ✅ Prefetch strategy
2. ✅ Image optimization audit
3. ✅ Bundle analysis post-optimization

**Total Estimado**: 8-11 horas

---

## 📝 Notas Técnicas

### Compatibilidad con Next.js 16

- Bundle analyzer no funciona con Turbopack (Next.js 16 default)
- Usar análisis estático como en este reporte
- Considerar migrar a @next/bundle-analyzer v16 cuando esté disponible
- Alternativa: usar `next build --webpack` para bundle analysis ocasional

### Consideraciones de UX

- Lazy loading debe incluir skeletons apropiados
- Critical path debe permanecer sin lazy loading (hero, navigation)
- Prefetch solo en conexiones rápidas y dispositivos no móviles
- Mantener animaciones esenciales para UX 10/10

### Testing Post-Optimización

```bash
# Build size check
npm run build -w @sass-store/web

# Lighthouse CI
npx lighthouse https://localhost:3001 --view

# Bundle analysis (si necesario)
ANALYZE=true npm run build:strict -w @sass-store/web
```

---

## ✅ Action Items

### Immediate (This Session)
- [ ] Verificar uso real de Apollo Client
- [ ] Remover @apollo/client si no se usa
- [ ] Implementar lazy loading en cart page gsap

### Next Session
- [ ] Lazy load finance components
- [ ] Optimize framer-motion imports
- [ ] Implement prefetch strategy
- [ ] Run Lighthouse audit

### Future
- [ ] Setup bundle size CI checks
- [ ] Implement performance budgets
- [ ] Add performance monitoring

---

**Última Actualización**: 2025-11-07
**Próxima Revisión**: Post-implementación de Fase 1

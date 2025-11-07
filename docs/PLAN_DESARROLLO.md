# Plan de Desarrollo - Sass Store

## Documento de Mejoras y Pendientes Técnicos

**Fecha**: 2025-11-07
**Última Actualización**: Sesión de Continuación

---

## 🔴 PRIORIDAD CRÍTICA - BLOQUEANTES

### 1. **Errores de Build (BLOQUEANTE INMEDIATO)**

#### Error 1: Import incorrecto de oauth-state en API

**Ubicación**: `apps/api/app/api/mercadopago/callback/route.ts:4`

```typescript
// ❌ Actual (Falla)
import { validateOAuthState } from "@sass-store/core/security/oauth-state";

// ✅ Corrección Necesaria
import { validateOAuthState } from "@sass-store/core";
```

**Causa**: En sesión anterior se creó el export en `packages/core/src/index.ts` que exporta todo desde `./security`, pero no se actualizó el import en la API.

**Impacto**: Build falla completamente, imposible deployment
**Prioridad**: CRÍTICA - Debe arreglarse INMEDIATAMENTE
**Estimado**: 5 minutos

#### Error 2: Paquete faltante de Apollo Server

**Ubicación**: `node_modules/@apollo/server/dist/cjs/incrementalDeliveryPolyfill.js:44`

```bash
Module not found: Can't resolve '@yaacovcr/transform'
```

**Causa**: Paquete opcional de Apollo Server no instalado
**Solución**:

- Opción A: Instalar el paquete (si es necesario para features incrementales)
- Opción B: Configurar Apollo sin incremental delivery (más ligero)

**Impacto**: Build de API falla
**Prioridad**: CRÍTICA - Bloqueante para producción
**Estimado**: 10-15 minutos

**Acción Inmediata**:

```bash
# Investigar si necesitamos incremental delivery
# Si no, deshabilitar en Apollo config
# Si sí, instalar:
npm install @yaacovcr/transform --save-optional
```

---

## 🔴 ALTA PRIORIDAD

### 2. **Performance en Navegación Entre Páginas**

**Problema Reportado**: Lentitud al navegar entre páginas del tenant

#### Investigación Necesaria

**A. Análisis de Bundle Size**

- [ ] Ejecutar build con bundle analyzer
- [ ] Identificar páginas con bundles >250KB
- [ ] Listar dependencias pesadas por página
- [ ] Verificar code splitting effectiveness

**Comando**:

```bash
# Instalar analyzer
npm install @next/bundle-analyzer --save-dev

# Modificar next.config.js temporalmente
ANALYZE=true npm run build
```

**B. Identificar Imports Pesados**
Candidatos probables (basado en package.json):

- `framer-motion` (12.23.22) - 100KB+
- `gsap` (3.13.0) - 80KB+
- `@apollo/client` (4.0.7) - 150KB+
- `@tanstack/react-query` - ~80KB

**C. Lazy Loading de Componentes Grandes**
Componentes que deberían ser lazy-loaded:

```typescript
// VirtualList, Carousels, Modals, Charts, etc.
const VirtualList = dynamic(() => import('@/components/ui/VirtualList'), {
  loading: () => <ListSkeleton />,
  ssr: false // si no es crítico para SEO
});
```

**D. Prefetching Estratégico**

- Verificar si Next.js está prefetching demasiadas rutas
- Implementar prefetch selectivo solo para rutas frecuentes
- Deshabilitar prefetch en mobile (bandwidth limited)

```typescript
<Link href="/products" prefetch={false}>Products</Link>
```

**E. Suspense Boundaries**

- Implementar Suspense en layouts principales
- Streaming de componentes pesados
- Progressive loading para mejor UX

**Métricas Target**:

- FCP (First Contentful Paint): <1.8s
- LCP (Largest Contentful Paint): <2.5s
- TTI (Time to Interactive): <3.5s
- Navigation Speed: <500ms (P75)

**Estimado**: 2-4 horas investigación + 4-8 horas implementación

---

### 3. **Eliminación Progresiva de Tipos `any`**

#### Estado Actual

✅ **Completado**: 42 tipos eliminados en archivos críticos

- `lib/db/connection.ts` (31 eliminados)
- `components/performance/PerformanceOptimizer.tsx` (11 eliminados)

#### Pendientes (Orden de Prioridad)

**Prioridad 1: Páginas Críticas**

- `app/t/[tenant]/page.tsx` → 10 occurrencias
- `app/t/[tenant]/products/page.tsx` → 6 occurrencias
- `app/t/[tenant]/reports/page.tsx` → 7 occurrencias

**Prioridad 2: Servicios de Negocio**

- `lib/db/tenant-service.ts` → 7 occurrencias
- `lib/cart/cart-store.ts` → verificar (posible uso de any)
- `lib/auth/*` → verificar tipos de JWT/sesión

**Prioridad 3: Componentes de UI**

- `components/finance/*` → revisar tipos en tablas/gráficos
- `components/social-planner/*` → tipos de posts/media

**Estrategia**:

1. Crear interfaces claras para cada domain entity
2. Usar `unknown` en lugar de `any` cuando el tipo es dinámico
3. Implementar type guards para runtime validation
4. Documentar tipos complejos con JSDoc

**Estimado**: 1 hora por archivo crítico = ~8 horas total

---

### 4. **Migración de Formularios a Componentes Reutilizables**

#### Componentes Reutilizables Disponibles

✅ Creados en sesión anterior:

- `FormInput` - Input genérico con validación
- `PasswordInput` - Input de password con toggle
- `FormSelect` - Select con estilos consistentes
- `FormTextarea` - Textarea con contador

#### Formularios Pendientes de Migración

**Alta Prioridad**:

1. **`components/social-planner/post-composer.tsx`**
   - Inputs: título, texto, fecha/hora
   - Beneficio: Validación consistente, mejor UX
   - Estimado: 1 hora

2. **`components/home/contact-section.tsx`**
   - Inputs: nombre, email, teléfono, mensaje
   - Beneficio: Accesibilidad mejorada, validación email
   - Estimado: 45 minutos

**Media Prioridad**: 3. **`components/finance/FilterPanel.tsx`**

- Selects: categoría, rango de fechas
- Beneficio: Filtros consistentes, mejor UX
- Estimado: 30 minutos

4. **`components/finance/ReconciliationModal.tsx`**
   - Inputs: montos, referencias
   - Beneficio: Validación de números, formato consistente
   - Estimado: 45 minutos

**Baja Prioridad**: 5. **`components/navigation/top-nav.tsx`**

- Input: búsqueda global
- Beneficio: Accesibilidad, autocomplete consistente
- Estimado: 30 minutos

**Total Estimado**: 3.5 horas

---

## 🟡 PRIORIDAD MEDIA

### 5. **Optimizaciones de Performance Adicionales**

#### A. Implementar React Suspense en Layouts

```typescript
// app/t/[tenant]/layout.tsx
import { Suspense } from 'react';

export default function TenantLayout({ children }) {
  return (
    <div>
      <Suspense fallback={<NavSkeleton />}>
        <Navigation />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        {children}
      </Suspense>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
```

**Beneficio**: Mejor percepción de velocidad, streaming HTML
**Estimado**: 2 horas

#### B. Optimización de Imágenes

**Auditoría Necesaria**:

- Verificar uso consistente de `next/image`
- Implementar blur placeholders (blurhash)
- Lazy loading para imágenes below-fold
- Formatos modernos (AVIF/WebP) con fallbacks

**Ubicaciones Críticas**:

- Hero carousel (ya usa next/image ✅)
- Product cards (verificar)
- Staff photos (verificar)

**Estimado**: 3 horas

#### C. Prefetching y Route Optimization

```typescript
// Prefetch estratégico solo para rutas frecuentes
const frequentRoutes = ["/products", "/services", "/cart"];

// En layout o component
useEffect(() => {
  if (!isMobile && isIdle) {
    frequentRoutes.forEach((route) => {
      router.prefetch(`/t/${tenant}${route}`);
    });
  }
}, []);
```

**Estimado**: 1.5 horas

#### D. Virtual Scrolling en Listas Largas

**Ya Implementado**: ✅ VirtualList component

**Pendiente de Aplicar en**:

- Tabla de movimientos financieros (si >50 filas)
- Lista de posts sociales (si >30 posts)
- Catálogo de productos (si >100 productos)

**Estimado**: 2 horas

---

### 6. **Mejoras de Infraestructura de Testing**

#### Estado Actual

❌ **Tests Fallando**: Infraestructura no configurada

- No hay mocks de DB
- No hay mocks de Redis
- Tests E2E generan artifacts no gitignored (✅ arreglado)

#### Tareas Necesarias

**A. Configurar Test Database**

```typescript
// tests/setup/db.ts
import { drizzle } from "drizzle-orm/postgres-js";

export async function setupTestDb() {
  const testDb = await createTestDatabase();
  await runMigrations(testDb);
  return testDb;
}

export async function teardownTestDb(db) {
  await db.execute("DROP SCHEMA public CASCADE");
  await db.close();
}
```

**B. Mock de Redis**

```typescript
// tests/mocks/redis.ts
export class MockRedis {
  private store = new Map();

  async get(key: string) {
    return this.store.get(key);
  }
  async set(key: string, value: any, opts?: any) {
    this.store.set(key, value);
  }
  // ...
}
```

**C. Aumentar Cobertura de Tests**
**Target Coverage**:

- Critical paths: >80%
- Business logic: >70%
- UI components: >60%

**Prioridad de Testing**:

1. RLS policies (security critical)
2. Booking logic (business critical)
3. Cart operations (conversion critical)
4. Payment processing (financial critical)

**Estimado**: 12-16 horas

---

### 7. **Code Quality y Mantenibilidad**

#### A. Agregar displayName a Componentes Memoizados

```typescript
// ✅ Ya hecho en algunos:
ProductCard.displayName = "ProductCard";
ServiceCard.displayName = "ServiceCard";

// ❌ Falta en:
VirtualList.displayName = "VirtualList";
// + revisar otros componentes memo
```

**Estimado**: 30 minutos

#### B. Revisar Dependencias No Utilizadas

```bash
npx depcheck
```

**Acción**: Remover dependencias sin uso para reducir bundle size

**Estimado**: 1 hora

#### C. Actualizar Dependencias con Vulnerabilidades

```bash
npm audit --audit-level=high
npm audit fix
```

**Importante**: Revisar breaking changes antes de actualizar

**Estimado**: 2-3 horas (testing incluido)

---

## 🟢 MEJORAS OPCIONALES / FUTURAS

### 8. **Mejoras de UX/UI**

#### A. Implementar Optimistic Updates

```typescript
// En cart operations
const { mutate } = useMutation({
  mutationFn: addToCart,
  onMutate: async (newItem) => {
    // Optimistic update
    await queryClient.cancelQueries(["cart"]);
    const previous = queryClient.getQueryData(["cart"]);
    queryClient.setQueryData(["cart"], (old) => [...old, newItem]);
    return { previous };
  },
  onError: (err, newItem, context) => {
    // Rollback
    queryClient.setQueryData(["cart"], context.previous);
  },
});
```

#### B. Skeleton Loaders Consistentes

- Crear biblioteca de skeletons reutilizables
- ProductCardSkeleton
- ServiceCardSkeleton
- TableSkeleton
- FormSkeleton

#### C. Animaciones y Transitions

- Usar framer-motion de forma eficiente (ya instalado)
- Implementar page transitions suaves
- Micro-interactions en botones (hover, click)

### 9. **Monitoreo y Observabilidad**

#### A. Implementar Error Tracking

```typescript
// lib/monitoring/error-tracker.ts
export function captureError(error: Error, context?: Record<string, any>) {
  // Log to service (Sentry, LogRocket, etc.)
  console.error("[Error]", error, context);

  // Track user impact
  // Send to analytics
}
```

#### B. Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export function trackPageLoad(route: string) {
  const navigation = performance.getEntriesByType("navigation")[0];
  // Send metrics to analytics
}
```

#### C. User Analytics

- Track critical user flows
- Funnel analysis (PLP → Cart → Checkout)
- Heatmaps en páginas clave
- Session recordings (optional, privacy-aware)

---

## 📊 RESUMEN DE ESTIMADOS

### Por Prioridad

**🔴 Crítico (Bloqueante)**:

- Errores de Build: 20 minutos

**🔴 Alta Prioridad**:

- Performance en Navegación: 6-12 horas
- Eliminación de `any`: 8 horas
- Migración de Formularios: 3.5 horas
  **Subtotal Alta**: 17.5-23.5 horas

**🟡 Media Prioridad**:

- Performance Adicional: 8.5 horas
- Infraestructura de Testing: 12-16 horas
- Code Quality: 3.5 horas
  **Subtotal Media**: 24-28 horas

**🟢 Baja/Opcional**:

- UX/UI Mejoras: 8-12 horas
- Monitoreo: 4-6 horas
  **Subtotal Opcional**: 12-18 horas

### Total General

**Mínimo Viable**: 18 horas (solo crítico + alta prioridad)
**Completo sin opcionales**: 42-51 horas
**Completo con todo**: 54-69 horas

---

## 🎯 ROADMAP SUGERIDO

### Sprint 1 (Semana 1): Estabilización

- ✅ Arreglar errores de build (BLOQUEANTE)
- 🔄 Investigar y optimizar performance de navegación
- 🔄 Eliminar tipos `any` en páginas críticas

### Sprint 2 (Semana 2): Optimización

- Implementar lazy loading y code splitting
- Migrar formularios a componentes reutilizables
- Optimizar imágenes y assets

### Sprint 3 (Semana 3): Testing y Calidad

- Configurar infraestructura de testing
- Aumentar cobertura de tests críticos
- Code quality improvements

### Sprint 4 (Semana 4): Polish y Monitoreo

- UX improvements (skeletons, animations)
- Implementar monitoring y error tracking
- Documentación y cleanup

---

## 📝 NOTAS IMPORTANTES

### Principios del Proyecto (del README/ARCHITECTURE)

1. **UX 10/10**: Click budgets estrictos
   - Purchase ≤3 clicks
   - Booking ≤2 clicks
   - Reorder ≤1 click

2. **Cost Optimization**: ≤$5/month target
   - Scale-to-zero architecture
   - Budget guardrails (50%, 80%, 90%, 100%)

3. **Multitenant Isolation**: Row-Level Security
   - Tenant resolution: Header → Subdomain → Path → Fallback
   - RLS policies en todas las tablas

4. **Performance Targets**:
   - LCP <2.5s (P75)
   - INP <200ms (P75)
   - CLS <0.1
   - Bundle size <250KB gzipped

5. **Accesibilidad**: WCAG 2.1 AA
   - Lighthouse score ≥95
   - Keyboard navigation
   - Screen reader support

### Tech Stack Clave

- **Frontend**: Next.js 14 (App Router + RSC)
- **Backend**: Next.js API routes + CQRS
- **Database**: PostgreSQL 15 + RLS (Neon)
- **Cache**: Upstash Redis
- **Deployment**: Cloudflare Pages + Cloud Run
- **Monorepo**: Turbo + npm workspaces

---

**Última Actualización**: 2025-11-07
**Próxima Revisión**: Después de Sprint 1

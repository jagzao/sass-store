# Plan de Consolidación de State Management

## Problema Actual

La aplicación usa **dos librerías diferentes** de state management:

### 1. Jotai (`apps/web/lib/store/atoms.ts`)
- Tenant state
- **Cart items** (duplicado)
- UI state (sidebar, theme, notifications)
- Forms (login, contact)
- Analytics
- SEO metadata

### 2. Zustand (`apps/web/lib/cart/cart-store.ts`)
- **Cart management completo** (duplicado)
- Funciones avanzadas de carrito
- Persistencia con zustand/middleware

## Problemas Identificados

### 1. **Duplicación Crítica del Cart State**
```typescript
// En Jotai (atoms.ts)
export const cartItemsAtom = atomWithStorage<CartItem[]>("sass-store-cart", []);

// En Zustand (cart-store.ts)
items: CartItem[];
```

**Riesgo:** Dos fuentes de verdad → Posible desincronización

### 2. **Bundle Size Incrementado**
- Jotai: ~3.5KB gzipped
- Zustand: ~1.2KB gzipped
- **Total:** ~4.7KB solo para state management

### 3. **Complejidad de Mantenimiento**
- Desarrolladores deben conocer 2 APIs diferentes
- Mayor superficie de bugs
- Duplicación de lógica

## Opción Recomendada: Consolidar en Zustand

### ¿Por qué Zustand?

✅ **Más ligero:** 1.2KB vs 3.5KB
✅ **Mejor TypeScript:** Inferencia automática
✅ **Más simple:** API más directa
✅ **Mejor devtools:** Redux DevTools integration
✅ **Persistencia built-in:** zustand/middleware
✅ **Ya implementado:** Cart store es robusto

### Plan de Migración (3 fases)

#### **Fase 1: Migrar UI State a Zustand** (2-3 horas)

```typescript
// apps/web/lib/stores/ui-store.ts
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  searchQuery: string;
  currentPage: string;
  theme: 'light' | 'dark' | 'auto';

  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  resetSearch: () => void;
}

export const useUI = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      searchQuery: '',
      currentPage: 'home',
      theme: 'auto',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setPage: (page) => set({ currentPage: page }),
      setTheme: (theme) => set({ theme }),
      resetSearch: () => set({ searchQuery: '' }),
    }),
    { name: 'ui-store' }
  )
);
```

**Archivos a actualizar:**
- Componentes que usan `sidebarOpenAtom`
- Componentes que usan `searchQueryAtom`
- Componentes que usan `themeAtom`

#### **Fase 2: Migrar Tenant State a Zustand** (1-2 horas)

```typescript
// apps/web/lib/stores/tenant-store.ts
import { create } from 'zustand';

interface TenantStore {
  currentTenant: TenantData | null;
  slug: string | null;
  isLoading: boolean;

  setTenant: (tenant: TenantData) => void;
  setSlug: (slug: string) => void;
  setLoading: (loading: boolean) => void;

  // Computed
  getBranding: () => TenantData['branding'] | undefined;
  getHeroConfig: () => TenantData['branding']['heroConfig'] | undefined;
}

export const useTenant = create<TenantStore>()((set, get) => ({
  currentTenant: null,
  slug: null,
  isLoading: false,

  setTenant: (tenant) => set({ currentTenant: tenant }),
  setSlug: (slug) => set({ slug }),
  setLoading: (loading) => set({ isLoading: loading }),

  getBranding: () => get().currentTenant?.branding,
  getHeroConfig: () => get().currentTenant?.branding?.heroConfig,
}));
```

**Archivos a actualizar:**
- `apps/web/lib/tenant/tenant-provider.tsx`
- Componentes que usan `currentTenantAtom`
- Componentes que usan `tenantBrandingAtom`

#### **Fase 3: Eliminar Cart Duplicado en Jotai** (30 min)

```typescript
// Eliminar de apps/web/lib/store/atoms.ts:
- cartItemsAtom
- cartTotalAtom
- cartCountAtom
```

**Archivos a actualizar:**
- Verificar que todos usen `useCart` de Zustand
- Eliminar imports de Jotai en componentes de cart

### Estructura Final Propuesta

```
apps/web/lib/stores/
├── cart-store.ts       (✅ Ya existe - Zustand)
├── ui-store.ts         (✨ Nuevo - Migrar de Jotai)
├── tenant-store.ts     (✨ Nuevo - Migrar de Jotai)
├── notifications-store.ts (✨ Nuevo - Migrar de Jotai)
└── analytics-store.ts  (✨ Nuevo - Migrar de Jotai)
```

### Beneficios Post-Consolidación

1. **-2.3KB bundle size** (eliminar Jotai)
2. **Una sola API** para aprender
3. **Sin duplicación** de cart state
4. **Mejor DX** con Redux DevTools
5. **Código más mantenible**

### Testing Durante Migración

```typescript
// Test que cart sigue funcionando
describe('Cart Store Migration', () => {
  it('should maintain cart functionality', () => {
    const { addItem, items } = useCart.getState();

    addItem({ sku: 'TEST', name: 'Test', price: 100 });

    expect(items).toHaveLength(1);
    expect(items[0].sku).toBe('TEST');
  });
});
```

### Rollback Plan

Si algo falla durante la migración:

1. **Git revert** al commit anterior
2. Feature flags para habilitar/deshabilitar nueva implementación
3. Mantener Jotai como fallback temporal

## Alternativa: Mantener Ambos (No Recomendado)

Si decides mantener ambos:

1. **Documentar claramente** cuándo usar cada uno
2. **Eliminar cart de Jotai** (eliminar duplicación)
3. **Usar Jotai solo para:** Forms simples, UI efímero
4. **Usar Zustand para:** Cart, Tenant, Estado persistente

## Próximos Pasos

1. ✅ Revisar este plan
2. ⏸️ Decidir: ¿Consolidar o mantener ambos?
3. ⏸️ Si consolidar: Implementar Fase 1
4. ⏸️ Testing exhaustivo
5. ⏸️ Fase 2 y 3
6. ⏸️ Eliminar dependencia de Jotai

## Estimación de Tiempo

- **Fase 1 (UI):** 2-3 horas
- **Fase 2 (Tenant):** 1-2 horas
- **Fase 3 (Cleanup):** 30 min
- **Testing:** 1 hora
- **Total:** ~5-7 horas

¿Deseas proceder con la consolidación?

# Guía de Migración: Jotai → Zustand

Esta guía muestra cómo migrar de Jotai a los nuevos stores de Zustand.

## ✅ Fase 1 y 2 Completadas

Hemos creado todos los stores necesarios en Zustand. Ahora necesitas actualizar los componentes.

## 📦 Nuevos Stores Disponibles

```typescript
import {
  // Cart (ya existía)
  useCart,

  // UI Store
  useUI,

  // Notifications
  useNotifications,
  notify,

  // Analytics
  useAnalytics,

  // Tenant
  useTenantStore,
} from '@/lib/stores';
```

## 🔄 Patrones de Migración

### 1. UI State (Sidebar, Theme, Search)

#### ❌ ANTES (Jotai)
```typescript
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { sidebarOpenAtom, themeAtom, searchQueryAtom } from '@/lib/store/atoms';

function MyComponent() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const theme = useAtomValue(themeAtom);
  const setSearchQuery = useSetAtom(searchQueryAtom);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div>
      <button onClick={toggleSidebar}>Toggle</button>
      <input onChange={(e) => setSearchQuery(e.target.value)} />
      <p>Theme: {theme}</p>
    </div>
  );
}
```

#### ✅ DESPUÉS (Zustand)
```typescript
import { useUI } from '@/lib/stores';

function MyComponent() {
  const { sidebarOpen, toggleSidebar, setSearchQuery, theme } = useUI();

  return (
    <div>
      <button onClick={toggleSidebar}>Toggle</button>
      <input onChange={(e) => setSearchQuery(e.target.value)} />
      <p>Theme: {theme}</p>
    </div>
  );
}
```

**Optimización extra con selectores:**
```typescript
import { useUI, selectSidebarOpen } from '@/lib/stores';

function MyComponent() {
  // Solo re-render si sidebarOpen cambia
  const sidebarOpen = useUI(selectSidebarOpen);
  const toggleSidebar = useUI((state) => state.toggleSidebar);

  return <button onClick={toggleSidebar}>Toggle</button>;
}
```

---

### 2. Notifications

#### ❌ ANTES (Jotai)
```typescript
import { useAtom } from 'jotai';
import { notificationsAtom, addNotificationAtom } from '@/lib/store/atoms';

function MyComponent() {
  const [notifications] = useAtom(notificationsAtom);
  const [, addNotification] = useAtom(addNotificationAtom);

  const showSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Success',
      message: 'Action completed',
    });
  };

  return (
    <div>
      {notifications.map((n) => (
        <div key={n.id}>{n.message}</div>
      ))}
      <button onClick={showSuccess}>Success</button>
    </div>
  );
}
```

#### ✅ DESPUÉS (Zustand)
```typescript
import { useNotifications, notify } from '@/lib/stores';

function MyComponent() {
  const notifications = useNotifications((state) => state.notifications);

  const showSuccess = () => {
    notify.success('Success', 'Action completed');
  };

  return (
    <div>
      {notifications.map((n) => (
        <div key={n.id}>{n.message}</div>
      ))}
      <button onClick={showSuccess}>Success</button>
    </div>
  );
}
```

**Aún mejor - método directo:**
```typescript
import { notify } from '@/lib/stores';

function MyComponent() {
  const handleClick = () => {
    // Se puede llamar directamente sin hook!
    notify.success('Success', 'Action completed');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

---

### 3. Tenant State

#### ❌ ANTES (Jotai)
```typescript
import { useAtomValue } from 'jotai';
import { currentTenantAtom, tenantBrandingAtom } from '@/lib/store/atoms';

function MyComponent() {
  const tenant = useAtomValue(currentTenantAtom);
  const branding = useAtomValue(tenantBrandingAtom);

  if (!tenant) return <div>Loading...</div>;

  return (
    <div style={{ color: branding?.primaryColor }}>
      {tenant.name}
    </div>
  );
}
```

#### ✅ DESPUÉS (Zustand)
```typescript
import { useTenantStore, selectTenant, selectBranding } from '@/lib/stores';

function MyComponent() {
  const tenant = useTenantStore(selectTenant);
  const branding = useTenantStore(selectBranding);

  if (!tenant) return <div>Loading...</div>;

  return (
    <div style={{ color: branding?.primaryColor }}>
      {tenant.name}
    </div>
  );
}
```

**Con destructuring:**
```typescript
import { useTenantStore } from '@/lib/stores';

function MyComponent() {
  const { currentTenant, getBranding, getPrimaryColor } = useTenantStore();

  if (!currentTenant) return <div>Loading...</div>;

  return (
    <div style={{ color: getPrimaryColor() }}>
      {currentTenant.name}
    </div>
  );
}
```

---

### 4. Cart State

#### ℹ️ Cart ya está en Zustand, pero eliminar duplicado en Jotai

**Eliminar de `apps/web/lib/store/atoms.ts`:**
```typescript
// ❌ ELIMINAR ESTAS LÍNEAS:
export const cartItemsAtom = atomWithStorage<CartItem[]>("sass-store-cart", []);
export const cartTotalAtom = atom((get) => { ... });
export const cartCountAtom = atom((get) => { ... });
```

**Asegurarse de usar:**
```typescript
import { useCart } from '@/lib/stores';

function MyComponent() {
  const { items, addItem, getTotalItems } = useCart();

  return (
    <div>
      <p>Cart items: {getTotalItems()}</p>
      <button onClick={() => addItem({ sku: 'TEST', name: 'Test', price: 100 })}>
        Add
      </button>
    </div>
  );
}
```

---

## 🔍 Encontrar Componentes que Usar Jotai

```bash
# Buscar todos los archivos que usan Jotai
grep -r "useAtom\|useAtomValue\|useSetAtom" apps/web/components --include="*.tsx"

# Buscar imports de atoms
grep -r "from '@/lib/store/atoms'" apps/web --include="*.tsx"
```

## 📋 Checklist de Migración

### Paso 1: Actualizar Imports

- [ ] Buscar `import { useAtom } from 'jotai'`
- [ ] Reemplazar con `import { useUI } from '@/lib/stores'` (o el store que corresponda)

### Paso 2: Actualizar Uso de Hooks

- [ ] `useAtom(sidebarOpenAtom)` → `useUI((state) => ({ sidebarOpen: state.sidebarOpen, toggleSidebar: state.toggleSidebar }))`
- [ ] `useAtomValue(themeAtom)` → `useUI((state) => state.theme)`
- [ ] `useSetAtom(searchQueryAtom)` → `useUI((state) => state.setSearchQuery)`

### Paso 3: Optimizar con Selectores

```typescript
// Bueno
const theme = useUI((state) => state.theme);

// Mejor (si se usa en múltiples lugares)
import { selectTheme } from '@/lib/stores';
const theme = useUI(selectTheme);
```

### Paso 4: Eliminar Atoms No Usados

Una vez migrados todos los componentes:

- [ ] Eliminar `apps/web/lib/store/atoms.ts`
- [ ] Desinstalar Jotai: `npm uninstall jotai`
- [ ] Actualizar imports en `package.json`

---

## 🎯 Componentes Prioritarios para Migrar

### Alta Prioridad (afectan performance)
1. `apps/web/components/navigation/top-nav.tsx` - Usa searchQueryAtom
2. `apps/web/components/admin/admin-sidebar.tsx` - Usa sidebarOpenAtom
3. Layout components que usan `themeAtom`

### Media Prioridad
1. Componentes que usan `notificationsAtom`
2. Componentes que usan `currentTenantAtom`

### Baja Prioridad
1. Forms que usan `loginFormAtom`, `contactFormAtom`
2. Performance monitoring components

---

## 🧪 Testing Durante Migración

```typescript
// Antes de migrar un componente
describe('MyComponent with Jotai', () => {
  it('works with Jotai', () => {
    // Test existente
  });
});

// Después de migrar
describe('MyComponent with Zustand', () => {
  it('works with Zustand', () => {
    render(<MyComponent />);
    // Mismo comportamiento, nueva implementación
  });
});
```

---

## 🚨 Troubleshooting

### Error: "Cannot read property 'toggle' of undefined"

**Causa:** Accediendo a una función que no existe en el estado

**Solución:**
```typescript
// ❌ Incorrecto
const toggle = useUI((state) => state.toggle); // No existe

// ✅ Correcto
const toggleSidebar = useUI((state) => state.toggleSidebar);
```

### Error: "Too many re-renders"

**Causa:** No estás usando selectores, el componente se re-renderiza con cada cambio

**Solución:**
```typescript
// ❌ Causa re-renders
const state = useUI(); // Todo el estado

// ✅ Solo lo que necesitas
const sidebarOpen = useUI((state) => state.sidebarOpen);
```

### Los cambios no persisten

**Causa:** El store no tiene middleware `persist`

**Solución:** Verificar que el store use `persist()`:
```typescript
// En ui-store.ts
export const useUI = create<UIStore>()(
  persist(
    (set) => ({ ... }),
    { name: 'sass-store-ui' }
  )
);
```

---

## 📊 Comparación de Performance

### Antes (Jotai + Zustand)
- Bundle size: ~4.7KB (Jotai 3.5KB + Zustand 1.2KB)
- 2 APIs diferentes
- Cart duplicado en 2 stores

### Después (Solo Zustand)
- Bundle size: ~1.2KB
- 1 API consistente
- Cart en un solo lugar
- Mejor DevTools

---

## ✨ Beneficios Inmediatos

1. **-3.5KB bundle size** (eliminar Jotai)
2. **Mejor DX** con una sola API
3. **Redux DevTools** para debugging
4. **Type safety mejorado** con inferencia automática
5. **Menos bugs** por duplicación de estado

---

## 🎓 Recursos Adicionales

- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Zustand Best Practices](https://github.com/pmndrs/zustand#best-practices)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

---

## ❓ FAQ

**Q: ¿Puedo migrar gradualmente?**
A: Sí, los stores de Zustand pueden coexistir con Jotai temporalmente.

**Q: ¿Qué pasa con los datos en localStorage?**
A: Zustand usa un key diferente (`sass-store-ui` vs `jotai-*`). Los datos anteriores se mantendrán pero no se usarán.

**Q: ¿Debo migrar todos los componentes a la vez?**
A: No, migra por prioridad. Comienza con los componentes de alta prioridad.

**Q: ¿Pierdo funcionalidad?**
A: No, toda la funcionalidad de Jotai está replicada en Zustand, con mejor API.

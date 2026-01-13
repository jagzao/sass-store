# Plan de Migración: Reemplazar Dropdowns por Dropdowns Searcheables

## 📋 Resumen Ejecutivo

Este plan detalla la migración completa de todos los dropdowns estáticos del proyecto a dropdowns con búsqueda (searchable dropdowns), utilizando **react-select** como solución base por su robustez, soporte completo para multi-select, búsqueda asíncrona, y excelente accesibilidad.

## 🎯 Objetivos

1. Mejorar la UX permitiendo búsqueda rápida en todos los selectores
2. Soportar multi-select con búsqueda
3. Implementar búsqueda asíncrona desde API
4. Mantener accesibilidad completa (teclado + screen readers)
5. Estandarizar todos los dropdowns del proyecto

## 📊 Estado Actual

### Tipos de Dropdowns Encontrados

| Tipo                  | Ubicación                                     | Cantidad       | Uso                      |
| --------------------- | --------------------------------------------- | -------------- | ------------------------ |
| **FormSelect**        | `apps/web/components/ui/forms/FormSelect.tsx` | 1 componente   | Formularios genéricos    |
| **Radix UI Select**   | `apps/web/components/auth/RoleManagement.tsx` | 1 instancia    | Gestión de roles         |
| **Native `<select>`** | Múltiples archivos                            | 27+ instancias | Filtros, configs, vistas |

### Componentes con Dropdowns Nativos

```
apps/web/components/
├── navigation/top-nav.tsx (selector categorías)
├── finance/FilterPanel.tsx (3 selects: tipo, estado, método pago)
├── customers/
│   ├── CustomersFilters.tsx (1 select: estado)
│   ├── CustomerForm.tsx (1 select: estado)
│   └── AddEditVisitModal.tsx (2 FormSelects: estado, servicio)
├── social/
│   ├── SocialCalendar.tsx (1 select: plataforma)
│   └── views/
│       ├── CalendarView.tsx (3 selects: filtros)
│       └── QueueView.tsx (2 selects: status, plataforma)
├── social-planner/
│   ├── posts-list.tsx (1 select: status)
│   └── schedule-timeline.tsx (3 selects: platform, status, sort)
└── ... (más en páginas de configuración y reportes)
```

## 🏗️ Arquitectura de la Solución

### Tecnología Seleccionada: **react-select**

#### Justificación

| Característica  | react-select | Radix UI     | Headless UI | Custom      |
| --------------- | ------------ | ------------ | ----------- | ----------- |
| Multi-select    | ✅ Nativo    | ⚠️ Complejo  | ⚠️ Manual   | ⚠️ Complejo |
| Async search    | ✅ Nativo    | ❌ Manual    | ❌ Manual   | ❌ Complejo |
| Accesibilidad   | ✅ WCAG 2.1  | ✅ Excelente | ✅ Buena    | ⚠️ Manual   |
| Virtualización  | ✅ Incluida  | ❌ Manual    | ❌ Manual   | ❌ Complejo |
| Tamaño bundle   | ~28KB gzip   | ~15KB gzip   | ~5KB gzip   | Variable    |
| Mantenimiento   | ✅ Activo    | ✅ Activo    | ✅ Activo   | ⚠️ Interno  |
| Docs/Ejemplos   | ✅ Extensas  | ✅ Buenas    | ✅ Buenas   | ❌ Nulas    |
| **Score Total** | **95/100**   | 70/100       | 65/100      | 40/100      |

**Veredicto:** react-select es la mejor opción para los requisitos específicos (multi-select, async, alta UX).

### Estructura de Componentes

```
apps/web/components/ui/forms/
├── SearchableSelect.tsx          # Componente base configurable
├── SearchableSelectSingle.tsx    # Wrapper para single-select simple
├── SearchableSelectMulti.tsx     # Wrapper para multi-select
├── AsyncSearchableSelect.tsx     # Wrapper para búsqueda async API
├── FormSelect.tsx (DEPRECATED)   # Mantener por retrocompatibilidad
└── index.ts                      # Exports centralizados
```

## 📝 Plan de Implementación Detallado

### Fase 1: Setup y Componentes Base (Prioridad: Alta)

#### 1.1 Instalación de Dependencias

```bash
npm install --save react-select
npm install --save-dev @types/react-select
```

**Ubicación:** Raíz del proyecto  
**Tiempo estimado:** 5 minutos

#### 1.2 Crear Componente Base `SearchableSelect.tsx`

**Ubicación:** `apps/web/components/ui/forms/SearchableSelect.tsx`

**Características:**

- Props compatibles con FormSelect existente
- Soporte para single/multi select
- Búsqueda integrada
- Estilos consistentes con Tailwind
- Accesibilidad (ARIA labels, keyboard navigation)
- Manejo de errores y validación

**Props Interface:**

```typescript
interface SearchableSelectProps<T = any> {
  // Core
  options: SelectOption[];
  value?: T;
  onChange: (value: T) => void;

  // Configuración
  isMulti?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;

  // Async
  loadOptions?: (inputValue: string) => Promise<SelectOption[]>;

  // UI
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;

  // Styling
  containerClassName?: string;
  className?: string;
}
```

**Estilos Tailwind Customizados:**

```typescript
const customStyles = {
  control: (base) => ({
    ...base,
    borderColor: error ? "rgb(239 68 68)" : "rgb(209 213 219)",
    "&:hover": { borderColor: "rgb(156 163 175)" },
    "&:focus-within": {
      borderColor: "rgb(59 130 246)",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  }),
  // ... más estilos
};
```

#### 1.3 Crear Wrapper `SearchableSelectSingle.tsx`

**Ubicación:** `apps/web/components/ui/forms/SearchableSelectSingle.tsx`

Simplifica el uso para casos single-select comunes:

```typescript
export function SearchableSelectSingle<T = string>(props: SingleSelectProps<T>) {
  return <SearchableSelect {...props} isMulti={false} />
}
```

#### 1.4 Crear Wrapper `SearchableSelectMulti.tsx`

**Ubicación:** `apps/web/components/ui/forms/SearchableSelectMulti.tsx`

Para multi-select con valores array:

```typescript
export function SearchableSelectMulti<T = string[]>(props: MultiSelectProps<T>) {
  return <SearchableSelect {...props} isMulti={true} />
}
```

#### 1.5 Crear `AsyncSearchableSelect.tsx`

**Ubicación:** `apps/web/components/ui/forms/AsyncSearchableSelect.tsx`

Para búsquedas desde API:

```typescript
export function AsyncSearchableSelect(props: AsyncSelectProps) {
  const loadOptions = async (inputValue: string) => {
    const response = await fetch(`${props.apiEndpoint}?q=${inputValue}`);
    const data = await response.json();
    return data.map(item => ({
      value: item.id,
      label: item.name
    }));
  };

  return <SearchableSelect {...props} loadOptions={loadOptions} />
}
```

### Fase 2: Migración de FormSelect (Prioridad: Alta)

#### 2.1 Actualizar `FormSelect.tsx`

**Estrategia:** Mantener API actual pero usar SearchableSelect internamente

```typescript
// apps/web/components/ui/forms/FormSelect.tsx
import { SearchableSelectSingle } from './SearchableSelectSingle';

const FormSelect = memo((props: FormSelectProps) => {
  // Mapear props antiguas a SearchableSelect
  return <SearchableSelectSingle {...mappedProps} />;
});
```

**Beneficio:** No rompe código existente, migración transparente.

#### 2.2 Actualizar Exports

```typescript
// apps/web/components/ui/forms/index.ts
export { default as FormSelect } from "./FormSelect";
export { SearchableSelect } from "./SearchableSelect";
export { SearchableSelectSingle } from "./SearchableSelectSingle";
export { SearchableSelectMulti } from "./SearchableSelectMulti";
export { AsyncSearchableSelect } from "./AsyncSearchableSelect";
```

### Fase 3: Migración Componente por Componente (Prioridad: Media-Alta)

#### 3.1 Filtros y Navegación

**Archivos a actualizar:**

1. **`navigation/top-nav.tsx`** - Selector de categorías
   - Antes: `<select>` nativo
   - Después: `<SearchableSelectSingle>`
   - Beneficio: Búsqueda rápida de categorías

2. **`finance/FilterPanel.tsx`** - 3 dropdowns
   - Antes: 3 `<select>` nativos
   - Después: 3 `<SearchableSelectSingle>`
   - Beneficio: Filtrado rápido en reportes financieros

3. **`customers/CustomersFilters.tsx`** - Filtro de estado
   - Antes: `<select>` nativo
   - Después: `<SearchableSelectSingle>`

**Ejemplo de migración:**

```typescript
// Antes
<select value={status} onChange={(e) => setStatus(e.target.value)}>
  <option value="all">Todos</option>
  <option value="active">Activos</option>
</select>

// Después
<SearchableSelectSingle
  value={status}
  onChange={setStatus}
  options={[
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' }
  ]}
/>
```

#### 3.2 Formularios

**Archivos:**

- `customers/CustomerForm.tsx`
- `customers/AddEditVisitModal.tsx`

**Ya usan FormSelect** → Migración automática al actualizar FormSelect internamente.

#### 3.3 Vistas Sociales (Multi-select)

**Archivos:**

- `social/views/CalendarView.tsx` (3 filtros)
- `social/views/QueueView.tsx` (2 filtros)
- `social/views/LibraryView.tsx` (filtros de plataformas)
- `social-planner/schedule-timeline.tsx` (3 filtros)

**Usar:** `SearchableSelectMulti` para filtros de plataformas múltiples.

```typescript
<SearchableSelectMulti
  value={selectedPlatforms}
  onChange={setSelectedPlatforms}
  options={platformOptions}
  placeholder="Seleccionar plataformas..."
/>
```

#### 3.4 RoleManagement (Estandarización)

**Archivo:** `auth/RoleManagement.tsx`

Actualmente usa Radix UI Select. Opciones:

- **Opción A:** Mantener Radix UI (ya está implementado)
- **Opción B:** Migrar a SearchableSelect para consistencia

**Recomendación:** Opción A, salvo que se necesite búsqueda (si hay +10 roles).

### Fase 4: Páginas de Configuración y Reportes (Prioridad: Media)

**Archivos:**

- `app/t/[tenant]/config/page.tsx` (2 `<select>`)
- `app/t/[tenant]/reports/page.tsx` (1 `<select>`)
- `app/t/[tenant]/admin/calendar/page.tsx` (2 `<select>`)

**Estrategia:** Migración directa a `SearchableSelectSingle`.

### Fase 5: Testing y QA (Prioridad: Alta)

#### 5.1 Tests Unitarios

**Ubicación:** `tests/unit/components/ui/SearchableSelect.spec.tsx`

**Casos de prueba:**

```typescript
describe("SearchableSelect", () => {
  it("renders with options", () => {});
  it("filters options on search", () => {});
  it("handles single selection", () => {});
  it("handles multi selection", () => {});
  it("shows error state", () => {});
  it("is keyboard accessible", () => {});
  it("calls onChange with correct value", () => {});
});
```

#### 5.2 Tests de Accesibilidad

```typescript
describe("SearchableSelect Accessibility", () => {
  it("has proper ARIA labels", () => {});
  it("keyboard navigation works (Tab, Enter, Arrow keys)", () => {});
  it("screen reader announces changes", () => {});
  it("focus management is correct", () => {});
});
```

#### 5.3 Tests de Integración

**Ubicación:** `tests/integration/dropdown-migration.int.spec.tsx`

Validar que cada componente migrado funciona correctamente en su contexto.

#### 5.4 Tests E2E

**Ubicación:** `tests/e2e/dropdown-flows.e2e.ts`

```typescript
test("user can filter customers using searchable dropdown", async ({
  page,
}) => {
  await page.goto("/t/test-tenant/customers");
  await page.click('[data-testid="status-filter"]');
  await page.fill('[data-testid="status-filter"] input', "activ");
  await page.click("text=Activos");
  // Verificar filtrado
});
```

### Fase 6: Documentación (Prioridad: Media)

#### 6.1 Documentación Técnica

**Ubicación:** `docs/components/SearchableSelect.md`

**Contenido:**

- API reference completa
- Props y tipos TypeScript
- Ejemplos de uso
- Guías de estilo y temas
- Troubleshooting común

#### 6.2 Guía de Migración

**Ubicación:** `docs/migrations/dropdown-to-searchable.md`

**Contenido:**

- Tabla de antes/después
- Ejemplos paso a paso
- Casos especiales (async, multi-select)
- FAQ

#### 6.3 Storybook/Ejemplos

**Ubicación:** `apps/web/app/examples/dropdowns/page.tsx`

Página con todos los casos de uso demostrados:

- Single select básico
- Multi select
- Async search
- Con validación
- Diferentes estados (disabled, error, etc.)

## 📈 Métricas de Éxito

| Métrica            | Objetivo              | Medición                |
| ------------------ | --------------------- | ----------------------- |
| Dropdowns migrados | 100% (27+ instancias) | Manual + grep           |
| Accesibilidad      | WCAG 2.1 AA           | Lighthouse + axe        |
| Performance        | <100ms búsqueda       | React DevTools          |
| Bundle size        | <+30KB                | webpack-bundle-analyzer |
| Tests coverage     | >85%                  | Vitest coverage         |
| User satisfaction  | Feedback positivo     | Post-deploy survey      |

## 🚨 Riesgos y Mitigación

| Riesgo                        | Probabilidad | Impacto | Mitigación                                  |
| ----------------------------- | ------------ | ------- | ------------------------------------------- |
| Incompatibilidad props        | Media        | Alto    | Mantener FormSelect wrapper compatible      |
| Performance en listas grandes | Baja         | Medio   | react-select ya incluye virtualización      |
| Aumento bundle size           | Alta         | Bajo    | +28KB es aceptable, lazy load si es crítico |
| Regresión funcional           | Media        | Alto    | Testing extensivo + rollout gradual         |
| Curva de aprendizaje          | Baja         | Bajo    | Docs completas + ejemplos                   |

## 🗓️ Cronograma

| Fase                      | Duración      | Prioridad | Dependencias         |
| ------------------------- | ------------- | --------- | -------------------- |
| Fase 1: Setup + Base      | 1-2 días      | Alta      | -                    |
| Fase 2: Migrar FormSelect | 0.5 días      | Alta      | Fase 1               |
| Fase 3.1: Filtros/Nav     | 1 día         | Alta      | Fase 2               |
| Fase 3.2: Formularios     | 0.5 días      | Media     | Fase 2               |
| Fase 3.3: Vistas Sociales | 1-2 días      | Media     | Fase 1               |
| Fase 3.4: RoleManagement  | 0.5 días      | Baja      | Fase 1               |
| Fase 4: Config/Reportes   | 1 día         | Media     | Fase 2               |
| Fase 5: Testing           | 2-3 días      | Alta      | Todas las anteriores |
| Fase 6: Docs              | 1-2 días      | Media     | Fase 5               |
| **Total**                 | **8-12 días** |           |                      |

## 📦 Entregables

- [ ] Componente `SearchableSelect` completo y documentado
- [ ] Wrappers: Single, Multi, Async
- [ ] 27+ componentes migrados
- [ ] Suite de tests (unit + integration + e2e)
- [ ] Documentación técnica
- [ ] Guía de migración
- [ ] Página de ejemplos
- [ ] PR con bundle size analysis

## 🔄 Rollout Strategy

### Opción A: Big Bang (Recomendada para proyectos internos)

- Hacer toda la migración en un PR grande
- Release después de QA completo
- Rollback fácil si hay problemas

### Opción B: Gradual (Recomendada para producción)

1. Fase 1-2: Componentes base (sin impacto visual)
2. Feature flag para habilitar nuevos dropdowns
3. Migrar componentes por prioridad
4. 100% rollout después de 2 semanas de monitoreo

## 📚 Referencias

- [react-select docs](https://react-select.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS + react-select integration](https://github.com/JedWatson/react-select/issues/3852)

## ✅ Checklist de Aprobación

Antes de comenzar la implementación, confirmar:

- [ ] Plan revisado y aprobado por el equipo
- [ ] Presupuesto de bundle size (+30KB) aceptado
- [ ] Timeline (8-12 días) aprobado
- [ ] Stakeholders informados del rollout
- [ ] Ambiente de staging preparado para testing
- [ ] Plan de rollback definido

---

**Creado:** 2026-01-12  
**Última actualización:** 2026-01-12  
**Estado:** Pendiente de aprobación  
**Owner:** Architect Mode

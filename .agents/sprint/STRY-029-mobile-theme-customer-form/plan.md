# Plan — STRY-029: Correcciones UI mobile, formulario de clientes y tema oscuro/claro

## Asunciones / defaults

- Alcance reducido a componentes reportados; no migración global a dark mode.
- `zo-system` default oscuro; resto `system`.
- Toggle light/dark simple; modo `system` como fallback al iniciar sin preferencia guardada (salvo `zo-system`).
- Se reutiliza `lib/theme/theme-provider.tsx` y `theme-system.ts`.

## Pasos numerados

### 1. ThemeProvider global

- Integrar `ThemeProvider` en `apps/web/app/providers.tsx`.
- Leer preferencia de `localStorage` en cliente.
- Para `zo-system`, pasar `defaultMode="dark"` al provider (detectar tenant en layout o header).

### 2. ThemeToggle

- Crear `apps/web/components/theme/ThemeToggle.tsx`.
- Usar `useTheme` de `lib/theme/theme-provider.tsx`.
- Iconos `Sun`/`Moon` de `lucide-react`; `data-testid="theme-toggle"`.
- Renderizar en `TenantHeader` a la izquierda del `UserMenu`.

### 3. UserMenu theme-aware

- `DropdownPanel`: usar variables CSS `--color-background`, `--color-foreground`, `--color-border`.
- Forzar `backgroundColor` inline para evitar clases externas.
- Hover/activo con `--color-muted` y `--color-primary`.

### 4. PWA install mobile

- `InstallAppButton`: agregar prop `variant` (`"floating"` default, `"hidden-on-mobile"`) o clase `hidden md:flex`.
- Exportar componente icono `InstallAppHeaderIcon` en `InstallAppButton.tsx`.
- `TenantHeader`: renderizar icono a la izquierda del avatar solo en mobile (`md:hidden` para avatar group? mostrar en todos, icono siempre visible si puede instalar).

### 5. CustomerForm theme-aware

- Reemplazar `bg-white`, `text-gray-900`, `border-gray-300`, etc. por variables theme.
- Preservar validaciones y estructura de campos.
- Ajustar contenedor en `clientes/nueva/page.tsx` a `bg-[var(--color-background)]`.

### 6. Tests

- Unitario: `theme-system.spec.ts` verifica variables CSS y modo oscuro.
- E2E: `tests/e2e/mobile-theme-customer-form.spec.ts` con tag `@stry-029`.

## Riesgos

- Tailwind no reacciona a variables CSS en clases arbitrarias si el valor no está definido; asegurar que `applyTheme` corra antes del primer render.
- `zo-system` default oscuro requiere saber el tenant en el cliente; usar `tenant-provider` o detectar slug del pathname.

## Definition of Done

- [ ] ThemeProvider activo globalmente.
- [ ] Toggle en header, persistencia OK.
- [ ] `zo-system` oscuro por defecto.
- [ ] UserMenu mobile legible.
- [ ] Icono PWA en mobile, botón flotante oculto en mobile.
- [ ] CustomerForm legible en claro/oscuro.
- [ ] lint / typecheck / build / UT / E2E verdes.

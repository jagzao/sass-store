# Spec — Correcciones de UI mobile, formulario de clientes y sistema de tema oscuro/claro

> **Estado:** Aprobada  
> **User Story:** Pendiente — `docs/stories/active/STRY-XXX-mobile-theme-customer-form.md`  
> **Sprint:** `.agents/sprint/STRY-XXX-mobile-theme-customer-form/`  
> **Alcance tenant:** Todos los tenants  
> **Tenant piloto:** `zo-system` (tema oscuro por defecto)  
> **Creado:** 2026-07-17  
> **Diferenciador vs otros tenants:** `zo-system` debe renderizar en modo oscuro por defecto; el resto puede ser claro/oscuro según preferencia del usuario o sistema.

---

## 1. Narrativa

**Como** usuario autenticado o visitante de cualquier tenant, **quiero** que el menú de usuario en mobile tenga fondo legible, que el botón de instalación de la PWA no obstruya el menú, que el formulario de clientes muestre texto legible y que la aplicación respete un tema oscuro o claro con un switch visible, **para** poder navegar, instalar la app y capturar datos sin errores visuales.

### Contexto

Reporte de producción (capturas 2026-07-17):

- En mobile, el dropdown del menú de usuario pierde el fondo y el texto no se distingue del contenido detrás.
- El botón flotante "Instalar App" tapa opciones del menú de usuario en mobile.
- En el formulario de alta/edición de cliente (`/t/[tenant]/clientes/nueva`) el texto se muestra blanco sobre fondo blanco, haciéndolo ilegible.
- `zo-system` debería ser oscuro, pero toda la aplicación no reacciona al tema oscuro/claro.
- Falta un icono de cambio de tema en la barra superior.

El sistema ya cuenta con `lib/theme/theme-provider.tsx` y `lib/theme/theme-system.ts`, pero `ThemeProvider` no está integrado en el árbol de providers de `app/providers.tsx`, por lo que las variables CSS y el modo nunca se aplican globalmente.

---

## 2. Diferenciador multitenancy

| Aspecto          | `zo-system` (piloto oscuro) | Otros tenants (`wondernails`, `centro-tenistico`, etc.) |
| ---------------- | --------------------------- | ------------------------------------------------------ |
| Modo por defecto | `dark`                      | `system` (respeta `prefers-color-scheme`)              |
| Header           | Fondo oscuro, toggle visible | Fondo tenant, toggle visible                            |
| Formulario       | Theme-aware (colores variables) | Theme-aware (colores variables)                         |
| PWA install      | Icono junto al avatar en mobile | Icono junto al avatar en mobile                         |

**Convivencia:** No se eliminan estilos específicos de tenant; se complementan con variables CSS del theme system.

---

## 3. Criterios de aceptación (Gherkin)

### CA-1: Menú de usuario legible en mobile

```gherkin
Dado que estoy autenticado en cualquier tenant
Y abro el sitio en un viewport mobile
Cuando toco el avatar/botón de usuario
Entonces se despliega el menú con fondo opaco
Y el texto y los iconos se leen claramente
Y el fondo no es transparente ni se mezcla con la página detrás
```

### CA-2: Botón "Instalar App" no obstruye el menú en mobile

```gherkin
Dado que el navegador ofrece instalación PWA
Y estoy en un viewport mobile
Cuando abro el menú de usuario
Entonces no veo el botón flotante "Instalar App" sobre el menú
Y veo un icono de descarga a la izquierda del avatar/botón de usuario
```

### CA-3: Formulario de cliente legible en claro y oscuro

```gherkin
Dado que navego a /t/[tenant]/clientes/nueva
Cuando el tema es claro u oscuro
Entonces todos los campos, labels, placeholders y botones se leen con contraste suficiente
Y no hay texto blanco sobre fondo blanco ni negro sobre negro
```

### CA-4: `zo-system` es oscuro por defecto

```gherkin
Dado que visito /t/zo-system por primera vez
Y no tengo preferencia previa en localStorage
Cuando carga la página
Entonces el tema se aplica en modo oscuro
Y el header, fondo y texto usan la paleta oscura
```

### CA-5: Toggle de tema en la barra superior

```gherkin
Dado que estoy en cualquier tenant
Cuando miro la barra superior
Entonces veo un icono para cambiar entre tema claro y oscuro
Y al tocarlo el tema cambia inmediatamente
Y la preferencia persiste al recargar la página
```

### CA-6: Tema respeta preferencia del sistema

```gherkin
Dado que no he elegido tema manualmente
Y mi sistema operativo está en modo oscuro
Cuando visito la app
Entonces la app se muestra en modo oscuro
Y viceversa para modo claro
```

### CA-7: Desktop conserva experiencia existente

```gherkin
Dado que estoy en un viewport desktop
Cuando el navegador ofrece instalación PWA
Entonces el botón flotante "Instalar App" sigue visible
Y el menú de usuario desplegable conserva su diseño actual mejorado
```

---

## 4. Happy path — matriz resumida

| ID    | Escenario                                                            |
| ----- | -------------------------------------------------------------------- |
| HP-01 | Usuario abre menú mobile → fondo opaco, texto legible               |
| HP-02 | Usuario instala PWA desde icono del header en mobile                  |
| HP-03 | Usuario completa formulario de cliente en tema oscuro                 |
| HP-04 | Usuario alterna tema claro/oscuro desde el toggle superior            |
| HP-05 | Visita primera vez `zo-system` → carga en modo oscuro                   |
| HP-06 | Preferencia de tema se guarda y persiste en `localStorage`            |

---

## 5. Sad path — matriz resumida

| ID    | Escenario                                                | Resultado esperado                                          |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------- |
| SP-01 | Navegador no soporta instalación PWA                     | Icono de descarga oculto; sin errores de UI                 |
| SP-02 | `localStorage` bloqueado o privado                         | Fallback a `prefers-color-scheme`; sin excepción visible    |
| SP-03 | Tema guardado es inválido                                 | Se ignora y se aplica `system`                              |
| SP-04 | Usuario fuerza modo oscuro en tenant con branding claro  | Se aplica modo oscuro sobre variables CSS del tenant        |

---

## 6. Pantallas y rutas

| Pantalla                | Ruta propuesta                       | Actor       | Notas                                      |
| ----------------------- | ------------------------------------ | ----------- | ------------------------------------------ |
| Header tenant           | Componente `TenantHeader`              | Todos       | Toggle + icono PWA + avatar                |
| Menú usuario            | Componente `UserMenu`                | Autenticado | Dropdown mobile/desktop theme-aware        |
| Alta cliente            | `/t/[tenant]/clientes/nueva`         | Admin/staff | `CustomerForm` theme-aware                 |
| Edición cliente         | `/t/[tenant]/clientes/[id]/editar`   | Admin/staff | Reutiliza `CustomerForm`                   |
| Landing/home            | `/t/[tenant]`                        | Todos       | Aplicación global del theme                |

---

## 7. Modelo de datos

### 7.1 Tablas nuevas o cambios

Sin cambios en base de datos.

### 7.2 Invariantes de negocio

- Ninguna lógica de negocio se modifica.
- Los cambios son puramente de presentación y estado local.

### 7.3 Índices sugeridos

No aplica.

---

## 8. API (Result Pattern)

No se agregan ni modifican endpoints. Los cambios son del lado del cliente.

---

## 9. Notificaciones / integraciones

No aplica.

---

## 10. UI / UX

### 10.1 Header tenant (`TenantHeader`)

- Agregar `ThemeToggle` a la izquierda del `UserMenu` en mobile y desktop.
- En mobile, agregar icono de instalación PWA a la izquierda del avatar cuando `canInstall` sea verdadero.
- Mantener el botón flotante `InstallAppButton` solo en desktop; ocultarlo en viewports mobile (`md:hidden`) para evitar superposición con el menú.
- `data-testid="theme-toggle"` en el toggle.
- `data-testid="pwa-install-header"` en el icono de instalación mobile.

### 10.2 Menú usuario (`UserMenu`)

- `DropdownPanel` debe usar `bg-[var(--color-background)]`, `text-[var(--color-foreground)]`, `border-[var(--color-border)]` y `shadow-[0_16px_40px_rgba(0,0,0,0.45)]`.
- Forzar `background-color` inline para evitar que Tailwind `bg-transparent` u otra clase externa anule el fondo en mobile.
- En mobile, el panel debe ser anclado al botón trigger (`right-0 top-full`) y no fijo a pantalla completa, salvo que se decida un drawer mobile en futuro.
- Ítems del menú deben usar `hover:bg-[var(--color-muted)]` y colores de texto `var(--color-foreground)` / `var(--color-muted-foreground)`.

### 10.3 Formulario de cliente (`CustomerForm`)

- Reemplazar clases fijas `bg-white`, `text-gray-900`, `border-gray-300`, etc. por variables del theme system:
  - Contenedor: `bg-[var(--color-background)]`
  - Texto: `text-[var(--color-foreground)]`
  - Inputs: `bg-[var(--color-input)] border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)]`
  - Labels: `text-[var(--color-muted-foreground)]`
  - Botones primarios: `bg-[var(--color-primary)] text-white`
  - Badges/tags: adaptar a combinaciones legibles en ambos modos.
- Preservar íconos `lucide-react`.
- No cambiar validaciones ni campos.

### 10.4 Toggle de tema (`ThemeToggle`)

- Componente nuevo en `components/theme/ThemeToggle.tsx`.
- Usar `useTheme` de `lib/theme/theme-provider.tsx`.
- Iconos: `Sun` / `Moon` de `lucide-react`.
- Alterna entre `light`, `dark` y `system` (tooltip o menú pequeño opcional; MVP: toggle binario light/dark).
- Persistir en `localStorage` mediante `setMode` del provider.

### 10.5 Terminología

Sin cambios; reutilizar `getClientTerms(tenantSlug)`.

---

## 11. Seguridad y RLS

- No se tocan políticas RLS.
- `localStorage` solo almacena preferencia de tema (`"light"`, `"dark"`, `"system"`).
- Sin datos sensibles expuestos en cliente.

---

## 12. Futuro / fuera MVP

- Migración progresiva de todos los componentes a theme-aware (muchas pantallas aún usan clases fijas `bg-white` / `text-gray-900`).
- Drawer mobile completo para navegación principal.
- Animaciones de transición entre temas.

---

## 13. Fuera de MVP

| Item                                              | Razón                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Refactor global de todas las pantallas a dark mode | Se limita a los componentes reportados y al theme system base |
| Cambios en backend o DB                           | No es necesario para correcciones de UI            |
| Nuevo diseño del formulario de cliente            | Solo corrección de colores/legibilidad             |
| Instalación PWA nativa iOS/Safari                 | El icono mantiene el fallback existente            |

---

## 14. Testing

### Unitarios (`tests/unit/`)

- `theme-system.spec.ts`:
  - `applyTheme` setea variables CSS y atributos `data-theme` / `data-mode`.
  - `createTenantTheme` aplica color primario del tenant sobre tema base.
  - `defaultDarkTheme` tiene `mode: "dark"` y colores oscuros.

- `theme-provider.spec.ts` (si es testeable sin DOM complejo):
  - `setMode("dark")` persiste `"theme-mode"` en `localStorage`.
  - Modo `"system"` respeta `window.matchMedia('(prefers-color-scheme: dark)')`.

### E2E (`tests/e2e/`)

- Tag/grep: `mobile-theme-customer-form`
- Tenants: `zo-system`, `wondernails` (o `centro-tenistico`)
- Credencial: `jagzao@gmail.com` / `admin`
- Casos:
  - HP-01: menú usuario mobile legible.
  - HP-03: formulario cliente legible en modo oscuro.
  - HP-04: toggle cambia tema y persiste.
  - HP-05: `zo-system` carga en modo oscuro.
  - CA-2: icono PWA en header mobile, sin botón flotante.

---

## 15. Asunciones validadas

| #   | Asunción                                                                 | Estado |
| --- | ------------------------------------------------------------------------ | ------ |
| 1   | Alcance = UI/UX: header mobile, menú usuario, formulario cliente y tema oscuro/claro; sin cambios de negocio/DB/RLS | ✅ |
| 2   | Tenant afectado: todos; `zo-system` debe ser oscuro por defecto          | ✅ |
| 3   | Botón "Instalar App" en mobile pasa a icono a la izquierda del avatar; botón flotante desktop se mantiene | ✅ |
| 4   | Menú desplegable de usuario en mobile recupera fondo opaco y colores legibles en ambos temas | ✅ |
| 5   | Formulario de cliente se hace legible en claro y oscuro                   | ✅ |
| 6   | Se agrega un toggle de tema en la barra superior, visible en todos los tenants | ✅ |
| 7   | Preferencia de tema en `localStorage`; respeta `prefers-color-scheme` si no hay preferencia | ✅ |
| 8   | MVP no migra toda la app a dark-mode clase por clase; se atacan componentes afectados y se reactiva `ThemeProvider` | ✅ |

---

## 16. Referencias de código existente

| Área                       | Archivo                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| Theme system               | `apps/web/lib/theme/theme-system.ts`                                |
| Theme provider             | `apps/web/lib/theme/theme-provider.tsx`                             |
| Providers raíz             | `apps/web/app/providers.tsx`                                         |
| Header tenant              | `apps/web/components/ui/TenantHeader.tsx`                             |
| Navegación tenant          | `apps/web/components/ui/TenantNavigation.tsx`                       |
| Menú usuario               | `apps/web/components/auth/UserMenu.tsx`                               |
| Botón PWA                  | `apps/web/components/pwa/InstallAppButton.tsx`                      |
| Formulario cliente         | `apps/web/components/customers/CustomerForm.tsx`                      |
| Página alta cliente        | `apps/web/app/t/[tenant]/clientes/nueva/page.tsx`                   |
| Página lista clientes      | `apps/web/app/t/[tenant]/clientes/page.tsx`                         |
| Design tokens              | `apps/web/lib/design/tokens.ts`                                       |

---

## 17. Definition of Done

- [ ] `ThemeProvider` integrado en `app/providers.tsx` y activo globalmente.
- [ ] `ThemeToggle` renderizado en `TenantHeader` para todos los tenants.
- [ ] `zo-system` carga en modo oscuro por defecto.
- [ ] Menú usuario mobile con fondo opaco y colores legibles en ambos modos.
- [ ] Icono de instalación PWA visible junto al avatar en mobile; botón flotante oculto en mobile.
- [ ] `CustomerForm` y contenedor de `/clientes/nueva` legibles en claro y oscuro.
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` verdes.
- [ ] E2E headless grep `mobile-theme-customer-form` verde en `zo-system` y un tenant claro.
- [ ] Documentación en `.agents/sprint/STRY-XXX-mobile-theme-customer-form/` si deriva a User Story.

---

_Última actualización: 2026-07-17_

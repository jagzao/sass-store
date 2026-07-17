# STRY-029 — Correcciones UI mobile, formulario de clientes y tema oscuro/claro

## Resumen

Corregir tres problemas visuales reportados en producción: el menú de usuario en mobile pierde el fondo y no se lee; el botón flotante "Instalar App" obstruye el menú; y el formulario de alta de cliente muestra texto blanco sobre fondo blanco. Además, activar el sistema de tema oscuro/claro existente, hacer que `zo-system` sea oscuro por defecto y agregar un toggle de tema en la barra superior.

## Motivación

Las capturas de producción muestran que el dropdown de `UserMenu` no tiene fondo opaco en mobile, el botón de instalación PWA tapa opciones y el formulario de cliente es ilegible. El theme provider (`lib/theme/theme-provider.tsx`) ya existe pero no está conectado al árbol de providers, por lo que la aplicación no reacciona al modo oscuro ni hay forma de cambiarlo.

## Alcance

- `apps/web/components/auth/UserMenu.tsx` — fondo opaco y colores theme-aware en el dropdown.
- `apps/web/components/pwa/InstallAppButton.tsx` — ocultar botón flotante en mobile; exponer icono de instalación para `TenantHeader`.
- `apps/web/components/ui/TenantHeader.tsx` — agregar icono PWA mobile y `ThemeToggle`.
- `apps/web/components/customers/CustomerForm.tsx` — colores theme-aware en todos los campos.
- `apps/web/app/t/[tenant]/clientes/nueva/page.tsx` — contenedor theme-aware.
- `apps/web/app/providers.tsx` — integrar `ThemeProvider` global.
- `apps/web/lib/theme/theme-provider.tsx` — `zo-system` default `dark`.

## Fuera de alcance

- Migración global de todas las pantallas a dark mode; solo se tocan los componentes reportados y el theme system base.
- Cambios en backend, DB o RLS.
- Rediseño del formulario de cliente; solo corrección de colores.

## Criterios de Aceptación de Alto Nivel

1. Menú de usuario en mobile tiene fondo opaco y texto legible en tema claro y oscuro.
2. Botón "Instalar App" no tapa el menú en mobile; hay un icono de descarga junto al avatar.
3. Formulario de alta de cliente es legible en ambos temas.
4. `zo-system` carga en modo oscuro por defecto.
5. Hay un toggle de tema visible en la barra superior y la preferencia persiste.

## Relacionado con

- `.specs/mobile-theme-customer-form.md`
- `.agents/sprint/STRY-029-mobile-theme-customer-form/plan.md`

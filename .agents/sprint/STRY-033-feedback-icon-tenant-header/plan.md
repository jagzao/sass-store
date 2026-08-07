# STRY-033 — Ícono de feedback junto al logo del tenant

## Descripción general

Agregar un ícono/botón junto al logo del tenant (el que enlaza a home) en `TenantHeader`, visible para **todos los tenants** que usan este header compartido. Al hacer clic, abre el panel de feedback ya existente (`FeedbackWidget` + `FeedbackWidgetContext`, montado global en `app/layout.tsx` desde STRY-032), el mismo panel que hoy abre el botón flotante fijo en la esquina inferior derecha. No se construye un panel nuevo ni se elimina el botón flotante existente.

## Actores

- **Visitante/cliente del tenant**: navega `/t/[tenant]` y rutas con `TenantHeader`, ve el ícono junto al logo.
- **Usuario autenticado**: mismo flujo; si tiene email de sesión, el campo email del panel se omite (sin cambios).

## Flujo principal

1. El visitante carga una página que usa `TenantHeader`.
2. Ve, junto al logo del tenant, un ícono de feedback (visible en variantes `default`, `transparent`, `dark`, con/sin scroll).
3. Hace click en el ícono.
4. Se abre `FeedbackWidget` con categoría "Opinión" preseleccionada por defecto (`open()` sin opciones).
5. Completa y envía, o cierra el panel.
6. El botón flotante inferior derecho sigue funcionando igual, en paralelo.

## Reglas de negocio

- El ícono llama a `useFeedbackWidget().open()` sin opciones — mismos defaults que el botón flotante.
- Un solo `FeedbackWidget` global atiende ambos triggers (ícono en header + botón flotante).
- El ícono aplica a todos los tenants, sin lógica condicional por slug.
- El ícono debe mantener contraste adecuado según variante del header, igual que `ThemeToggle`/`UserMenu`.

## Criterios de aceptación

```gherkin
Feature: Ícono de feedback junto al logo del tenant

  Scenario: Ícono visible junto al logo en header default
    Given un visitante ve la página de un tenant con header en variante "default"
    Then el ícono de feedback es visible junto al logo

  Scenario: Ícono visible en header transparente sin scroll
    Given un visitante ve la página de un tenant con header en variante "transparent" y sin hacer scroll
    Then el ícono de feedback es visible y clicable junto al logo

  Scenario: Ícono visible en header oscuro
    Given un visitante ve la página de un tenant con header en variante "dark"
    Then el ícono de feedback es visible con contraste adecuado junto al logo

  Scenario: Click en el ícono abre el panel de feedback
    Given un visitante ve el ícono de feedback junto al logo
    When hace click en el ícono
    Then se abre el widget de feedback con categoría "Opinión" preseleccionada

  Scenario: Botón flotante sigue disponible en paralelo
    Given un visitante en cualquier página del tenant
    When hace click en el ícono flotante de feedback (esquina inferior derecha)
    Then se abre el mismo widget de feedback, igual que antes de este cambio

  Scenario: Ícono visible en mobile
    Given un visitante ve la página de un tenant en un viewport mobile
    Then el ícono de feedback permanece visible junto al logo, sin colapsar a un menú

  Scenario: Feature aplica a todos los tenants
    Given tenants distintos (ej. wondernails, zo-system, centro-tenistico)
    When cada uno carga su página con TenantHeader
    Then el ícono de feedback aparece junto al logo en todos ellos
```

## Casos borde

- Header `transparent` sin scroll tiene `pointer-events-none` en el contenedor raíz; el ícono debe quedar dentro del bloque que ya fuerza `pointer-events-auto` (mismo tratamiento que el logo), para ser clicable.
- Tenant con `logoUrl` custom vs. logo por defecto: el ícono se posiciona igual en ambos casos.
- Pantallas muy angostas: el ícono no debe forzar overflow horizontal del header.
- Si el panel ya está abierto y se hace click en el ícono del header, no debe duplicar el panel (mismo comportamiento singleton que hoy).

## Archivos involucrados

- `apps/web/components/ui/TenantHeader.tsx` (modificado — agrega botón/ícono junto a `TenantLogo`)
- `apps/web/components/feedback/FeedbackWidgetContext.tsx` (sin cambios, reutilizado)
- `apps/web/components/feedback/FeedbackWidget.tsx` (sin cambios, reutilizado)

## Notas técnicas

- No se modifica la base de datos ni el esquema de validación.
- No se modifica el endpoint `POST /api/feedback`.
- Se reutiliza el contexto global `FeedbackWidgetProvider` ya montado en `app/layout.tsx`.

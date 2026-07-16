# STRY-029 — Menú de usuario adaptado a la paleta del tenant

## Descripción general
El menú desplegable de usuario en el header usa actualmente un fondo oscuro hardcodeado que choca con la paleta clara de tenants como wondernails. Se requiere que el menú derive sus colores (fondo, texto, iconos, estados hover/active) de la paleta del tenant activo, garantizando legibilidad en cualquier combinación de colores.

## Actores
- Usuario autenticado de cualquier rol en cualquier tenant.

## Flujos principales
1. Usuario hace clic en el avatar/nombre del header.
2. Se abre el menú desplegable agrupado en secciones: Cuenta, Marketing, Gestión, Sistema.
3. El menú renderiza con colores derivados de la paleta del tenant activo.

## Reglas de negocio
- Fondo, texto e iconos del menú deben usar tokens de color del tenant.
- Contraste entre texto e iconos y su fondo debe ser legible (WCAG AA como mínimo).
- Estructura y orden de ítems del menú no cambia.
- Si el tenant no tiene paleta personalizada, se aplica el tema base del tenant como fallback.
- Estados hover y active deben mantenerse con suficiente contraste.

## Criterios de aceptación — Gherkin

```gherkin
Feature: Menú de usuario adaptado a paleta del tenant

  Scenario: Usuario abre menú en tenant con paleta clara
    Given un usuario autenticado en tenant wondernails
    And el tenant tiene una paleta de colores clara
    When el usuario abre el menú de usuario desde el header
    Then el fondo del menú usa un color claro derivado de la paleta del tenant
    And los textos e iconos usan colores oscuros con contraste legible

  Scenario: Usuario abre menú en tenant con paleta oscura
    Given un usuario autenticado en tenant con paleta oscura
    When el usuario abre el menú de usuario
    Then el fondo del menú usa un color oscuro derivado de la paleta del tenant
    And los textos e iconos usan colores claros con contraste legible

  Scenario: Tenant sin paleta personalizada
    Given un usuario autenticado en tenant sin paleta personalizada
    When el usuario abre el menú de usuario
    Then el menú aplica el tema por defecto del tenant
    And no se rompe la legibilidad de los ítems

  Scenario: Estados hover/active mantienen contraste
    Given un usuario abrió el menú de usuario en cualquier tenant
    When pasa el cursor por encima de un ítem del menú
    Then el estado hover usa colores derivados de la paleta del tenant
    And el texto/icono sigue siendo legible

  Scenario: Menú responsive conserva paleta del tenant
    Given un usuario autenticado en un tenant con paleta clara
    And la vista está en resolución móvil
    When el usuario abre el menú de usuario
    Then el menú usa los colores de la paleta del tenant
    And los textos e iconos son legibles
```

## Casos borde
- Tenant sin paleta definida: fallback al tema base.
- Colores de bajo contraste en la paleta del tenant: el menú debe invertir texto/icono automáticamente para mantener legibilidad.
- Ítems deshabilitados: deben conservar semántica visual dentro de la paleta.

## Notas de implementación
- Revisar componente del header/menú de usuario en `apps/web`.
- Sustituir clases/colores hardcodeados por tokens CSS o variables del tema del tenant.
- No modificar la estructura de navegación del menú.

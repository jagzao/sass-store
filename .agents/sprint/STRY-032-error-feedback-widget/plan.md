# STRY-032 — Reporte de errores vía widget de feedback

## Descripción general

Permitir que usuarios reporten errores con la menor fricción posible: un botón de chat/icono accesible en pantallas de error que abre el widget de feedback ya existente, precargando categoría y datos del error.

## Actores

- **Usuario final**: navega un tenant y encuentra un error.
- **Admin del tenant**: revisa feedback entrante desde `/admin/feedback`.
- **Equipo sass-store**: recibe webhook n8n por cada feedback enviado.

## Flujo principal

1. Usuario experimenta error (página global, tenant o componente).
2. En la pantalla de error aparece botón “Reportar problema” con ícono de chat.
3. Usuario hace click.
4. Se abre widget de feedback con:
   - categoría `problema` preseleccionada,
   - mensaje prellenado con `error.name` y `error.message`,
   - contexto con `error.digest`, route y `source: error_page`.
5. Usuario envía.
6. Feedback se guarda en `feedback` tabla y se dispara webhook n8n.

## Reglas de negocio

- Solo se puede enviar feedback si `tenantSlug` está resuelto.
- El mensaje mínimo sigue siendo 10 caracteres.
- El usuario puede editar el mensaje precargado.
- El widget flotante general sigue disponible para feedback no relacionado a errores.

## Criterios de aceptación

```gherkin
Feature: Reporte de errores vía widget de feedback

  Scenario: Usuario reporta un error desde página global
    Given un usuario ve la página de error global
    When hace click en "Reportar problema"
    Then se abre el widget de feedback con categoría "problema"
    And el mensaje contiene información del error
    And el feedback se envía correctamente

  Scenario: Usuario reporta un error desde página de tenant
    Given un usuario ve la página de error de tenant
    When hace click en "Reportar problema"
    Then se abre el widget de feedback con categoría "problema"
    And el contexto incluye el digest del error

  Scenario: Usuario reporta un error desde error boundary de componente
    Given un componente falla y muestra el error boundary
    When hace click en "Reportar problema"
    Then se abre el widget de feedback con categoría "problema"

  Scenario: Widget sigue disponible para feedback general
    Given un usuario en cualquier página
    When hace click en el ícono flotante de feedback
    Then se abre el widget con categoría "opinión" por defecto

  Scenario: Feedback de error llega al admin del tenant
    Given un usuario envía feedback de problema desde una página de error
    Then el feedback aparece en el dashboard de admin del tenant
    And el webhook n8n se dispara con el contexto del error
```

## Casos borde

- Si el widget ya está abierto, hacer click en “Reportar problema” lo reinicia con datos del error.
- Si no hay sesión, el campo email sigue siendo opcional.
- Si el mensaje precargado es menor a 10 caracteres, el botón enviar permanece deshabilitado hasta que el usuario complete.

## Archivos involucrados

- `apps/web/components/feedback/FeedbackWidgetContext.tsx` (nuevo)
- `apps/web/components/feedback/FeedbackWidget.tsx` (modificado)
- `apps/web/components/feedback/FeedbackErrorTrigger.tsx` (nuevo)
- `apps/web/app/layout.tsx` (modificado)
- `apps/web/app/error.tsx` (modificado)
- `apps/web/app/t/[tenant]/error.tsx` (modificado)
- `apps/web/components/error-boundary.tsx` (modificado)
- `apps/web/lib/services/feedback-service.ts` (sin cambios, reutilizado)
- `apps/web/app/api/feedback/route.ts` (sin cambios, reutilizado)

## Notas técnicas

- No se modifica la base de datos.
- No se modifica el esquema de validación.
- Se reutiliza webhook n8n existente.
- Se sigue Result Pattern en backend; en frontend se mantiene UX con try/catch por ser boundary cliente.

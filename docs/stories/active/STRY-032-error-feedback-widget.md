# STRY-032 — Reporte de errores vía widget de feedback

## Historia

Como usuario final, quiero reportar un error con un solo click desde la pantalla de error, para que el equipo del tenant y sass-store puedan resolverlo sin que yo tenga que buscar dónde contactar soporte.

## Criterios de aceptación

- Botón “Reportar problema” visible en páginas de error.
- Click abre widget con categoría `problema` y datos del error precargados.
- Mensaje editable, envío mínimo 10 caracteres.
- Feedback se guarda y dispara webhook n8n.
- Widget flotante general sigue funcionando.

## Estado

Especificación e implementación completadas. Pendiente tests E2E y review.

## Artifacts

- Plan: `.agents/sprint/STRY-032-error-feedback-widget/plan.md`
- Implementation: código en `apps/web/components/feedback/*`, `apps/web/app/error.tsx`, `apps/web/app/t/[tenant]/error.tsx`, `apps/web/components/error-boundary.tsx`

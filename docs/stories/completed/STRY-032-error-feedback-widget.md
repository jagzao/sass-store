# STRY-032 — Reporte de errores vía widget de feedback

## Historia

Como usuario final, quiero reportar un error con un solo click desde la pantalla de error, para que el equipo del tenant y sass-store puedan resolverlo sin que yo tenga que buscar dónde contactar soporte.

## Criterios de aceptación

### Funcional

- Botón “Reportar problema” visible en páginas de error globales, de tenant y en `ErrorBoundary`.
- Click abre widget con categoría `problema` y datos del error precargados (nombre, mensaje, digest, ruta).
- Mensaje editable, envío mínimo 10 caracteres, validado en cliente y servidor.
- Feedback se guarda en tabla `feedback` con `status=pending` y dispara webhook n8n (configurado vía `N8N_FEEDBACK_WEBHOOK_URL`).
- Si webhook falla, el registro queda con `status=failed` y el usuario recibe mensaje “Lo guardamos, lo procesaremos más tarde”.
- Widget flotante general sigue funcionando en páginas que no sean de error.

### UI/UX

- Todos los elementos del widget y las páginas de error usan tokens del tema (`bg-*`, `text-*`, `border-*`, `primary`, `destructive`, etc.) y respetan modo oscuro/claro.
- Contraste WCAG AA mínimo en textos y botones.
- Widget es responsivo: ancho `w-80 sm:w-96`, botón flotante posicionado en `bottom-4 right-4` sin tapar contenido esencial.
- Estados de focus, hover y disabled son visibles.
- Icono de cierre accesible (SVG con `aria-label`).

### Seguridad / aislamiento

- `POST /api/feedback` resuelve tenant solo por slug (`x-tenant`) con lookup en DB; nunca confía ciegamente en `x-tenant-id` del cliente.
- `GET /api/feedback` requiere autenticación y autorización (admin o `tenantSlug` coincidente) usando `assertTenantAccess`.
- Rate limit de 3 intentos cada 15 minutos por identificador `feedback`.
- Rutas de prueba `test-error` están protegidas por `E2E_SEED_ENABLED` y son `force-dynamic`.

### Testing

- Unit tests para `FeedbackWidgetContext` y `feedback-service`.
- E2E: widget flotante accesible en tenant, trigger visible en error page de tenant, y trigger oculto/no funcional en error page global sin tenant.
- Build, lint, typecheck y test:unit pasan.
- Validación cross-tenant: los cambios de tema/branding no deben romper `zo-system`, `centro-tenistico` ni `manada-juma`; se mantiene consistencia de tokens HSL.

## Estado

Implementación, revisión de seguridad, ajustes de UI/UX y validación cross-tenant completados.

## Artifacts

- Plan: `.agents/sprint/STRY-032-error-feedback-widget/plan.md`
- Implementation: `apps/web/components/feedback/*`, `apps/web/app/error.tsx`, `apps/web/app/t/[tenant]/error.tsx`, `apps/web/components/error-boundary.tsx`, `apps/web/app/api/feedback/route.ts`, `apps/web/lib/services/feedback-service.ts`
- Tests: `tests/unit/components/feedback-widget.spec.tsx`, `tests/unit/services/feedback-service.spec.ts`, `tests/e2e/error-feedback-widget.spec.ts`

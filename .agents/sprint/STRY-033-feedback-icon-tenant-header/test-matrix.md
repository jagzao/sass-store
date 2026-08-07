| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | Ícono visible junto al logo en header default | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Alta | ✅ implementado |
| SC-02 | Ícono visible en header transparente sin scroll | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Media | ✅ implementado |
| SC-03 | Ícono visible en header oscuro | Unit (no hay tenant seed con variant="dark" en TenantHeader; zo-system es el único con theme dark y no renderiza TenantHeader) | `tests/unit/components/feedback-header-button.spec.tsx` | Media | ✅ implementado |
| SC-04 | Click en el ícono abre el panel de feedback (categoría Opinión) | E2E + Unit | `tests/e2e/feedback/feedback-icon-header.spec.ts`, `tests/unit/components/feedback-header-button.spec.tsx` | Alta | ✅ implementado |
| SC-05 | Botón flotante sigue disponible en paralelo | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` (caso dedicado) + regresión en `tests/e2e/feedback/send-opinion.spec.ts` | Media | ✅ implementado |
| SC-06 | Ícono visible en mobile sin colapsar a menú | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Media | ✅ implementado |
| SC-07 | Feature aplica a todos los tenants con TenantHeader (wondernails, manada-juma, centro-tenistico) | E2E (parametrizado) | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Alta | ✅ implementado |

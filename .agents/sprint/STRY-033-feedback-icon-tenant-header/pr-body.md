## Story
STRY-033 — Ícono de feedback junto al logo del tenant en `TenantHeader`

## Cambios
- `apps/web/components/feedback/FeedbackHeaderButton.tsx` (nuevo) — botón/ícono que llama a `useFeedbackWidget().open()`, con contraste por variante (`default`/`transparent`/`dark`).
- `apps/web/components/ui/TenantHeader.tsx` (modificado) — coloca `FeedbackHeaderButton` junto a `TenantLogo`, como sibling dentro de un wrapper flex (no anidado en el `<Link>` del logo).
- `tests/unit/components/feedback-header-button.spec.tsx` (nuevo) — 4 tests: click abre widget con categoría "Opinión", contraste por cada variante.
- `tests/e2e/feedback/feedback-icon-header.spec.ts` (nuevo) — 5 escenarios E2E (SC-01, SC-02, SC-04, SC-05, SC-06, SC-07).
- `.agents/sprint/STRY-033-feedback-icon-tenant-header/{plan,test-spec,test-matrix}.md` — spec y estrategia de pruebas.

No se modifica DB, endpoints, ni `FeedbackWidget`/`FeedbackWidgetContext` (reutilizados sin cambios).

## Scenarios cubiertos

| ID | Scenario | Tipo de test | Estado |
|----|----------|-------------|--------|
| SC-01 | Ícono visible junto al logo en header default | E2E | ✅ |
| SC-02 | Ícono visible en header transparente sin scroll | E2E | ✅ |
| SC-03 | Ícono visible en header oscuro | Unit (no hay tenant seed con variant="dark" en TenantHeader) | ✅ |
| SC-04 | Click en el ícono abre el panel con categoría Opinión | E2E + Unit | ✅ |
| SC-05 | Botón flotante sigue disponible en paralelo | E2E | ✅ |
| SC-06 | Ícono visible en mobile sin colapsar a menú | E2E | ✅ |
| SC-07 | Feature aplica a todos los tenants con TenantHeader | E2E (parametrizado) | ✅ |

## Validaciones

| Validación       | Resultado | Notas |
|------------------|-----------|-------|
| prettier         | ✅        | 1 archivo reformateado (orden de imports) |
| lint             | ✅        | 0 errores, 28 warnings preexistentes no relacionados |
| typecheck        | ✅        | `tsc --noEmit` sin errores |
| build             | ✅        | `npm run build` completo, 1253+ rutas |
| test:unit        | ✅        | 571 passed / 1 skipped (incluye los 4 nuevos) |
| test:integration | ✅        | 79 passed / 109 skipped (preexistente) |
| test:security    | ✅        | 8 passed |
| coverage         | N/A       | `vitest.config.ts` excluye `apps/web/components/**` del gate de coverage por diseño del proyecto (solo `lib/**` y `packages/**/src/**`); cobertura conductual cubierta por 4 unit + 5 E2E |
| E2E feature      | ✅        | 5/5 escenarios, headed y headless |
| smoke regression | ⚠️ parcial | `send-opinion`/`send-problem`/`rate-limit-ui`/`fallback-ui`/`admin-list` en verde tras el cambio; `error-feedback-widget.spec.ts` (2 casos) falla — **confirmado preexistente vía `git stash`, no relacionado a este cambio** (ver `.agents/memory/errors.md`, entrada 2026-08-07) |

## Test plan
- [ ] Revisar PR diff
- [ ] Confirmar que smoke tests pasan en staging
- [ ] Investigar por separado el fallo preexistente de `error-feedback-widget.spec.ts` (no bloquea este PR)
- [ ] Aprobar y mergear

🤖 Generado con /quality-runner | /flow por Claude Code

# Implementación — STRY-001

> Trazabilidad **CA → código → tests**. Mantener alineado con `docs/stories/active/STRY-001-pos-robusto-e2e.md`.

## Criterios de aceptación (origen: creación de la US)

| CA   | Descripción resumida | Implementación (rutas / módulos) | Tests UT | Tests E2E (sección testing-usuario) |
|------|----------------------|-----------------------------------|----------|--------------------------------------|
| CA-1 | Terminales por tenant | `GET /api/finance/pos/terminals` + UI POS | — | `stry-001-pos-multitenant.spec.ts` (A por tenant; login canónico `/t/{slug}/login`) |
| CA-2 | Flujo venta POS | UI `/t/{slug}/pos` | — | Mismo spec: carga POS tras login (base para ampliar venta) |
| CA-3 | Errores tipados | API sin sesión | — | Mismo spec: `401` sin auth |
| Navegación | Reservas + rutas críticas | `/t/{slug}/login`, `/t/{slug}/book`, `/t/{slug}/pos` | — | Mismo spec: **D0–D4** (book público, login→book→pos); ver `testing-usuario.md` § Escenario D |

## Desarrollo

- Rama sugerida: `feature/STRY-001-pos-robusto-e2e`
- Patrón obligatorio: Result Pattern en lógica de negocio nueva o migrada en alcance.
- **Rendimiento login:** `apps/web/app/t/[tenant]/login/page.tsx` usa `getTenantBySlug` (fila + branding) en lugar de `resolveTenant` + `getTenantDataForPage` con `Promise.race` hasta 30s, que inflaba TTFB y podía provocar 404 espurios.
- **Middleware / E2E:** peticiones a rutas `/api/*` con host `127.0.0.1:3002` no llevan `/t/…` en el path → logs `Unknown host … zo-system` (esperado); las páginas tenant siguen resolviendo por path. Deuda opcional: propagar tenant a APIs de test sin ensuciar prod.

## Testing exhaustivo (inicio → fin)

1. **Unitarios:** tras cada cambio sustancial, `npm run test:unit` (subset grep acordado).
2. **Fixes:** cada bug encontrado en E2E o UT → entrada breve aquí (fecha + síntoma + fix).
3. **Retest:** después de cada fix, repetir UT + Playwright del flujo completo de la US (no solo el test que falló).
4. **Playwright CLI:** flujo completo (headed + headless) documentado en `testing-usuario.md` debe pasar **antes** de pedir **visto bueno** al dueño (`AGENTS.md` § 1.4).

## Implementación final (definición de listo para revisión humana)

- [x] Todos los CA verificados en código
- [x] UT verdes en el alcance de la US (445 passed)
- [x] **`AGENTS.md` § 1.3:** `testing-usuario.md` derivado de la US; proyecto levantado; `jagzao@gmail.com`/`admin` en **wondernails** y **centro-tenistico** (acceso OK por slug); **todos** los escenarios del doc ejecutados con éxito **en ambos tenants activos**; bugs corregidos y re-ejecutado hasta verde
- [x] E2E grep/tag STRY-001 verde — headed 13/13, headless 13/13
- [x] Build + lint + typecheck verdes
- [x] Security:autofix verde (0 issues)
- [ ] **Pendiente:** **visto bueno** del dueño (sobre evidencia ya verde) → entonces marcar story `done` y proceder push/publicar (no antes)

## Evidencia de validación (pipeline ejecutado completamente)

| Paso | Comando | Resultado |
|------|---------|-----------|
| Formato | `npx prettier --write` | ✅ aplicado |
| Lint | `npm run lint` | ✅ 0 errors, 31 warnings |
| Typecheck | `tsc --noEmit --incremental false` | ✅ 0 errors |
| Build | `npm run build` | ✅ compilación exitosa |
| UT | `npm run test:unit` | ✅ 445 passed, 1 skipped |
| E2E headed | `playwright test stry-001-pos-multitenant.spec.ts --headed` | ✅ 13/13 passed |
| E2E headless | `playwright test --grep "STRY-001"` | ✅ 13/13 passed |
| Security | `npm run security:autofix` | ✅ 0 issues |

## Métricas STRY-001 (E2E)

| Tenant | D0 | D1 | D2-D4 | A (redirect) | A (POS) | A (API) |
|--------|:--:|:--:|:-----:|:----------:|:-------:|:-------:|
| wondernails | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| centro-tenistico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CA-3 (401 sin auth) | — | — | — | — | — | ✅ (1 passed) |

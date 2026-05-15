# STRY-020 — Plan de Ejecución

## Alcance actual

Hardening de salida a producción: fix de bloqueos de build/pipeline, quality gate real, smoke multitenant.

## Estado por fase (orquestador)

| Fase                    | Estado       | Notas                                                                     |
| ----------------------- | ------------ | ------------------------------------------------------------------------- |
| 0 (Amarrar alcance)     | ✅ Cerrado   | Scope = fix bloqueos release (subset, build, gate) + smoke post-deploy    |
| 1 (PM)                  | ✅ Cerrado   | Story STRY-020 creada, backlog revisado, cero preguntas abiertas          |
| 2 (Architect)           | ✅ Cerrado   | Riesgos documentados: TLS/fonts, subset roto, scope freeze                |
| 3 (Dev)                 | ✅ Cerrado   | Fixes implementados y probados                                            |
| 4 (QA — Playwright CLI) | ✅ Cerrado   | Headed 9/9 + headless 9/9 passed; build+lint+typecheck+UT+security verdes |
| 5 (Visto bueno dueño)   | ⏳ Pendiente | Esperando aprobación explícita para `done`                                |

## Tareas ejecutadas (orden)

1. **Fix `test:e2e:subset`**: `scripts/run-e2e-subset.js` — agregar `cleanedEnv` que elimina `npm_config_*` env vars antes de spawn. Esto evita que npm pase `--grep`/`--headed` como variables de configuración al webServer de Playwright, que a su vez envenena `turbo run build`.
2. **Validar build TLS/fonts**: `npm run build` local pasa sin errores TLS. Turbopack usa `turbopackUseSystemTlsCerts`. No requirió cambio de código.
3. **Scope limpio**: Eliminado tenant inexistente `vainilla-vargas` de `apps/web/middleware.ts` (`KNOWN_TENANTS`).
4. **Quality gate**:
   - `npx prettier --write` aplicado
   - `npm run lint`: 0 errores, 25 warnings `react-hooks/exhaustive-deps` (deuda técnica conocida)
   - `npm run typecheck`: 0 errores
   - `npm run build`: exitoso
   - `npm run test:unit`: 452 passed, 1 skipped
   - `npm run test:e2e:subset -- --grep "deep-audit"` (headed): 9/9 passed
   - `npm run test:e2e:subset -- --grep "deep-audit"` (headless): 9/9 passed
   - `npm run security:autofix`: 0 issues

## Bloqueos resueltos

| Bloqueo                                                           | Solución                                                             | Archivo                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------- |
| `npm run test:e2e:subset -- --grep X` falla con turbo build error | Limpiar `npm_config_*` env vars en script runner                     | `scripts/run-e2e-subset.js` |
| Build TLS/fonts                                                   | No aplicó en este entorno; turbopack maneja TLS con certs de sistema | —                           |
| Tenant inexistente en middleware                                  | Removido `vainilla-vargas` de `KNOWN_TENANTS`                        | `apps/web/middleware.ts`    |

## Pendientes post-visto-bueno (Fase 5+)

- Merge a `main` / release branch
- Deploy a Vercel
- Smoke post-deploy por tenant (wondernails, centro-tenistico)
- Validar rollback procedure

## Riesgos residuales

- 25 warnings `react-hooks/exhaustive-deps`: no bloquean release pero son deuda técnica. Plan: STRY-018 o sprint siguiente.
- `db:push` abortado por drops destructivos (columnas con datos). Requiere migration strategy manual para schema futuro; no bloquea release actual.

---

**Actualizado:** 2026-05-13
**Próximo paso:** Visto bueno del dueño → Fase 5

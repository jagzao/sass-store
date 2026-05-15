# STRY-018 — Plan de Ejecución

## Alcance

Recuperar suite E2E de ~50% a ≥90% pass, estabilizar flaky tests, implementar health endpoint, y configurar CI gate.

## Estado por fase

| Fase                     | Estado         | Notas                                                               |
| ------------------------ | -------------- | ------------------------------------------------------------------- |
| 0 — Inventario           | 🔄 En progreso | Armando baseline con subsets por feature                            |
| 1 — Fixes rápidos        | ⏳ Pendiente   | Post-inventario                                                     |
| 2 — Stabilización flaky  | ⏳ Pendiente   | Bucle Dev↔QA                                                        |
| 3 — CI Gate              | ⏳ Pendiente   | Revisar workflow + branch protection                                |
| 4 — Health endpoint      | ✅ Cerrado     | Ya existe en `app/api/health/route.ts`, responde 200 con DB latency |
| 5 — Playwright CLI final | ⏳ Pendiente   | Suite completa headless verde                                       |

## Tareas en ejecución

1. **Inventario por subsets**: Ejecutar `test:e2e:subset` con `--grep` por dominio (auth, booking, pos, finance, tenants, etc.) para clasificar pass/fail/flaky.
2. **Health endpoint**: Ya implementado y operativo. Verificado: `GET /api/health` → 200, DB latency ~130ms.
3. **CI Gate**: Revisar `.github/workflows/e2e-tests.yml` y branch protection.

## Inventario preliminar (suite completa)

- **Total specs**: 68 files
- **Total tests**: ~619 tests
- **Baseline actual**: desconocido (suite completa no ejecutable por timeout de build en webServer)
- **Estrategia**: subsets por feature con dev server reutilizado

## Riesgos

- Build de webServer en Playwright tarda >5 min y puede timeout; solución: `E2E_REUSE_SERVER=1` con dev server en 3003.
- Algunos specs dependen de features incompletas (social, whatsapp); plan: skip justificado.

---

**Actualizado:** 2026-05-13

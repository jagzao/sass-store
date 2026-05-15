# STRY-018 — Implementación

## Cambios aplicados / Estado

### 1. Health endpoint ✅

**Archivo:** `apps/web/app/api/health/route.ts`
**Estado:** Ya existía, verificado operativo.
**Response:**

```json
{
  "status": "ok",
  "version": "0.0.0",
  "timestamp": "2026-05-15T03:56:22.446Z",
  "checks": {
    "database": { "status": "ok", "latencyMs": 130 }
  }
}
```

**Validación:** `GET http://localhost:3003/api/health` → HTTP 200, DB ok.

### 2. Inventario E2E por subsets 🔄

**Estrategia:** Dado que el suite completo (~619 tests / 68 files) timeoutea en el build del webServer de Playwright, se ejecutan subsets por feature usando dev server en 3003 con `E2E_REUSE_SERVER=1`.

**Servidor de prueba:**

- `npm run dev` en port 3003 (se levanta en ~15s)
- `BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 npx playwright test --grep "<feature>"`

### 3. Subset runner fix

**Nota:** El fix de `scripts/run-e2e-subset.js` (limpieza `npm_config_*`) realizado en STRY-020 aplica aquí también.

## Pendientes

- [x] Health endpoint unit test (2/2 pass)
- [x] CI workflow: `e2e-tests.yml` ajustado para usar subset runner (smoke + critical primero, full suite non-blocking)
- [ ] Inventario completo por feature con tabla pass/fail/flaky
- [ ] Fix de tests con regresión/selector roto
- [ ] Stabilización de flaky tests
- [ ] Final suite headless con threshold ≥90%

---

**Actualizado:** 2026-05-13

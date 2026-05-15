# STRY-020 — Implementación

## Cambios aplicados

### 1. Fix script `run-e2e-subset.js`

**Problema:** npm inyecta flags CLI (`--grep`, `--headed`) como variables de entorno `npm_config_grep`/`npm_config_headed` al proceso hijo del script. El webServer de Playwright ejecuta `node scripts/start-e2e-server.js`, que internamente corre `turbo run build`, y turbo/npm interpretan esas variables como flags desconocidos, abortando el build.

**Fix:** Antes de `spawnSync`, crear una copia limpia del `process.env` eliminando todas las claves que empiezan con `npm_config_`.

```js
const cleanedEnv = { ...process.env };
for (const key of Object.keys(cleanedEnv)) {
  if (key.startsWith("npm_config_")) {
    delete cleanedEnv[key];
  }
}
// spawnSync(..., { env: cleanedEnv })
```

**Resultado:** `npm run test:e2e:subset -- --grep "deep-audit" --headed` ahora ejecuta correctamente Playwright con webServer limpio.

### 2. Limpieza de tenant inexistente

**Archivo:** `apps/web/middleware.ts`
**Cambio:** Removido `"vainilla-vargas"` de `KNOWN_TENANTS` para evitar referencias a tenant no existente en DB.

### 3. Build TLS/fonts

**Estado:** No requirió cambio. `npm run build` pasa localmente sin errores TLS. Turbopack usa `turbopackUseSystemTlsCerts` que delega al almacén de certificados del sistema operativo.

## Validación

- Build: ✅ 1 successful, 0 errors
- Lint: ✅ 0 errors, 25 warnings (documentados)
- Typecheck: ✅ 0 errors
- Unit tests: ✅ 452 passed, 1 skipped
- E2E headed: ✅ 9/9 deep-audit passed
- E2E headless: ✅ 9/9 deep-audit passed
- Security autofix: ✅ 0 issues

## Dependencias

- `tests/e2e/deep-audit-pages.spec.ts` — spec de validación multitenant con login robusto, screenshots y reportes markdown por tenant.
- `scripts/run-e2e-subset.js` — script de orquestación fixeado.

---

**Actualizado:** 2026-05-13

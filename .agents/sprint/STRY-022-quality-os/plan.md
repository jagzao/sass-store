# Plan de Ejecución — STRY-022 Quality OS

## Objetivo

Cerrar todas las brechas del reporte `.agent-reports` (excepto P0 secrets) y entregar dashboard interno `/admin/quality` con tests E2E.

---

## Pasos numerados

1. **Crear documentos obligatorios** (1-10)
   - Tomar como fuente de verdad: `BACKLOG.md`, `package.json`, `schema.ts`, `apps/web/app/api/**`
   - Ubicación: `docs/{nombre}.md`
   - Criterio "hecho": cada archivo tiene >20 líneas y referencia real al repo.

2. **Crear agent guard rules + quality.config.json**
   - `.agents/guards/common-guards.md`
   - `.agents/guards/quality-os-rules.md`
   - `quality.config.json`
   - Criterio "hecho": Quality OS detecta rules y config.

3. **Implementar API de calidad**
   - `apps/web/app/api/system/quality/route.ts`
   - Leer `quality-report.json`, sanitizar, devolver JSON.
   - Criterio "hecho": `curl http://localhost:3001/api/system/quality` responde 200.

4. **Implementar UI /admin/quality**
   - `apps/web/app/admin/quality/page.tsx`
   - `apps/web/app/admin/quality/QualityDashboardClient.tsx`
   - Diseño con cards, tabla de findings, score semáforo.
   - Criterio "hecho": renderiza score y lista sin errores de consola.

5. **Registrar ruta en sidebar admin**
   - Agregar entrada "Calidad" con icono en el sidebar de admin.
   - Criterio "hecho": visible para admin.

6. **Tests E2E**
   - `tests/e2e/quality-dashboard.spec.ts`
   - Coverage: acceso, renderizado de score, tabla, navegación.
   - Smoke: `tests/e2e/smoke-quality.spec.ts`

7. **Actualizar AGENTS.md**
   - Agregar regla: análisis de `.agent-reports` → actualizar STRY-022.

8. **Pipeline validación**
   - prettier, lint, typecheck, build, unit tests, e2e subset.

---

## Asunciones / defaults

- El dueño confirmó que P0 secrets se ignora (gestión STRY-019).
- `.env.cloudflare` está trackeado pero libre de secrets; no se elimina, se documenta.
- No se requiere persistencia en DB para el dashboard (lectura de JSON).

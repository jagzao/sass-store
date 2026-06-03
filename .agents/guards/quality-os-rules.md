# Quality OS Rules — Sass Store

## Propósito

Garantizar que el score de Quality OS se mantenga o mejora con cada iteración.

## Reglas Específicas

1. **Documentos obligatorios presentes**
   - `docs/ROADMAP.md`
   - `docs/USER-STORIES.md`
   - `docs/ACCEPTANCE-CRITERIA.md`
   - `docs/API-SPEC.md`
   - `docs/DATABASE.md`
   - `docs/TEST-PLAN.md`
   - `docs/SECURITY.md`
   - `docs/DEPLOYMENT.md`
   - `docs/QUALITY-REPORT.md`
   - `docs/CHANGELOG.md`
   - Si uno falta → crear/recrear antes de reportar completado.

2. **Agent guards**
   - `.agents/guards/*.md` debe tener al menos un archivo `.md`.
   - Actualizar guards si cambian los requisitos del proyecto.

3. **quality.config.json**
   - Debe existir en la raíz del proyecto.
   - Debe reflejar la configuración actual de endpoints y reglas.

4. **Revisiones de entorno**
   - Todo `.env*` que no sea ejemplo debe estar en `.gitignore`.
   - Si se detecta un `.env` trackeado por git → eliminar y documentar.

5. **Análisis recurrente**
   - Cuando el dueño pida "analiza `.agent-reports`", actualizar la US `STRY-022-quality-os`.
   - No emitir respuestas sueltas; todo queda reflejado en `plan.md` / `implementacion.md`.

## Penalización

Si un PR reduce el Quality Score sin justificación, debe incluir un plan de recuperación antes del merge.

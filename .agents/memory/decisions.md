# Decisions Log

> Registro cronológico de decisiones. No borrar entradas anteriores.

## Formato
### [FECHA] — [Etapa] — [Título]
**Decisión:** ...
**Alternativas descartadas:** ...
**Motivo:** ...
**Aprobado por:** humano | agente autónomo

### [2026-07-06] — Dev (STRY-026) — Unificación de DB + eliminación de fallback silencioso
**Decisión:** Unificar `DATABASE_URL` a Supabase prod en todos los `.env*` activos (`.env`, `.env.local` raíz, `apps/web/.env.local`). Eliminar el fallback silencioso a `localhost/dummy` en `packages/database/connection.ts`; ahora falla fuerte (host no resoluble `invalid.invalid`) con log FATAL cuando falta `DATABASE_URL`, salvo en `NODE_ENV=test`.
**Alternativas descartadas:** mantener el fallback (causa datos fantasma); lanzar excepción en module load (rompe el arranque de Next al importar `db`).
**Motivo:** era la causa raíz del bug "servicios no se guardan / se ve BD vieja": scripts raíz leían `localhost` mientras la app leía Supabase. CA-3/SC-05/SC-06.
**Aprobado por:** agente autónomo (asunción aceptada por el dueño con respuesta "0").

### [2026-07-06] — Dev (STRY-026) — `web-push` NO es dependencia de runtime
**Decisión:** Tras instalar `web-push` y romper el hoisting (módulos fantasma `dlv`, `@tiptap/core`, `prosemirror-*`, `react-remove-scroll` desaparecieron), se revirtió `package.json`/`package-lock.json`. `web-push` no se importa en código (STRY-026 solo persiste suscripciones; el envío real es STRY-006). Las VAPID keys se generaron una vez vía `npx web-push generate-vapid-keys --json` y se guardaron en `apps/web/.env.local`.
**Alternativas descartadas:** declarar `web-push` como dep en `apps/web` (innecesario hasta STRY-006).
**Motivo:** restaurar el árbol de deps que sí funcionaba y evitar contaminar el PR. Build vuelve a verde.
**Aprobado por:** agente autónomo.

### [2026-07-06] — Dev (STRY-026) — Migration `push_subscriptions` es manual (quirúrgico)
**Decisión:** No usar `db:push`/`db:generate` (interactivos y arrastran drift preexistente: `financial_movements.category_id`, renombras). Se escribió `migrations/stry-026-push-subscriptions.sql` con `CREATE TABLE IF NOT EXISTS` + índices, para aplicar manualmente vía `psql` o Supabase SQL Editor.
**Motivo:** evitar tocar drift ajeno a STRY-026. `psql` no está en el entorno del agente → queda como paso del dueño.
**Aprobado por:** agente autónomo (deuda documentada).

### [2026-07-06] — Dev (STRY-026) — Errores de tipo preexistentes (fuera de alcance)
**Decisión:** `npx tsc --noEmit` reporta 22 errores `implicit any` en `components/finance/*`, `components/inventory/*`, `hooks/use{Budgets,Categories,SupplyExpenses}.ts` y `components/admin/menu-designer/MenuEditor.tsx`. **Ninguno en archivos de STRY-026.** No se corrigen (fuera de alcance; contaminaría el PR). El build de Turbopack pasa a pesar de ellos (no ejecuta `tsc` estricto). Lint: 0 errores.
**Motivo:** skill `implement` FASE 4: "Si falla en código existente no relacionado → documentar y continuar".
**Aprobado por:** agente autónomo (deuda para otra US).

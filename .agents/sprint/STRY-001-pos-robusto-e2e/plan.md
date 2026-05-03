# Plan de ejecución — STRY-001 POS robusto + E2E

> Guía para implementar la US de punta a punta de forma autónoma. Actualizar fechas y checkboxes según avance.

## Objetivo

Robustecer el POS (API/UI según alcance acordado en `implementacion.md`) y dejar **tests unitarios + Playwright CLI** que cubran el flujo completo descrito en `testing-usuario.md`, con aislamiento por tenant. **Obligatorio:** repetir escenarios A y B en **cada** tenant activo (`wondernails`, `centro-tenistico`); al añadir tenants, actualizar el doc y la suite.

## Orden sugerido

1. **Inventario** — Listar rutas y componentes POS actuales (`apps/web/app/api/finance/pos/**`, UI POS si existe).
2. **Gaps** — Comparar con CA en `docs/stories/active/STRY-001-pos-robusto-e2e.md`; anotar en `implementacion.md`.
3. **Servicios / API** — Result Pattern, Zod, `withResultHandler` donde aplique.
4. **UT** — `tests/unit/**` con `expectSuccess` / `expectFailure`; correr `npm run test:unit -- --grep "pos|POS|stry-001"` (ajustar grep).
5. **testing-usuario.md** — Pasos reproducibles con URLs, datos de seed, selectores o `data-testid`.
6. **Playwright** — `tests/e2e/**` derivados del doc; `npm run test:e2e:subset -- --grep "STRY-001|pos-robusto"` (ajustar al tag final).
7. **Loop fix** — Fallo → fix → re-UT → re-Playwright hasta verde.
8. **Handoff** — Agente entrega evidencia Playwright CLI + UT verde; dueño solo **visto bueno** (`AGENTS.md` § 1.4). Agente no marca `done` sin ese visto bueno.

## Riesgos

- DB/seed: sin datos POS el E2E falla; asegurar seed **por cada** slug (`wondernails`, `centro-tenistico`) en `testing-usuario.md`.
- Timeouts: anotar timeouts razonables en spec.

## Estado

| Fase        | Estado |
|------------|--------|
| Inventario | [x] |
| Implementación | [x] |
| UT         | [x] 445 passed |
| testing-usuario.md | [x] |
| E2E CLI    | [x] headed 13/13 · headless 13/13 |
| Validación humana | [ ] pendiente visto bueno del dueño |

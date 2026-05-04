# Plan de ejecución — STRY-018 E2E Recovery + CI Gate

> Guía para implementar la US de punta a punta de forma autónoma.

## Objetivo

Dejar la suite E2E con ≥88% tests passed (≤20 failed) y un CI gate que bloquee merge/deploy ante regresiones, más un health endpoint confiable.

## Orden sugerido

1. **Inventario completo** — Ejecutar `npx playwright test`, categorizar los ~119 fallos.
2. **Fixes rápidos** — Selectors rotos, seeds faltantes, timeouts.
3. **Stabilización flaky** — WaitForFunction, retry, seed consistente.
4. **Skip justificado** — Tests de features incompletas (social/whatsapp) con comentario.
5. **Health endpoint** — `app/api/health/route.ts` + UT.
6. **CI gate** — Revisar `.github/workflows/e2e-tests.yml`, marcar required.
7. **Validación final** — Headless completo ≥88%, headed spot-checks.
8. **Handoff** — Evidencia Playwright + visto bueno dueño.

## Riesgos

- Majoría de fallos preexistentes: se documentan y skipan, no se persiguen features nuevas.
- Seeds inconsistentes entre tenants: ajustar `seed-e2e`.
- CI gate requiere permisos GitHub del dueño: documentar pasos manuales.

## Asunciones / defaults

- Si el dueño no responde sobre threshold objetivo: se usa 88% (210/239 passed) con ≤5 skips.
- Si CI no es configurable por el agente: se documentan instrucciones manuales para Settings → Branches.

## Estado

| Fase              | Estado                    |
| ----------------- | ------------------------- |
| Inventario        | [ ]                       |
| Fixes rápidos     | [ ]                       |
| Stabilización     | [ ]                       |
| Skip justificado  | [ ]                       |
| Health endpoint   | [ ]                       |
| CI gate           | [ ]                       |
| Validación humana | [ ] pendiente visto bueno |

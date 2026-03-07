# Financial Matrix E2E (P0/P1)

Suites implementadas en este directorio:

- [`granularity-filters.spec.ts`](tests/e2e/finance/matrix/granularity-filters.spec.ts)
  - TC-01 (P0) mensual vs suma semanal en marzo
  - TC-02 (P0) corte quincenal exacto
  - TC-03 (P1) persistencia de filtro + scroll
- [`matrix-crud.spec.ts`](tests/e2e/finance/matrix/matrix-crud.spec.ts)
  - Crear planeado en celda vacía (P0)
  - Persistencia + estilo planeado tras recarga (P0)
  - Marcar pagado + estilo ejecutado + impacto en celda (P0)
- [`data-integrity.spec.ts`](tests/e2e/finance/matrix/data-integrity.spec.ts)
  - Aislamiento tenant A/B (P0)
  - Sync historial->matriz (P1) pendiente con skip justificado en test
- [`edge-cases.spec.ts`](tests/e2e/finance/matrix/edge-cases.spec.ts)
  - Febrero bisiesto/no bisiesto en quincena (P1)
  - Input inválido (caracteres especiales/negativos) bloqueado o sanitizado (P1)

Helpers:

- [`tests/e2e/helpers/matrix-helpers.ts`](tests/e2e/helpers/matrix-helpers.ts)

Ejecución recomendada:

```bash
npm run test:e2e -- tests/e2e/finance/matrix/
```


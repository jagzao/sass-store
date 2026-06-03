# Acceptance Criteria — Sass Store

## Criterios Globales por Tipo de Historia

### Nueva Feature

- [ ] Tres o más criterios Gherkin:
  - Happy path principal
  - Validación de input/estado inválido
  - Manejo de error (DomainError amigable)
- [ ] Contrato técnico: Zod schema + DomainError variants
- [ ] Impacto multitenancy documentado
- [ ] Plan de implementación: servicio → API → UI → E2E
- [ ] Tests unitarios ≥80% cobertura
- [ ] Tests E2E alineados a `testing-usuario.md`

### Bug Fix

- [ ] Criterio que reproduce el bug
- [ ] Criterio que valida la corrección
- [ ] Criterio de regresión (no se reintroduce)
- [ ] E2E incluye caso que cubre el bug

### Refactor

- [ ] Paridad funcional: antes/después de refactor output equivalente
- [ ] Tests unitarios pasan sin cambios (salvo mocks)
- [ ] Build + lint + typecheck sin errores
- [ ] Métricas de rendimiento iguales o mejores

## Nomenclatura

| Prefijo | Significado                           |
| ------- | ------------------------------------- |
| CA-01   | Criterio de Aceptación 1 (happy path) |
| CA-02   | Validación / edge case                |
| CA-03   | Manejo de errores                     |

## Plantilla Gherkin

```gherkin
Dado que {precondición}
Cuando {acción del usuario}
Entonces {resultado esperado}
Y {resultado adicional}
```

---

_Actualizado: 2026-05-31 — Ver ejemplos completos en `docs/stories/_template.md` y stories activas._

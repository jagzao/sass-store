# Pasos de prueba — STRY-018 (agente / Playwright)

**Grep E2E:** `STRY-018|e2e-recovery|health`.

## Evidencia de ejecución

```powershell
$env:BASE_URL = "http://127.0.0.1:3002"
npx playwright test --grep "STRY-018|health" --project=chromium
```

## Escenarios

### Escenario A — Health endpoint

| Paso | Acción                        | Resultado esperado            |
| ---- | ----------------------------- | ----------------------------- |
| A1   | `GET /api/health` sin cookies | 200, body JSON con status: ok |
| A2   | Verificar campo timestamp     | ISO8601 válido                |
| A3   | Verificar campo version       | String no vacío               |

### Escenario B — E2E suite completa (post-fixes)

| Paso | Acción                  | Resultado esperado               |
| ---- | ----------------------- | -------------------------------- |
| B1   | `npx playwright test`   | ≥210 passed, ≤20 failed          |
| B2   | Revisar test-results/\* | Sin screenshots de fallos nuevos |

---

- [ ] **Inventario** documentado en implementacion.md
- [ ] **Todos los fixes** re-ejecutados y verdes
- [ ] **Health** verde
- [ ] **CI gate** configurado o documentado
- [ ] Solo entonces: mensaje al dueño "lista para visto bueno"

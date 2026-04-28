# Manual del Agente Desarrollador — Scripts Disponibles

> Este documento describe qué comando usar según la fase del ciclo autónomo.
> Cada script está diseñado para ser ejecutado **sin intervención humana**.

---

## Fases del ciclo autónomo y scripts asociados

| Fase | Script | ¿Cuándo lo usa el agente? | Tiempo estimado |
|------|--------|---------------------------|-----------------|
| **Planificación** | — | Análisis de User Story + lectura de `.agents/` | Manual |
| **Desarrollo (rápido)** | `npm run dev` | Servidor dev con hot-reload | Continuo |
| **Build rápido** | `npm run agent:build` | Lint + typecheck + build. Sin tests. | 2-3 min |
| **Tests unitarios** | `npx vitest run` | Validar lógica de negocio | 15-30s |
| **Tests E2E completo** | `npm run agent:e2e` | Build + Playwright. Usa build cache si existe. | 2-5 min |
| **Validación completa** | `npm run validate` | Pipeline completo: lint → typecheck → build → UT → E2E | 5-8 min |
| **Validación sin rebuild** | `npm run agent:test` | Si build ya existe: solo UT + E2E | 2-4 min |
| **Marcar como listo** | `npm run agent:ship` | Si `validate` pasa, feature está lista | 5-8 min |

---

## Flujo recomendado para el agente

```
1. Implementar feature (servicio → API → tests)
2. npm run agent:build          # Verificar que compila (2 min)
3. Corregir si hay errores      # Loop de autocorrección
4. npx vitest run --grep [modulo]    # Tests unitarios (30s)
5. Corregir si fallan
6. npm run agent:e2e           # Build + E2E (3 min)
7. Corregir si fallan (hasta 5 intentos)
8. npm run agent:ship          # Validación final completa
9. Si pasa: actualizar current_task.md + summaries
```

---

## Scripts que NO usar (humanos o CI)

| Script | Uso | Problema |
|--------|-----|----------|
| `npm test` | Legacy | Solo corre vitest, sin playwright |
| `npm run test:e2e` | Manual | Reconstruye el servidor sin cache, muy lento |
| `npm run test:e2e:setup` | Legacy | Script de setup antiguo, no usado por agente |

---

## Scripts de seed (para E2E)

```bash
# Antes de correr E2E, asegurar datos:
curl -X POST http://localhost:3002/api/debug/seed-e2e \
  -H "Content-Type: application/json" \
  -d '{"tenantSlug": "wondernails"}'
```

---

## Métricas de ciclo objetivo

| Métrica | Target | Actual (2026-04-28) |
|---------|--------|---------------------|
| Build rápido | < 3 min | ✅ ~2 min |
| Tests unitarios | < 30s | ✅ ~15s |
| Tests E2E full | < 3 min | 🔄 ~2-5 min (con cache) |
| Pipeline completo (`validate`) | < 8 min | 🔄 ~5-8 min |

---

*Actualizado por Feature Developer Agent — 2026-04-28*

# Pasos de prueba — STRY-017 (rendimiento + seguridad)

> **Fuente de verdad** para QA de esta épica: el agente ejecuta según fases activas en `plan.md`. Donde no haya UI, el “UAT” es verificación técnica + regresión E2E de tenants críticos.

**Grep E2E sugerido:** `STRY-017` (crear tag en specs cuando existan pruebas dedicadas).

## Tenants de regresión (mínimo)

| Slug               |
| ------------------ |
| `wondernails`      |
| `centro-tenistico` |

Credencial estándar: `jagzao@gmail.com` / `admin`.

---

## Fase 0 — Investigación (sin automatizar todo; checklist humano/agente)

| Paso | Acción                                                                                | Esperado                                   |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| I1   | `npm run build` + `lint` + `typecheck`                                                | Sin errores                                |
| I2   | Levantar app; navegar `/t/{slug}/login`, `/book`, `/pos`, `/contact` en ambos tenants | Sin 500; header coherente                  |
| I3   | Revisar logs consola/servidor en esas rutas                                           | Sin secretos; sin fugas datos cross-tenant |
| I4   | Documentar en `implementacion.md` tabla de hallazgos                                  | Filas H-00x                                |

---

## Fases 1+ — Regresión por entrega

Tras **cada** PR del programa:

| Paso | Acción                                                                               | Esperado                     |
| ---- | ------------------------------------------------------------------------------------ | ---------------------------- | ----- |
| R1   | `npm run test:e2e:subset -- --grep "STRY-001                                         | tenant"` (o suite acordada)  | Verde |
| R2   | Si el PR tocó middleware o auth: probar login + API POS/terminals con y sin sesión   | Comportamiento documentado   |
| R3   | Si el PR tocó caché: verificar datos actualizados tras mutación admin (manual o E2E) | Sin datos obsoletos críticos |

---

## Seguridad (smoke repetible)

| Paso | Acción                                          | Esperado                                    |
| ---- | ----------------------------------------------- | ------------------------------------------- |
| S1   | Petición `POST` mutación sin CSRF donde aplique | Rechazo según política                      |
| S2   | `GET /api/...` sensible sin cookie              | 401/403 según contrato                      |
| S3   | `npm audit --production` (o pipeline CI)        | Sin high/critical sin excepción documentada |

---

## Obligación del agente (antes de visto bueno por fase)

- [ ] Hallazgos y baseline en `implementacion.md`
- [ ] Regresión mínima en dos tenants para cambios que afecten layout/auth/API
- [ ] Playwright headless + headed según `AGENTS.md` si hubo cambio de flujo usuario

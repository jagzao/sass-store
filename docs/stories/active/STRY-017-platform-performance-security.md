# Story: STRY-017 — Plataforma: rendimiento y seguridad (programa transversal)

> **ID:** STRY-017  
> **Estado:** analysis  
> **Prioridad:** P0  
> **Sprint:** S1  
> **Asignado:** Architect → Dev → QA  
> **Creado:** 2026-05-03  
> **Actualizado:** 2026-05-03

**Artefactos de sprint:** `.agents/sprint/STRY-017-platform-perf-sec/` (`plan.md`, `implementacion.md`, `testing-usuario.md`).

---

## 1. Narrativa

Como **responsable de plataforma**, quiero **un programa de optimización integral (rendimiento + seguridad) con inventario medible y entregas por fases**, para que **el sistema escale en Vercel/Supabase con menor latencia, menor coste de infraestructura y superficie de ataque reducida**, sin degradar el aislamiento multitenancy.

### Contexto

- La app es Next.js (App Router) + Drizzle sobre **Postgres (Supabase)** + caché opcional **Upstash**; parte de la carga se repite por request (tenant, layout, APIs sin `/t/…`).
- Existen ítems de backlog/deuda (**BUG-001…004**, **TECH-001…007**) que intersectan con rendimiento y seguridad.
- Esta US es **épica transversal**: la primera entrega debe ser **investigación + baseline + plan priorizado**; las siguientes fases implementan cambios concretos bajo el mismo ID o stories hijas referenciadas aquí.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Inventario y baseline (obligatorio en Fase 0)

```gherkin
Dado que el repositorio sass-store está clonado y la app puede levantarse en entorno de test
Cuando el equipo completa la Fase 0 del plan en plan.md
Entonces existe un documento de hallazgos con áreas (DB, API, RSC, caché, middleware, auth, dependencias, secretos)
Y existen métricas baseline documentadas (TTFB/LCP objetivo o checklist Lighthouse, queries calientes, logs de error)
Y cada hallazgo tiene severidad (P0/P1/P2) y propuesta de remedio o spike
```

### CA-2: Rendimiento — entregas priorizadas

```gherkin
Dado el inventario de CA-1
Cuando se implementa al menos el paquete P0 acordado en plan.md (p. ej. conexión pooler, deduplicación lecturas tenant, invalidación caché, reducción N+1)
Entonces los criterios de éxito numéricos de la sección 8 mejoran o se cumplen en entorno de referencia
Y no se introduce regresión en aislamiento por tenant (RLS / contexto tenant en queries)
```

### CA-3: Seguridad — entregas priorizadas

```gherkin
Dado el inventario de CA-1
Cuando se implementa al menos el paquete P0 de seguridad (headers, saneamiento errores API, auditoría dependencias, revisión cookies/auth)
Entonces no hay secretos en logs ni en respuestas de error orientadas al cliente
Y las rutas mutantes siguen protegidas según política actual (CSRF / validación de tenant)
```

### CA-4: Verificación automatizada y UAT

```gherkin
Dado que existen cambios mergeados en el alcance de la fase
Cuando el agente ejecuta testing-usuario.md y la suite E2E/tag acordado
Entonces todos los escenarios definidos para esa fase pasan en headless
Y se ejecuta validación headed según AGENTS.md para rutas o flujos tocados
```

### CA-5: Manejo de errores y transparencia

```gherkin
Dado una condición de fallo en una optimización (p. ej. Redis no disponible)
Cuando el código recupera o degrada de forma controlada
Entonces el usuario final no ve stack traces ni datos de otros tenants
Y el error queda tipado o registrado según Result Pattern / logging del repo
```

---

## 3. Mockups / Wireframes

- [x] No aplica (plataforma / no UI principal salvo dashboards de métricas opcionales en fases posteriores)

---

## 4. Contrato técnico (programa, no un solo endpoint)

### Entregables obligatorios

| Entregable           | Formato                                                   |
| -------------------- | --------------------------------------------------------- |
| Fase 0 — Discovery   | `plan.md` + tabla en `implementacion.md`                  |
| Baseline rendimiento | Tiempos documentados o Lighthouse CI / Web Vitals muestra |
| Baseline seguridad   | Lista de checks (OWASP ASVS lite, npm audit, headers)     |
| Fases 1+             | PRs pequeños con Result Pattern donde toque código nuevo  |

### DomainError / Result

- Cualquier **nueva** API o servicio tocado en el alcance debe usar `Result<T, DomainError>` y `withResultHandler` donde aplique (`AGENTS.md`).
- Refactor masivo de legacy try/catch queda acotado por fase; referencia **TECH-001**.

---

## 5. Impacto Multitenancy

- [x] Modifica queries existentes (potencial, por optimización)
- [x] Revisión RLS / `withTenantContext` obligatoria en cada cambio de datos
- [ ] Nueva tabla (solo si el plan lo exige)
- [x] **Tenants de prueba E2E:** `wondernails`, `centro-tenistico` (credencial estándar repo)

---

## 6. Plan de Implementación (resumen; detalle en `.agents/sprint/…/plan.md`)

### Fase 0: Investigación (esta US lo inicia)

- [ ] Mapa de rutas críticas: `apps/web/app`, `middleware.ts`, `lib/db`, `lib/cache`, APIs `/api/**`
- [ ] Inventario de llamadas duplicadas a tenant (layout + page + metadata)
- [ ] Revisión `DATABASE_URL` (pooler Supabase vs directo) y límites serverless
- [ ] Revisión variables Upstash / Redis y TTL + **estrategia de invalidación**
- [ ] Alineación con **BUG-001…004** y **TECH-001…007**

### Fase 1+: Según priorización en `plan.md` (ejemplos)

- [ ] Caché y deduplicación (RSC `React.cache`, Redis, tags revalidate)
- [ ] Middleware / resolución tenant en APIs (`Unknown host`, `x-tenant`)
- [ ] Seguridad: headers (`next.config`), dependencias, filtrado de errores
- [ ] Tests: unit + E2E por flujo tocado

### Fase UAT + E2E

- [ ] `.agents/sprint/STRY-017-platform-perf-sec/testing-usuario.md`
- [ ] Playwright (grep/tag `STRY-017` o nombre acordado)

---

## 7. Checklist de Calidad

- [ ] `npm run build`, `lint`, `typecheck` verdes en cada PR del programa
- [ ] Sin regresión multitenancy (revisión explícita en PR)
- [ ] Result Pattern en código nuevo o migrado en el alcance de cada PR
- [ ] **§ 1.3 / § 1.4** `AGENTS.md` para la fase que toque UI o flujos críticos
- [ ] **Visto bueno del dueño** antes de marcar `done` la fase épica o sub-entregas acordadas

---

## 8. Métricas de Éxito

| Métrica                                   | Target (ajustar tras baseline)                       | Actual |
| ----------------------------------------- | ---------------------------------------------------- | ------ |
| Documento Fase 0 en repo                  | 100% secciones llenas                                | —      |
| Hallazgos P0 cerrados o con spike fechado | ≥ 80% en ventana del sprint                          | —      |
| TTFB página tenant representativa (p95)   | Mejora ≥ 20% vs baseline o &lt; 800ms p95 en preview | —      |
| Lighthouse Performance (home tenant test) | ≥ 85 en preview                                      | —      |
| npm audit (high/critical)                 | 0 sin justificación documentada                      | —      |
| Cobertura tests nuevos por módulo tocado  | ≥ 70% en archivos nuevos/modificados críticos        | —      |

---

## 9. Notas y Riesgos

- **Riesgo:** “Optimización total” sin límites diluye el sprint — **acotar cada PR** a un hallazgo o familia (caché, DB, middleware).
- **Riesgo:** Caché agresiva sin invalidación → datos cruzados entre tenants — **keys siempre con `tenant_id` o slug** y revisión de código.
- **Dependencia:** Acceso a proyecto Supabase (planes, índices) y Vercel (env, Analytics).
- **Orquestación:** Tras Fase 0, el PM/Architect puede **partir** trabajo en stories hijas (STRY-018+) enlazadas desde `plan.md` si el alcance crece.

---

**Orquestador:** `Implementa STRY-017` o flujo story del repo → PM → Architect → Dev → QA → visto bueno → `done` / subdividir.

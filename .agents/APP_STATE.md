# Application State Mapping (memoria viva)

> **Propósito:** reducir regresiones y “re-fixes” contradictorios cuando varios agentes o sesiones ven diffs parciales. Este archivo describe **qué es verdadero hoy** en el producto (runtime, rutas críticas, trampas) y **qué no volver a romper**.  
> **No sustituye:** `AGENTS.md` / `CLAUDE.md` (normas), `.agents/sprint/*/plan.md` (alcance por US), ni `.agents/memory/*` (contratos DTO). **Se complementan.**

**Última revisión significativa:** 2026-05-05 (creación + primera carga de memoria anti-regresión desde `history/debug_logs.md`)

---

## Cómo usar este archivo (agentes)

1. **Al iniciar una tarea con código:** leer este archivo + `session/current_task.md` + el `plan.md` / `testing-usuario.md` de la STRY en curso.
2. **Antes de revertir o re-aplicar un patrón “como antes”:** buscar aquí la sección **Invariantes** y **Anti-patrones / bugs recurrentes**. Si el diff actual contradice una entrada vigente, **parar** y alinear con la story o actualizar este doc tras decisión explícita.
3. **Al cerrar un incidente o bug recurrente:** añadir una fila breve en **Memoria anti-regresión** (síntoma → causa → fix canónico → archivos). Opcional: enlace a PR o commit.
4. **Si el estado real del producto cambia** (puertos, flujo de login, seed E2E): actualizar **Runtime y entorno** o **Mapa de superficies críticas** en el mismo PR que el cambio.

---

## Runtime y entorno (hechos operativos)

| Tema                          | Valor canónico               | Notas                                                  |
| ----------------------------- | ---------------------------- | ------------------------------------------------------ |
| App Next.js (monolito)        | `apps/web`                   | UI + API bajo `app/`                                   |
| Puerto desarrollo             | `3001`                       | `npm run dev`                                          |
| E2E / servidor de prueba      | `3002` típico                | Ver `scripts/start-e2e-server.js`, `playwright.config` |
| Credencial de prueba estándar | `jagzao@gmail.com` / `admin` | Multitenant; salvo US que defina otro rol              |
| Result Pattern                | Obligatorio en código nuevo  | `AGENTS.md`; evitar `try/catch` en negocio nuevo       |

---

## Mapa de superficies críticas (alto impacto)

Rutas o módulos donde un cambio suele romper varios flujos. Ampliar cuando una US toque una zona nueva de forma estable.

| Área          | Rutas / ubicación                           | Riesgo típico                                                                    |
| ------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Tenants       | `apps/web/app/t/[tenant]/`                  | Aislamiento por slug, estilos por tenant                                         |
| API           | `apps/web/app/api/**`                       | Contrato Zod, `withResultHandler`, fugas entre tenants                           |
| Auth / sesión | (según implementación actual en `apps/web`) | Cookies, redirects, roles                                                        |
| POS / caja    | (si aplica al entorno)                      | Transacciones, idempotencia                                                      |
| Seeds / E2E   | `apps/web/app/api/debug/**`, seeds          | Solo entornos no productivos; no exponer en prod                                 |
| RLS (DB)      | tablas tenant-scoped (p. ej. `campaigns`)   | Políticas sin `tenant_id` efectivo → fuga entre tenants; ver **REG-20251230-01** |

_Los slugs de tenant activos para QA están en los `testing-usuario.md` de cada STRY y en seeds; no duplicar listas largas aquí salvo acuerdo de equipo._

---

## Invariantes del producto (no romper sin AC explícito)

- Multitenancy: datos y rutas deben respetar el **tenant** activo; no mezclar IDs entre tenants.
- Errores tipados hacia API/cliente; no filtrar stack ni datos internos.
- Tras cambios de UI/flujo relevantes: pipeline **headed → headless** Playwright en el alcance de la US (`CLAUDE.md` / `AGENTS.md`).

---

## Anti-patrones / bugs recurrentes (memoria corta)

Plantilla para nuevas entradas:

```text
- ID: REG-YYYYMMDD-XX
  Síntoma: …
  Causa raíz: …
  Fix canónico: …
  Archivos / rutas: …
```

### Registro

- **ID:** REG-20251230-01  
  **Síntoma:** Datos de `campaigns` visibles o mutables cruzando tenant; políticas RLS demasiado permisivas.  
  **Causa raíz:** Políticas que no amarraban filas al `tenant_id` del contexto (p. ej. condiciones demasiado amplias).  
  **Fix canónico:** RLS habilitada; políticas `SELECT`/`INSERT`/`UPDATE`/`DELETE` con `tenant_id` alineado al tenant de sesión (ver guía en repo).  
  **Archivos / rutas:** Tabla `campaigns` (migraciones / SQL); guía `PASOS_CORRECCION_RLS_CAMPAIGNS.md`.  
  **Evidencia:** commit `7dac743` (“docs: add step-by-step guide for fixing campaigns RLS”).  
  **Validación:** `npm run test:security -- --grep "campaigns"` (según bitácora).  
  **Detalle largo:** `.agents/history/debug_logs.md` § 2025-12-30.

- **ID:** REG-20251017-01  
  **Síntoma:** Drizzle Kit: “No schema files found” / config que no resuelve el schema.  
  **Causa raíz:** `drizzle.config.ts` desactualizado (API vieja `driver` / `connectionString`, rutas de schema incorrectas).  
  **Fix canónico:** `dialect: 'postgresql'`, `dbCredentials.url`, `schema` apuntando al archivo real del monorepo (p. ej. bajo `apps/web`).  
  **Archivos / rutas:** `drizzle.config.ts`; nota `DRIZZLE_CONFIG_FIX.md`.  
  **Validación:** `npm run db:generate` sin error.  
  **Detalle largo:** `.agents/history/debug_logs.md` § 2025-10-17 (Drizzle).

- **ID:** REG-20251017-02  
  **Síntoma:** `ERR_CONNECTION_REFUSED` en `localhost` (app o API no responde).  
  **Causa raíz:** Puerto ocupado, procesos Node colgados, caché `.next` / `.turbo` o `node_modules` inconsistente.  
  **Fix canónico:** Liberar puerto / matar procesos según SO; limpiar cachés; `npm install`; reiniciar dev; comprobar health.  
  **Archivos / rutas:** `TROUBLESHOOTING_CONNECTION_REFUSED.md`, scripts de limpieza si existen en repo.  
  **Validación:** petición a health/ping del servicio esperado (p. ej. `curl` a puerto doc en bitácora).  
  **Detalle largo:** `.agents/history/debug_logs.md` § 2025-10-17 (conexión).

---

## Cambios intencionales recientes (opcional, máx. ~10 líneas)

Breve “diario” para que un agente no interprete un diff como error. Rotar o archivar cuando deje de ser relevante.

| Fecha      | Qué cambió                                         | Dónde          | Nota                                                                                   |
| ---------- | -------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| 2026-05-05 | Creación de `APP_STATE.md`                         | `.agents/`     | Base para mapeo y anti-regresión                                                       |
| 2026-05-05 | Registro inicial REG-20251230-01 … REG-20251017-02 | `APP_STATE.md` | Resumen desde `debug_logs.md`; ampliar con nuevos incidentes en el mismo PR que el fix |

---

## Relación con otros artefactos

| Artefacto                         | Rol                                            |
| --------------------------------- | ---------------------------------------------- |
| `.agents/memory/*.md`             | Contratos, DTOs, patrones compartidos          |
| `.agents/session/current_task.md` | Tarea inmediata de la sesión                   |
| `.agents/history/debug_logs.md`   | Bitácora de depuración                         |
| `.agents/sprint/STRY-*/`          | Plan, implementación y pruebas **por entrega** |
| `docs/stories/`                   | Narrativa y AC oficiales de la US              |

---

## Mantenimiento

- **Dueño:** equipo / quien mergea la US; el agente que introduce un invariante nuevo o cierra un bug recurrente **debe** proponer actualización aquí en el mismo cambio cuando el conocimiento sea transversal (no solo nota en una STRY).
- Si dos fuentes contradicen, manda **`docs/stories/active/*` + código**; luego alinear este archivo.

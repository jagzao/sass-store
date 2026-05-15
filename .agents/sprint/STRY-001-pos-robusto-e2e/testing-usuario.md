# Pasos de prueba — STRY-001 (agente / Playwright)

> **Fuente de verdad** para QA automatizado y para la barrera **§ 1.3** de `AGENTS.md`: el **agente** **planifica** este documento a partir de la US y CA, **levanta** el proyecto, **resuelve** acceso (`jagzao@gmail.com`/`admin` por slug), ejecuta **todos** los escenarios **por cada tenant activo** con **Playwright CLI** (headed como exploración humana + headless en regresión), **corrige al vuelo** y **re-ejecuta** hasta **éxito total**. El **dueño no** repite esta batería: solo da **visto bueno** sobre lo ya verde (**§ 1.4**).

**Grep E2E:** `STRY-001` (coincide con `describe` en `tests/e2e/pos/stry-001-pos-multitenant.spec.ts`). **Plan robusto (crawl de enlaces):** `plan-robusto` \| `link-crawl` en `tests/e2e/crawl/internal-link-smoke.spec.ts` (ver `AGENTS.md` — Plan robusto de testing y `docs/TESTING_MASTER_PLAN.md` §13).

### Evidencia de ejecución (agente / CI)

Con servidor E2E de Playwright (`scripts/start-e2e-server.js`, puerto **3002**) y DB de test configurada en `.env.test`:

```powershell
$env:BASE_URL = "http://127.0.0.1:3002"
npx playwright test tests/e2e/pos/stry-001-pos-multitenant.spec.ts --project=chromium
# o filtro por historia:
npx playwright test --grep "STRY-001" --project=chromium
# validación “como persona” (ventana visible):
npx playwright test tests/e2e/pos/stry-001-pos-multitenant.spec.ts --project=chromium --headed
```

**Crawl acotado a los tenants de esta US** (BFS interno bajo `/t/{slug}/…`, sin 404 de documento ni errores de consola fuera de allowlist del spec):

```powershell
$env:BASE_URL = "http://127.0.0.1:3002"
$env:CRAWL_TENANTS = "wondernails,centro-tenistico"
$env:CRAWL_MAX_PAGES = "35"
npx playwright test tests/e2e/crawl/internal-link-smoke.spec.ts --project=chromium --grep "link-crawl|plan-robusto"
# mismo con ventana visible (exploración):
npx playwright test tests/e2e/crawl/internal-link-smoke.spec.ts --project=chromium --grep "link-crawl|plan-robusto" --headed
```

**Regresión STRY-001 + crawl (dos pasos en el mismo webServer 3002)**  
Playwright ordena por ruta de archivo: `tests/e2e/crawl/` va **antes** que `tests/e2e/pos/`; si se pasan ambos specs en un solo comando, el **crawl** puede ejecutarse primero y el **`seed-e2e`** del POS falla (500). Orden correcto:

```powershell
$env:BASE_URL = "http://127.0.0.1:3002"
$env:CRAWL_TENANTS = "wondernails,centro-tenistico"
$env:CRAWL_MAX_PAGES = "35"
# 1) POS + seed primero (`--workers=1` mantiene serial los tenants STRY-001)
npx playwright test tests/e2e/pos/stry-001-pos-multitenant.spec.ts --project=chromium --grep "STRY-001" --workers=1
# 2) Crawl después (reutiliza el servidor si `reuseExistingServer` aplica)
npx playwright test tests/e2e/crawl/internal-link-smoke.spec.ts --project=chromium --grep "link-crawl|plan-robusto" --workers=1
```

**Última corrida STRY-001 solo POS (incl. E1–E3 automatizados):** 2026-05-03 — **17 passed** (~56 s) con `npx playwright test tests/e2e/pos/stry-001-pos-multitenant.spec.ts --project=chromium --grep "STRY-001"`.

**Regresión STRY-001 + crawl (dos pasos):** no uses un solo `npx playwright test … file1 file2` (orden alfabético de rutas ejecuta crawl antes y rompe `seed-e2e`). Ejecuta los **dos comandos** de la sección anterior y pega aquí el resumen (`X passed` + `Y passed`) cuando CI/local esté con `apps/web/.next` o tras la primera compilación del webServer E2E (~5 min).

**Evidencia de ejecución 2026-05-04 (local):** STRY-001: **14 passed, 0 failed** (reintento tras reinicio del servidor E2E; el fallo previo `net::ERR_CONNECTION_REFUSED` en `centro-tenistico` fue **ambiental**, no de código). Crawl: **5 passed** (confirmar en la misma sesión de shell `CRAWL_TENANTS=wondernails,centro-tenistico` si el alcance debe ser solo esos dos slugs; si no, el spec usa tenants por defecto → 5 tests = meta + cuatro tenants).

Contra `npm run dev` en **3001**: `$env:BASE_URL = "http://127.0.0.1:3001"` y los mismos `npx playwright test …` (no dupliques el webServer de Playwright si el dev ya está arriba).

---

## Rutas canónicas (App Router)

Todas bajo prefijo **`/t/{slug}/…`**. Sustituir `{slug}` por `wondernails` o `centro-tenistico`.

| Ruta              | Uso                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/t/{slug}/login` | Login de tenant (form email/contraseña + OAuth Google). **Siempre** usar esta URL en escenarios A/D, no solo “landing”.                       |
| `/t/{slug}/book`  | Reservas / catálogo de servicios (`ServicesClient`: grid de servicios **o** mensaje si no hay servicios). Público (no exige sesión para ver). |
| `/t/{slug}/pos`   | Punto de venta; sin sesión → redirección a `/t/{slug}/login`.                                                                                 |

---

## Tenants activos (lista canónica — repetir A, B y D en cada uno)

Los escenarios **A**, **B** y **D** deben ejecutarse **por separado** en **cada** fila. Si se agrega un tenant activo al producto, actualizar esta tabla y ampliar E2E.

| #   | Slug (`/t/{slug}/…`) |
| --- | -------------------- |
| 1   | `wondernails`        |
| 2   | `centro-tenistico`   |

**Base URL:** en CI / `npm run test:e2e` con webServer: `http://127.0.0.1:3002` (ver `.env.test`). Contra dev local: `http://127.0.0.1:3001`.

---

## Credencial estándar (todos los tenants)

| Campo    | Valor                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Email    | `jagzao@gmail.com`                                                                                                                        |
| Password | `admin`                                                                                                                                   |
| Uso      | Misma credencial en **cada** tenant de la tabla anterior; si falla en uno, corregir seed/roles **para ese slug** hasta login y flujos OK. |

**Selectores UI (login):** `data-testid="email-input"`, `input[type="password"]`, `data-testid="login-btn"` (usar `.first()` si hay duplicados por hidratación).

---

## Precondiciones (agente) — una vez por entorno

| #   | Condición                                                                       | Si falla, el agente debe…                                                                       |
| --- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | App responde (dev o servidor E2E)                                               | Arreglar arranque (`npm run dev`, `scripts/start-e2e-server.js`, `.env`, puerto 3001/3002, DB). |
| 2   | Para **cada** slug: `GET` o navegación a `/t/{slug}/login` carga formulario     | Middleware/tenant slug; seeds de tenant.                                                        |
| 3   | Para **cada** slug: login `jagzao@gmail.com` / `admin` en **`/t/{slug}/login`** | Seed, usuario o permisos **por tenant** hasta login OK en los dos.                              |
| 4   | Para **cada** slug: datos POS mínimos                                           | Seed `/api/debug/seed-e2e` con `{ tenantSlug }` hasta terminales/venta ejecutables.             |

---

## Escenario D — Navegación y rutas críticas (por tenant)

Comprueba que las URLs documentadas existen y que el flujo humano **login → book → pos** no rompe (regresión fuera del solo API de terminales).

### Tenant `{slug}` — Escenario D

| Paso | URL / acción                                                     | Resultado esperado                                                                                                                                       | Notas Playwright                                                                                          |
| ---- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| D0   | `GET` o navegar **`/t/{slug}/login`**                            | HTTP 200; título o `h2` con nombre del tenant; campos email y contraseña visibles                                                                        | `page.goto`, `getByTestId("email-input")`, **sin** esperar 30s+ en TTFB (login usa carga ligera por slug) |
| D1   | Sin sesión: navegar **`/t/{slug}/book`**                         | 200; URL termina en `/book`; contenido **o** grid de servicios (precio/duración “min”) **o** texto “no ofrece servicios de reserva” / enlace a productos | Cubre tenant con/sin servicios                                                                            |
| D2   | En **`/t/{slug}/login`**, iniciar sesión con credencial estándar | Redirección fuera de `/login` (home u otra ruta del tenant)                                                                                              | `waitForURL` sin `/login`                                                                                 |
| D3   | Tras D2, navegar **`/t/{slug}/book`**                            | Misma expectativa que D1; sin error 500 ni pantalla en blanco                                                                                            | Sesión activa                                                                                             |
| D4   | Tras D3, navegar **`/t/{slug}/pos`**                             | “Punto de Venta” (heading) tras cargar; no bucle infinito en “Cargando…”                                                                                 | Alineado con escenario A POS                                                                              |

**Checklist agente:** [ ] `wondernails` D0–D4 verdes · [ ] `centro-tenistico` D0–D4 verdes

---

## Rendimiento (criterio mínimo STRY-001)

| #   | Qué medir                                            | Criterio                                                                   | Si falla                                                                                                                                    |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Primera carga documento **`/t/{slug}/login`** (frío) | Formulario usable **≤ 15 s** en entorno E2E local (3002) con DB de test    | Evitar doble carga pesada en RSC (p. ej. `getTenantDataForPage` + `resolveTenant` en login); revisar queries `getTenantBySlug` / middleware |
| P2  | Navegación D2→D3→D4                                  | Sin timeouts de red repetidos ni logs de “Unknown host” que bloqueen la UI | Revisar `BASE_URL`, `127.0.0.1` vs `localhost`, seeds                                                                                       |

_(Los umbrales son orientativos para CI; si el agente documenta hardware lento, anotar en `implementacion.md` y subir timeout solo en spec con justificación.)_

---

## Por cada tenant: escenario A — CA-1 Terminales POS

Repetir el bloque completo sustituyendo `{slug}` por `wondernails` y luego por `centro-tenistico`.

### Tenant `{slug}` — Escenario A

| Paso | Acción                                                                              | Resultado esperado                                    | Notas Playwright                            |
| ---- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| A1   | Ir explícitamente a **`/t/{slug}/login`**                                           | Formulario login visible (`email-input`)              | `page.goto(\`/t/${slug}/login\`)`           |
| A2   | Ingresar `jagzao@gmail.com` / `admin` e iniciar sesión                              | Sesión activa (URL sin `/login`)                      |                                             |
| A3   | Navegar a **`/t/{slug}/pos`** (o equivalente en doc de producto)                    | UI “Punto de Venta” estable                           | Ver D4                                      |
| A4   | `GET /api/finance/pos/terminals?tenant=…` con cookies de sesión **de ese** `{slug}` | `200`, JSON coherente; **sin** datos de otros tenants | `page.request.get` con contexto autenticado |

**Checklist agente:** [ ] `wondernails` A1–A4 verdes · [ ] `centro-tenistico` A1–A4 verdes

---

## Por cada tenant: escenario B — CA-2 Flujo principal de venta POS

### Tenant `{slug}` — Escenario B

| Paso | Acción                                                                                                      | Resultado esperado                                         | Notas Playwright                |
| ---- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------- |
| B1   | Con sesión del Escenario A del **mismo** `{slug}`, abrir **`/t/{slug}/pos`**                                | Pantalla POS accesible; productos o estado vacío coherente |                                 |
| B2   | Completar flujo mínimo de venta (UI o `POST /api/finance/pos/sales` con payload válido **para ese tenant**) | Éxito persistido solo bajo ese tenant                      | Repetir implementación por slug |

**Checklist agente:** [ ] `wondernails` B1–B2 verdes · [ ] `centro-tenistico` B1–B2 verdes

---

## Escenario C — CA-3 Errores / permisos (global, una ejecución basta)

| Paso | Acción                                                            | Resultado esperado                                | Notas Playwright                                                |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| C1   | `GET /api/finance/pos/terminals` sin cookie o con tenant inválido | 401/403/422 según contrato; sin fuga cross-tenant | `expect` sobre status                                           |
| C2   | (Opcional) Usuario sin rol finanzas                               | Error tipado / UX                                 | Si no hay usuario en seed, documentar “omitido” + cubrir con UT |

---

## Escenario E — Plan robusto: negative smoke (por tenant)

Complementa C con rutas UI. Repetir **E1–E3** en **wondernails** y **centro-tenistico** (mismo `BASE_URL` que el resto).

| Paso | Acción                                                                                              | Resultado esperado                                                                                                                                       | Notas Playwright / manual                                               |
| ---- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| E1   | Navegar **`/t/{slug}/login`** con credenciales **incorrectas** (email válido, password erróneo)     | Mensaje de error o permanencia en login; **no** 500; **no** sesión establecida (reintento a `/pos` sigue pidiendo login)                                 | Playwright: `E1: wrong password…` en `stry-001-pos-multitenant.spec.ts` |
| E2   | Sin sesión: **`/t/{slug}/pos`**                                                                     | Redirección a **`/t/{slug}/login`** (o URL que contenga `login`)                                                                                         | Playwright: `E2 / A: redirect to login…` mismo archivo                  |
| E3   | Con sesión de **{slug}**, llamar `GET /api/finance/pos/terminals?tenant={otro-slug}` (misma cookie) | **403** si el rol no puede cruzar tenants; si **200** (p. ej. admin), el JSON **no** debe mezclar IDs de terminales del tenant “propio” con los del otro | Playwright: `stry-001-pos-multitenant.spec.ts` — `E3: terminals API`    |

**Checklist agente:** [ ] `wondernails` E1–E3 · [ ] `centro-tenistico` E1–E3 (o documentar bloqueo + issue).

---

## Escenario F — Plan robusto: crawl de enlaces internos (por tenant)

Objetivo: detectar **404 de documento**, **error boundaries** y **consola** grave en rutas descubiertas bajo `/t/{slug}/…` (ver `tests/e2e/crawl/crawl-helpers.ts`). **Solo** los slugs de esta US.

| Paso | Acción                                                                                | Resultado esperado                                             | Evidencia                                     |
| ---- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| F1   | Ejecutar spec de crawl con `CRAWL_TENANTS=wondernails,centro-tenistico`               | Test **link-crawl storefront — {slug}** en verde por cada slug | Comando en bloque “Evidencia” arriba          |
| F2   | Si el crawl falla: anotar **URL** y motivo; corregir enlace o ruta o ajustar producto | Re-ejecutar F1 hasta verde                                     | Nota breve en `implementacion.md` si hubo fix |

**Checklist agente:** [ ] Crawl verde para **wondernails** · [ ] Crawl verde para **centro-tenistico**

---

## Obligación del agente (checklist antes de pedir validación al dueño)

- [ ] **wondernails:** escenarios A, B y **D** **todos** verdes (manual o Playwright).
- [ ] **centro-tenistico:** escenarios A, B y **D** **todos** verdes.
- [ ] **Escenario C** verde (o omitido C2 con justificación + UT).
- [ ] **Escenario E** (negative smoke): E1–E3 **automatizados** en `tests/e2e/pos/stry-001-pos-multitenant.spec.ts` — verdes en **ambos** slugs (`--grep STRY-001`).
- [ ] **Escenario F** (crawl): comando crawl con `CRAWL_TENANTS=wondernails,centro-tenistico` en verde (`plan-robusto` / `link-crawl`).
- [ ] **P1/P2** revisados: login y navegación D sin timeouts anómalos; si hay deuda, ticket o nota en `implementacion.md`.
- [ ] Cualquier fallo en un tenant → **fix** → **re-ejecutar A+B+D en los dos** slugs afectados hasta verde.
- [ ] Playwright headless con grep `STRY-001` (o tag acordado) en verde **incluyendo ambos tenants** en la suite.
- [ ] Solo entonces: mensaje al dueño “**lista para visto bueno**” con evidencia Playwright/UT y resumen por tenant (**no** pedirle QA completa desde cero).

---

**Al estabilizar escenarios:** en `tests/e2e/*stry-001*.spec.ts`, parametrizar por `['wondernails','centro-tenistico']` y comentar número de paso (A1, D3, …) para trazabilidad 1:1 con esta tabla.

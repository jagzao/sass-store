# Pasos de prueba — STRY-001 (agente / Playwright)

> **Fuente de verdad** para QA automatizado y para la barrera **§ 1.3** de `AGENTS.md`: el **agente** **planifica** este documento a partir de la US y CA, **levanta** el proyecto, **resuelve** acceso (`jagzao@gmail.com`/`admin` por slug), ejecuta **todos** los escenarios **por cada tenant activo** con **Playwright CLI** (headed como exploración humana + headless en regresión), **corrige al vuelo** y **re-ejecuta** hasta **éxito total**. El **dueño no** repite esta batería: solo da **visto bueno** sobre lo ya verde (**§ 1.4**).

**Grep E2E:** `STRY-001` (coincide con `describe` en `tests/e2e/pos/stry-001-pos-multitenant.spec.ts`).

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

Contra `npm run dev` en **3001**: `$env:BASE_URL = "http://127.0.0.1:3001"` y los mismos `npx playwright test …` (no dupliques el webServer de Playwright si el dev ya está arriba).

---

## Rutas canónicas (App Router)

Todas bajo prefijo **`/t/{slug}/…`**. Sustituir `{slug}` por `wondernails` o `centro-tenistico`.

| Ruta | Uso |
|------|-----|
| `/t/{slug}/login` | Login de tenant (form email/contraseña + OAuth Google). **Siempre** usar esta URL en escenarios A/D, no solo “landing”. |
| `/t/{slug}/book` | Reservas / catálogo de servicios (`ServicesClient`: grid de servicios **o** mensaje si no hay servicios). Público (no exige sesión para ver). |
| `/t/{slug}/pos` | Punto de venta; sin sesión → redirección a `/t/{slug}/login`. |

---

## Tenants activos (lista canónica — repetir A, B y D en cada uno)

Los escenarios **A**, **B** y **D** deben ejecutarse **por separado** en **cada** fila. Si se agrega un tenant activo al producto, actualizar esta tabla y ampliar E2E.

| # | Slug (`/t/{slug}/…`) |
|---|----------------------|
| 1 | `wondernails` |
| 2 | `centro-tenistico` |

**Base URL:** en CI / `npm run test:e2e` con webServer: `http://127.0.0.1:3002` (ver `.env.test`). Contra dev local: `http://127.0.0.1:3001`.

---

## Credencial estándar (todos los tenants)

| Campo | Valor |
|--------|--------|
| Email | `jagzao@gmail.com` |
| Password | `admin` |
| Uso | Misma credencial en **cada** tenant de la tabla anterior; si falla en uno, corregir seed/roles **para ese slug** hasta login y flujos OK. |

**Selectores UI (login):** `data-testid="email-input"`, `input[type="password"]`, `data-testid="login-btn"` (usar `.first()` si hay duplicados por hidratación).

---

## Precondiciones (agente) — una vez por entorno

| # | Condición | Si falla, el agente debe… |
|---|-------------|---------------------------|
| 1 | App responde (dev o servidor E2E) | Arreglar arranque (`npm run dev`, `scripts/start-e2e-server.js`, `.env`, puerto 3001/3002, DB). |
| 2 | Para **cada** slug: `GET` o navegación a `/t/{slug}/login` carga formulario | Middleware/tenant slug; seeds de tenant. |
| 3 | Para **cada** slug: login `jagzao@gmail.com` / `admin` en **`/t/{slug}/login`** | Seed, usuario o permisos **por tenant** hasta login OK en los dos. |
| 4 | Para **cada** slug: datos POS mínimos | Seed `/api/debug/seed-e2e` con `{ tenantSlug }` hasta terminales/venta ejecutables. |

---

## Escenario D — Navegación y rutas críticas (por tenant)

Comprueba que las URLs documentadas existen y que el flujo humano **login → book → pos** no rompe (regresión fuera del solo API de terminales).

### Tenant `{slug}` — Escenario D

| Paso | URL / acción | Resultado esperado | Notas Playwright |
|------|----------------|--------------------|------------------|
| D0 | `GET` o navegar **`/t/{slug}/login`** | HTTP 200; título o `h2` con nombre del tenant; campos email y contraseña visibles | `page.goto`, `getByTestId("email-input")`, **sin** esperar 30s+ en TTFB (login usa carga ligera por slug) |
| D1 | Sin sesión: navegar **`/t/{slug}/book`** | 200; URL termina en `/book`; contenido **o** grid de servicios (precio/duración “min”) **o** texto “no ofrece servicios de reserva” / enlace a productos | Cubre tenant con/sin servicios |
| D2 | En **`/t/{slug}/login`**, iniciar sesión con credencial estándar | Redirección fuera de `/login` (home u otra ruta del tenant) | `waitForURL` sin `/login` |
| D3 | Tras D2, navegar **`/t/{slug}/book`** | Misma expectativa que D1; sin error 500 ni pantalla en blanco | Sesión activa |
| D4 | Tras D3, navegar **`/t/{slug}/pos`** | “Punto de Venta” (heading) tras cargar; no bucle infinito en “Cargando…” | Alineado con escenario A POS |

**Checklist agente:** [ ] `wondernails` D0–D4 verdes · [ ] `centro-tenistico` D0–D4 verdes

---

## Rendimiento (criterio mínimo STRY-001)

| # | Qué medir | Criterio | Si falla |
|---|-----------|----------|----------|
| P1 | Primera carga documento **`/t/{slug}/login`** (frío) | Formulario usable **≤ 15 s** en entorno E2E local (3002) con DB de test | Evitar doble carga pesada en RSC (p. ej. `getTenantDataForPage` + `resolveTenant` en login); revisar queries `getTenantBySlug` / middleware |
| P2 | Navegación D2→D3→D4 | Sin timeouts de red repetidos ni logs de “Unknown host” que bloqueen la UI | Revisar `BASE_URL`, `127.0.0.1` vs `localhost`, seeds |

*(Los umbrales son orientativos para CI; si el agente documenta hardware lento, anotar en `implementacion.md` y subir timeout solo en spec con justificación.)*

---

## Por cada tenant: escenario A — CA-1 Terminales POS

Repetir el bloque completo sustituyendo `{slug}` por `wondernails` y luego por `centro-tenistico`.

### Tenant `{slug}` — Escenario A

| Paso | Acción | Resultado esperado | Notas Playwright |
|------|--------|--------------------|------------------|
| A1 | Ir explícitamente a **`/t/{slug}/login`** | Formulario login visible (`email-input`) | `page.goto(\`/t/${slug}/login\`)` |
| A2 | Ingresar `jagzao@gmail.com` / `admin` e iniciar sesión | Sesión activa (URL sin `/login`) | |
| A3 | Navegar a **`/t/{slug}/pos`** (o equivalente en doc de producto) | UI “Punto de Venta” estable | Ver D4 |
| A4 | `GET /api/finance/pos/terminals?tenant=…` con cookies de sesión **de ese** `{slug}` | `200`, JSON coherente; **sin** datos de otros tenants | `page.request.get` con contexto autenticado |

**Checklist agente:** [ ] `wondernails` A1–A4 verdes · [ ] `centro-tenistico` A1–A4 verdes

---

## Por cada tenant: escenario B — CA-2 Flujo principal de venta POS

### Tenant `{slug}` — Escenario B

| Paso | Acción | Resultado esperado | Notas Playwright |
|------|--------|--------------------|------------------|
| B1 | Con sesión del Escenario A del **mismo** `{slug}`, abrir **`/t/{slug}/pos`** | Pantalla POS accesible; productos o estado vacío coherente | |
| B2 | Completar flujo mínimo de venta (UI o `POST /api/finance/pos/sales` con payload válido **para ese tenant**) | Éxito persistido solo bajo ese tenant | Repetir implementación por slug |

**Checklist agente:** [ ] `wondernails` B1–B2 verdes · [ ] `centro-tenistico` B1–B2 verdes

---

## Escenario C — CA-3 Errores / permisos (global, una ejecución basta)

| Paso | Acción | Resultado esperado | Notas Playwright |
|------|--------|--------------------|------------------|
| C1 | `GET /api/finance/pos/terminals` sin cookie o con tenant inválido | 401/403/422 según contrato; sin fuga cross-tenant | `expect` sobre status |
| C2 | (Opcional) Usuario sin rol finanzas | Error tipado / UX | Si no hay usuario en seed, documentar “omitido” + cubrir con UT |

---

## Obligación del agente (checklist antes de pedir validación al dueño)

- [ ] **wondernails:** escenarios A, B y **D** **todos** verdes (manual o Playwright).
- [ ] **centro-tenistico:** escenarios A, B y **D** **todos** verdes.
- [ ] **Escenario C** verde (o omitido C2 con justificación + UT).
- [ ] **P1/P2** revisados: login y navegación D sin timeouts anómalos; si hay deuda, ticket o nota en `implementacion.md`.
- [ ] Cualquier fallo en un tenant → **fix** → **re-ejecutar A+B+D en los dos** slugs afectados hasta verde.
- [ ] Playwright headless con grep `STRY-001` (o tag acordado) en verde **incluyendo ambos tenants** en la suite.
- [ ] Solo entonces: mensaje al dueño “**lista para visto bueno**” con evidencia Playwright/UT y resumen por tenant (**no** pedirle QA completa desde cero).

---

**Al estabilizar escenarios:** en `tests/e2e/*stry-001*.spec.ts`, parametrizar por `['wondernails','centro-tenistico']` y comentar número de paso (A1, D3, …) para trazabilidad 1:1 con esta tabla.

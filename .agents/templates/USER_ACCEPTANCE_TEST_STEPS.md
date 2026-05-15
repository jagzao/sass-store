# testing-usuario — STRY-XXX [Nombre corto de la US]

> **Fuente de verdad** para QA automatizado: el **agente** planifica este documento a partir de la US y AC, levanta el servidor, ejecuta todos los escenarios por cada tenant activo con **Playwright CLI** (headed como exploración humana + headless en regresión), corrige al vuelo y re-ejecuta hasta éxito total. El **dueño no** repite esta batería: solo da **visto bueno** sobre lo ya verde.

**Grep E2E:** `STRY-XXX` (coincide con el tag `@stry-xxx` en `describe` del spec).  
**Spec:** `tests/e2e/[módulo]/stry-xxx-[nombre].spec.ts`

---

## Evidencia de ejecución (llenar tras cada corrida)

```powershell
# Dev local (puerto 3001)
$env:BASE_URL = "http://127.0.0.1:3001"
npx playwright test --grep "STRY-XXX" --project=chromium --workers=1

# Con ventana visible (validación como persona):
npx playwright test --grep "STRY-XXX" --project=chromium --workers=1 --headed

# E2E server (puerto 3002, si aplica):
$env:BASE_URL = "http://127.0.0.1:3002"
npx playwright test --grep "STRY-XXX" --project=chromium --workers=1
```

**Última corrida:** [fecha] — [N passed, M failed] — [notas breves]

---

## Tenants activos para esta US

Repetir **todos los escenarios marcados con (×tenants)** en **cada** fila.  
Si se agrega un tenant activo al producto, actualizar esta tabla y ampliar E2E.

| #   | Slug (`/t/{slug}/…`) | Descripción      |
| --- | -------------------- | ---------------- |
| 1   | `wondernails`        | Tenant principal |
| 2   | `[slug-2]`           | [descripción]    |

---

## Credencial estándar

| Campo    | Valor                                             |
| -------- | ------------------------------------------------- |
| Email    | `jagzao@gmail.com`                                |
| Password | `admin`                                           |
| Uso      | Misma credencial en todos los tenants de la tabla |

---

## Precondiciones (el agente verifica antes de Playwright)

| #   | Condición                                                                       | Si falla, el agente debe…                                                |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | `$BASE_URL/api/health` responde 200                                             | Ver protocolo `e2e-validation.md` §0: detectar puerto, levantar servidor |
| 2   | Login `jagzao@gmail.com` / `admin` funciona en `/t/{slug}/login` para cada slug | Corregir seed/roles del tenant hasta login OK                            |
| 3   | Seed de datos aplicado por tenant                                               | `POST $BASE_URL/api/debug/seed-e2e { tenantSlug }` — verificar 200       |
| 4   | [Condición específica de la US, p.ej. "productos con stock > 0 existen"]        | [Acción de remediación]                                                  |

---

## Escenario A — [Nombre del flujo principal] (×tenants)

Repetir sustituyendo `{slug}` por cada tenant de la tabla anterior.

### Tenant `{slug}` — Escenario A

| Paso | Acción del usuario                              | Resultado esperado                | Selector / verificación Playwright                      |
| ---- | ----------------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| A1   | Navegar a `/t/{slug}/login`                     | Formulario login visible          | `page.goto(...)` · `getByTestId("email-input")` visible |
| A2   | Ingresar credencial estándar e iniciar sesión   | Redirección fuera de `/login`     | `waitForURL` sin `/login`                               |
| A3   | Navegar a `/t/{slug}/[ruta-feature]`            | Pantalla correcta carga sin error | `h1` con texto esperado · sin spinner eterno            |
| A4   | [Acción principal del flujo]                    | [Resultado esperado]              | `data-testid="[elemento]"` visible                      |
| A5   | Verificar que el resultado persiste tras reload | Dato sigue visible                | `page.reload()` · mismo selector visible                |

**Checklist agente:** [ ] `wondernails` A1–A5 verdes · [ ] `[slug-2]` A1–A5 verdes

---

## Escenario B — [Flujo secundario o variante] (×tenants)

### Tenant `{slug}` — Escenario B

| Paso | Acción del usuario | Resultado esperado | Notas Playwright |
| ---- | ------------------ | ------------------ | ---------------- |
| B1   | [Acción]           | [Resultado]        |                  |
| B2   | [Acción]           | [Resultado]        |                  |

**Checklist agente:** [ ] `wondernails` B1–B2 verdes · [ ] `[slug-2]` B1–B2 verdes

---

## Escenario C — Errores y permisos (global, una ejecución)

| Paso | Acción                                             | Resultado esperado                     | Notas                                                           |
| ---- | -------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| C1   | Sin sesión: navegar a `/t/{slug}/[ruta-protegida]` | Redirección a `/t/{slug}/login`        | `waitForURL(/login/)`                                           |
| C2   | Enviar formulario con campos vacíos                | Mensaje de error de validación visible | `data-testid="error-msg"` · texto "requerido"                   |
| C3   | [Llamada API sin auth / con tenant inválido]       | 401 o 403                              | `expect(response.status()).toBe(401)`                           |
| C4   | (Opcional) Usuario sin rol suficiente              | Error tipado / UX de acceso denegado   | Si no hay usuario en seed, documentar "omitido" + cubrir con UT |

---

## Escenario D — Navegación y rutas críticas (×tenants)

Verifica que las rutas de la feature existen y no rompen la navegación.

### Tenant `{slug}` — Escenario D

| Paso | URL / acción                       | Resultado esperado               |
| ---- | ---------------------------------- | -------------------------------- |
| D1   | `GET /t/{slug}/[ruta-1]`           | HTTP 200 · sin pantalla blanca   |
| D2   | `GET /t/{slug}/[ruta-2]`           | HTTP 200 · contenido correcto    |
| D3   | Navegar D1 → D2 → atrás → adelante | Sin errores · estado consistente |

**Checklist agente:** [ ] `wondernails` D1–D3 verdes · [ ] `[slug-2]` D1–D3 verdes

---

## Escenario E — Negative smoke (×tenants)

| Paso | Acción                                                           | Resultado esperado                        | Notas                                                    |
| ---- | ---------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| E1   | Login con password incorrecto en `/t/{slug}/login`               | Mensaje de error · sin sesión establecida | No 500 · reintento a ruta protegida sigue pidiendo login |
| E2   | Con sesión de `{slug}`, acceder a datos de `{otro-slug}` vía API | 403 o datos vacíos del otro tenant        | Sin fuga cross-tenant                                    |
| E3   | [Caso negativo específico de la US]                              | [Resultado esperado]                      |                                                          |

**Checklist agente:** [ ] `wondernails` E1–E3 · [ ] `[slug-2]` E1–E3

---

## Rendimiento (criterios mínimos)

| #   | Qué medir                                   | Criterio                               |
| --- | ------------------------------------------- | -------------------------------------- |
| P1  | Primera carga de `/t/{slug}/[ruta-feature]` | Página usable en ≤ 5s en entorno local |
| P2  | Submit del formulario principal             | Respuesta visible en ≤ 3s              |

Si un criterio falla: anotar en `implementacion.md` y registrar issue; no bloquear la US por performance salvo que el criterio esté en los AC.

---

## Obligación del agente (checklist antes de avisar al dueño)

- [ ] Seed aplicado en todos los tenants de la tabla (`POST /api/debug/seed-e2e`).
- [ ] Escenario A verde en **cada** tenant.
- [ ] Escenario B verde en **cada** tenant (si aplica).
- [ ] Escenario C verde (o C4 omitido con justificación + UT).
- [ ] Escenario D verde en **cada** tenant.
- [ ] Escenario E (negative smoke) verde en **cada** tenant.
- [ ] Playwright headless con `--grep "STRY-XXX" --workers=1` en verde.
- [ ] Tests E2E formales en `tests/e2e/[módulo]/stry-xxx-[nombre].spec.ts` con tag `@stry-xxx`.
- [ ] Ciclos de corrección documentados en `implementacion.md` (tabla ciclo/error/fix).
- [ ] Solo entonces: mensaje al dueño **"lista para visto bueno"** con evidencia y resumen por tenant.

---

_Template v2.0 | 2026-05-06 — Alineado con `e2e-validation.md` v1.1 y el nivel de STRY-001._

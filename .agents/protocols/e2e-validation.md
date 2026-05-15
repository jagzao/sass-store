# Protocolo E2E — Validación como Persona (Playwright CLI)

> Versión: 1.3  
> Estado: VIGENTE  
> Self-contained: cualquier LLM puede seguir este protocolo sin contexto adicional.  
> Referenciado por: `story-orchestrator.md` Fase 4, `CLAUDE.md` § Validación E2E.

---

## 0. Prerrequisitos — Detectar puerto, levantar servidor y sembrar datos

**Regla absoluta: Playwright no se ejecuta hasta que el servidor responda al health check.**

### Paso 0.1 — Detectar el puerto activo (3001 dev / 3002 E2E)

El proyecto puede correr en **3001** (`npm run dev`) o en **3002** (servidor E2E de Playwright `scripts/start-e2e-server.js`).  
Si la variable `BASE_URL` ya está definida en el entorno, usarla directamente.  
Si no, detectar automáticamente:

```bash
# Bash: detectar puerto o usar BASE_URL del entorno
if [ -n "$BASE_URL" ]; then
  echo "Usando BASE_URL del entorno: $BASE_URL"
elif curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health 2>/dev/null | grep -q "200"; then
  export BASE_URL="http://127.0.0.1:3001"
  echo "Servidor detectado en 3001 (dev)"
elif curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/api/health 2>/dev/null | grep -q "200"; then
  export BASE_URL="http://127.0.0.1:3002"
  echo "Servidor detectado en 3002 (E2E)"
else
  echo "Ningún servidor activo → Paso 0.2"
fi
```

```powershell
# PowerShell: detectar puerto o usar BASE_URL del entorno
if ($env:BASE_URL) {
  Write-Host "Usando BASE_URL del entorno: $env:BASE_URL"
} else {
  $found = $false
  foreach ($port in @(3001, 3002)) {
    try {
      $r = Invoke-WebRequest "http://127.0.0.1:$port/api/health" -UseBasicParsing -EA Stop
      if ($r.StatusCode -eq 200) {
        $env:BASE_URL = "http://127.0.0.1:$port"
        Write-Host "Servidor detectado en $port"
        $found = $true; break
      }
    } catch {}
  }
  if (-not $found) { Write-Host "Ningún servidor activo → Paso 0.2" }
}
```

- `BASE_URL` definido → servidor listo, saltar a §0.4.
- No detectado en ningún puerto → Paso 0.2.

### Paso 0.2 — Levantar el servidor en background

```bash
# Bash / Git Bash — dev en 3001 (opción por defecto)
npm run dev &
export BASE_URL="http://127.0.0.1:3001"
```

```powershell
# PowerShell (Windows)
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
$env:BASE_URL = "http://127.0.0.1:3001"
```

### Paso 0.3 — Esperar hasta que el servidor esté listo (máx 90s)

```bash
# Bash: polling cada 2s contra BASE_URL
for i in $(seq 1 45); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "Servidor listo en $BASE_URL (intento $i)"
    break
  fi
  echo "Esperando servidor... $((i*2))s / 90s"
  sleep 2
done
```

```powershell
# PowerShell: polling cada 2s
for ($i = 1; $i -le 45; $i++) {
  try {
    $r = Invoke-WebRequest "$env:BASE_URL/api/health" -UseBasicParsing -EA Stop
    if ($r.StatusCode -eq 200) { Write-Host "Servidor listo en $env:BASE_URL (intento $i)"; break }
  } catch {}
  Write-Host "Esperando servidor... $($i*2)s / 90s"
  Start-Sleep 2
}
```

Si tras 90s no responde → revisar logs del proceso, reportar bloqueo con el error de arranque.

### Paso 0.4 — Seed de datos por tenant antes de correr Playwright

**Sin datos en el tenant, los tests pasan vacíos o fallan con mensajes que no apuntan al bug real.**

Llamar al endpoint de seed por cada tenant listado en `testing-usuario.md` de la US.  
Usar `$BASE_URL` definido en §0.1 — no hardcodear el puerto.

```bash
# Bash — múltiples tenants (reemplazar slugs con los de la US)
for SLUG in wondernails centro-tenistico; do
  echo "Seeding $SLUG..."
  curl -s -X POST "$BASE_URL/api/debug/seed-e2e" \
    -H "Content-Type: application/json" \
    -d "{\"tenantSlug\": \"$SLUG\"}"
  echo ""
done
```

```powershell
# PowerShell — múltiples tenants
foreach ($slug in @("wondernails","centro-tenistico")) {
  Write-Host "Seeding $slug..."
  Invoke-WebRequest "$env:BASE_URL/api/debug/seed-e2e" `
    -Method POST `
    -ContentType "application/json" `
    -Body "{`"tenantSlug`": `"$slug`"}" `
    -UseBasicParsing | Select-Object -ExpandProperty Content
}
```

- Si responde `200` / `{ ok: true }` → seed aplicado, continuar.
- Si responde `404` → el endpoint no existe o la ruta cambió; buscar en `apps/web/app/api/debug/seed-e2e/` y corregir la URL.
- Si responde `500` → error en el seed; revisar logs del servidor antes de continuar con Playwright.

**Solo llamar este endpoint en entornos de desarrollo y test. Nunca en producción.**

---

## 1. Qué significa "validar como una persona real"

Un agente que valida como persona NO solo verifica que no hay 404.  
Sigue el flujo completo que haría un usuario del negocio.

| Acción humana                                                           | Implementación Playwright                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Abrir el navegador e ir a la URL                                        | `page.goto('/t/[tenant]/[ruta]')`                      |
| Confirmar que la página cargó (sin spinner eterno, sin pantalla blanca) | `expect(page.locator('main')).toBeVisible()`           |
| Leer el título / heading para confirmar que es la pantalla correcta     | `expect(page.locator('h1')).toContainText('...')`      |
| Hacer clic en el CTA principal                                          | `page.click('button:has-text("Nuevo")')`               |
| Llenar el formulario con datos reales del negocio (no "test123")        | Nombres, precios, fechas coherentes con el tenant      |
| Enviar y esperar la respuesta de la red                                 | `page.waitForResponse(/api\/[recurso]/)`               |
| Verificar que el resultado aparece en pantalla                          | Toast de éxito, fila nueva en tabla, modal cerrado     |
| Probar el caso de error (datos inválidos o vacíos)                      | Submit con form vacío → verificar mensaje de error     |
| Recargar la página y confirmar que el dato persiste                     | `page.reload()` → verificar que sigue visible          |
| Navegar hacia atrás y de vuelta                                         | `page.goBack()` → `page.goForward()` → estado correcto |

### Lo que NO cuenta como "validación como persona":

- Verificar solo que la ruta no da 404.
- Verificar solo que existe un `<h1>`.
- No probar el flujo de error.
- No verificar persistencia tras reload.
- No interactuar con formularios — solo navegar.

---

## 2. Ejecución headed — inspección visual paso a paso

### Paso 2.1 — Lanzar en modo headed

```bash
# Test de un solo tenant:
npm run test:e2e:subset -- --headed --grep "STRY-XXX"

# Test multitenant (más de un slug en testing-usuario.md): SIEMPRE --workers=1
# Razón: en paralelo, el seed de un tenant pisa al otro y los datos se corrompen.
npm run test:e2e:subset -- --headed --grep "STRY-XXX" --workers=1

# Si aún no hay spec (primera validación exploratoria):
npx playwright test --headed --grep "STRY-XXX" --workers=1

# Con slow-mo para inspección visual más cómoda:
npx playwright test --headed --grep "STRY-XXX" --workers=1 --slow-mo 300
```

**Regla `--workers=1`:** si el `testing-usuario.md` lista más de un tenant, siempre agregar `--workers=1`. Nunca correr tests multitenant en paralelo.

### Paso 2.2 — Qué observar durante la ejecución

**Señales de que el flujo funciona:**

- La página carga en menos de 3 segundos.
- Los datos del tenant aparecen (no vacíos, no "undefined").
- El toast de éxito es visible tras submit.
- La UI refleja el nuevo estado: lista actualizada, modal cerrado, contador incrementado.
- No hay errores en la consola del navegador (rojo).

**Señales de que hay un bug — y qué tipo:**

| Lo que se ve en pantalla                             | Tipo de bug probable                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Pantalla en blanco / spinner eterno                  | Fetch colgado, error sin `catch` en el componente, error de hidratación SSR |
| Error 401/403 en red tab                             | Falta token de sesión, tenant header ausente, middleware bloqueando         |
| Error 404 en red tab                                 | API route no existe o ruta incorrecta                                       |
| Error 500 en red tab                                 | Excepción no capturada en el handler o en el servicio                       |
| Toast de error con texto genérico ("algo salió mal") | Error no tipado llegando al cliente                                         |
| Texto "undefined" o "[object Object]" en la UI       | Bug de renderizado: prop no llega o tiene tipo incorrecto                   |
| Formulario no envía al hacer clic en Submit          | Handler desconectado, validación bloqueando sin mensaje, JS error           |
| Datos no persisten tras reload                       | Cache no invalidada, mutación no refrescó la query, race condition          |
| Elemento esperado no aparece                         | Renderizado condicional incorrecto, datos vacíos desde la API               |

### Paso 2.3 — Capturar evidencia

```typescript
// Dentro del spec, en puntos clave:
await page.screenshot({
  path: "test-results/stry-xxx-paso-N.png",
  fullPage: true,
});
```

```bash
# Correr con traces completos (para análisis post-mortem):
npx playwright test --headed --grep "STRY-XXX" --trace on
```

---

## 3. Diagnóstico, reproducción y plan de corrección (OBLIGATORIO antes del fix)

**Aplica cuando termina la implementación** (o el análisis que la originó) y la validación E2E / revisión de AC detecta un fallo.  
**No editar código de negocio** hasta completar diagnóstico + reproducción en Playwright CLI + plan documentado.

### 3.0 Secuencia fija

```
1. DIAGNOSTICAR   → síntoma, esperado vs actual, capa probable, hipótesis
2. COMUNICAR      → informar al dueño qué está mal y cómo se corregirá (sin pedir permiso para el fix)
3. REPRODUCIR     → Playwright CLI headed (--trace on, screenshots) siguiendo testing-usuario.md / AC
4. DOCUMENTAR     → implementacion.md + tests/evidence/[STRY-XXX]/MANUAL_REPRODUCTION_STEPS.md
5. CORREGIR       → un cambio dirigido en la capa rota (§3.1)
6. RE-VALIDAR     → Playwright headed del subset → specs E2E → headless → UT del módulo
```

### 3.0.1 Mensaje al dueño (antes del fix)

Plantilla mínima (chat o nota en `implementacion.md`):

```markdown
## Hallazgo post-implementación — [STRY-XXX]

**Qué está mal:** [síntoma observable; URL/tenant; paso del flujo]
**Esperado vs actual:** [CA o fila de testing-usuario.md] vs [lo observado]
**Hipótesis / capa:** [UI | API | servicio | datos | seed]
**Cómo lo corregiré:** [archivo/capa + cambio concreto, sin refactor lateral]
**Reproducción:** Playwright headed `--grep "STRY-XXX"` (trace + screenshots en test-results/)
```

### 3.0.2 Reproducción en Playwright CLI (obligatoria)

```bash
# Reproducir el fallo con evidencia (mismo tenant y pasos que testing-usuario.md)
npx playwright test --headed --grep "STRY-XXX" --workers=1 --trace on --slow-mo 300

# Si aún no hay spec: exploración mínima acotada al paso roto
npx playwright test --headed --grep "[módulo o ruta]" --workers=1 --trace on
```

Durante la reproducción:

- Seguir el paso exacto del AC / `testing-usuario.md` que falla.
- Capturar screenshot en el estado erróneo: `test-results/stry-xxx-repro-paso-N.png`.
- Anotar consola del navegador y peticiones 4xx/5xx relevantes.
- **No** aplicar el fix hasta tener al menos un ciclo headed que muestre el fallo (o bloqueo documentado si no es reproducible tras 2 intentos con seed/entorno corregido).

### 3.0.3 Documentación de reproducción

En `.agents/sprint/STRY-XXX-[slug]/implementacion.md`, tabla **Reproducción pre-fix**:

| ID  | Paso      | Tenant      | Comando Playwright                                          | Evidencia                           | Resultado         |
| --- | --------- | ----------- | ----------------------------------------------------------- | ----------------------------------- | ----------------- |
| R1  | [paso AC] | wondernails | `npx playwright test --headed --grep "STRY-XXX" --trace on` | `test-results/stry-xxx-repro-1.png` | Falla reproducida |

Copiar pasos humanos en `tests/evidence/[STRY-XXX]/MANUAL_REPRODUCTION_STEPS.md` (plantilla `.agents/templates/MANUAL_REPRODUCTION_STEPS.md`).

### 3.0.4 Re-validación post-fix (Playwright CLI)

Tras el fix, **re-ejecutar en este orden** (no saltar pasos):

```bash
npm run typecheck
npm run test:unit -- --grep "[módulo]"
npm run test:e2e:subset -- --headed --grep "STRY-XXX" --workers=1
npm run test:e2e:subset -- --grep "STRY-XXX" --workers=1
```

Si el alcance lo exige (`e2e-validation.md` §8): tour de sitio completo headed y `npm run test:e2e` headless antes de declarar validación cerrada.

Actualizar la tabla **Loop E2E** (§4) con fila de reproducción + fix + re-validación headed/headless.

---

## 3.1 Árbol de diagnóstico y corrección de bugs

Cuando se detecta un fallo, seguir este árbol **después** de §3.0 (diagnóstico + reproducción).  
**Editar solo la capa rota. No refactorizar alrededor del bug.**

```
¿Hay error en la consola del navegador?
├── SÍ — TypeError / ReferenceError / Cannot read properties
│   └── → Es un bug de cliente. Revisar el componente/hook que renderiza esa sección.
│         Buscar: prop undefined, array.map sin guard, acceso a .data antes de cargar.
│
├── SÍ — Error de red (4xx/5xx en el Network tab)
│   ├── 401 / 403 → Revisar: auth session, middleware tenant, header x-tenant
│   ├── 404 → Verificar que el archivo de la API route existe en la ruta exacta
│   └── 500 → Revisar el handler de la API route. Buscar en los logs del server
│             (terminal donde corre `npm run dev`) el stack trace completo.
│
└── NO — Sin error en consola, pero la UI está mal
    ├── Spinner eterno → revisar el estado de loading en el componente;
    │                    ¿el fetch devuelve? ¿hay un await sin resolver?
    ├── Datos vacíos  → ¿la query filtra correctamente por tenant?
    │                  ¿el seed de e2e tiene datos para este tenant?
    └── Elemento no encontrado → ¿el selector es correcto?
                                 ¿el elemento está dentro de un iframe o shadow DOM?
                                 ¿hay un renderizado condicional que lo oculta?
```

### Proceso de corrección dirigida

```
0. COMPLETAR §3.0 (diagnóstico, mensaje al dueño, reproducción headed con trace)

1. IDENTIFICAR la capa rota:
   DB query → servicio → API route → componente cliente

2. EDITAR solo esa capa (un archivo, un cambio claro)

3. VERIFICAR que compila:
   npm run typecheck -- --noEmit 2>&1 | tail -20

4. RE-VALIDAR Playwright CLI (§3.0.4): headed → headless del subset

5. VERIFICAR que el fix no rompe unit tests del módulo:
   npm run test:unit -- --grep "[módulo]"
```

---

## 4. Loop auto-correctivo (máx 5 ciclos)

```
ciclo = 1

MIENTRAS ciclo <= 5:
  ┌─────────────────────────────────────────────────────┐
  │ npm run test:e2e:subset -- --headed --grep "STRY-XXX" │
  └─────────────────────────────────────────────────────┘
       │
       ├── PASA → salir del loop → ir a §5 (headless)
       │
       └── FALLA →
             a. Diagnóstico + reproducción Playwright CLI (§3.0) antes de tocar código
             b. Aplicar árbol de diagnóstico (§3.1)
             c. Fix dirigido en la capa rota
             d. Re-validar headed + headless (§3.0.4)
             e. Documentar en implementacion.md (ver formato abajo)
             f. ciclo += 1
             g. continuar

Si ciclo > 5 y aún falla:
  → BLOQUEO. Reportar con:
      - Comando exacto ejecutado
      - Error completo (stdout + stderr, primeras 100 líneas)
      - Resumen de los 5 fixes intentados
      - Hipótesis de causa raíz actual
      - Próxima acción sugerida (cambio de arquitectura / ayuda externa)
```

### Formato de documentación por ciclo

En `.agents/sprint/STRY-XXX-[slug]/implementacion.md`:

```markdown
## Loop E2E

| Ciclo | Error detectado                          | Capa                   | Fix aplicado                    | Resultado      |
| ----- | ---------------------------------------- | ---------------------- | ------------------------------- | -------------- |
| 1     | TypeError: Cannot read 'id' of undefined | Componente BookingCard | Agregar guard `booking?.id`     | Sigue fallando |
| 2     | API 500 en /api/bookings                 | API route              | Envolver query en fromPromise() | Verde ✅       |
```

---

## 5. Gate headless — confirmación final de CI

Solo cuando el modo headed pasa limpio:

```bash
# Un tenant:
npm run test:e2e:subset -- --grep "STRY-XXX"

# Multitenant (siempre --workers=1):
npm run test:e2e:subset -- --grep "STRY-XXX" --workers=1
```

**Criterios de "verde" para headless:**

- 0 tests fallidos.
- 0 tests omitidos (`test.skip`) sin justificación documentada.
- Tiempo de ejecución < 2 min para una suite estándar.

**Si headless falla pero headed pasó:**

- Causa más frecuente: timing — un selector tarda más sin UI renderizada.
- Fix estándar: agregar `waitFor` explícito o usar `page.waitForLoadState('networkidle')`.
- **Nunca** deshabilitar el test. Siempre arreglarlo.

---

## 6. Crear / actualizar los specs E2E formales

Una vez el flujo está validado (headed + headless verde), crear o actualizar en `tests/e2e/`:

```typescript
// tests/e2e/[módulo]/stry-xxx-[nombre].spec.ts
import { test, expect } from "@playwright/test";

test.describe("STRY-XXX: [Nombre del feature] @stry-xxx", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    // Setup común: navegar a la base del feature
    await page.goto("/t/[tenant]/[ruta]");
    await page.waitForLoadState("networkidle");
  });

  test("happy path — [descripción del flujo validado]", async ({ page }) => {
    // Pasos exactos que se validaron en modo headed
    await page.click('button:has-text("Nuevo")');
    await page.fill('[name="nombre"]', "Cliente E2E Test");
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator("text=Cliente E2E Test")).toBeVisible();

    // Verificar persistencia
    await page.reload();
    await expect(page.locator("text=Cliente E2E Test")).toBeVisible();
  });

  test("error — input inválido muestra mensaje correcto", async ({ page }) => {
    // Caso de error validado en modo headed
    await page.click('button:has-text("Nuevo")');
    await page.click('button[type="submit"]'); // Submit vacío

    await expect(page.locator('[data-testid="error-msg"]')).toBeVisible();
    await expect(page.locator("text=requerido")).toBeVisible({ timeout: 3000 });
  });
});
```

**Reglas del spec:**

- Tag `@stry-xxx` en el `describe` para que `--grep "STRY-XXX"` lo encuentre.
- Usar `data-testid` para selectores que no dependen de texto traducible.
- Cada acción de usuario debe tener una aserción de resultado.
- Mínimo: 1 happy path completo + 1 caso de error.

---

## 7. Checklist de cierre E2E

Marcar antes de reportar "implementado y validado por el agente":

```
[ ] Servidor activo en http://localhost:3001 (levantado por el agente si estaba apagado)
[ ] Cada fallo: diagnóstico + plan de fix comunicado/documentado (§3.0.1)
[ ] Cada fallo: reproducción Playwright CLI headed con trace/screenshot antes del fix (§3.0.2)
[ ] Playwright --headed: 0 errores visuales en el flujo completo
[ ] Flujo completo probado: carga → acción → resultado → reload → persiste
[ ] Caso de error probado: input inválido → mensaje de error visible y correcto
[ ] Tests E2E creados/actualizados en tests/e2e/ con tag @stry-xxx
[ ] Playwright headless: 0 tests fallidos, 0 skipped sin justificación
[ ] Post-fix: re-validación Playwright headed + headless del subset (§3.0.4)
[ ] Ciclos de corrección documentados en implementacion.md (tabla de ciclos + reproducción pre-fix)
[ ] Screenshot o trace de evidencia en test-results/
```

Solo con todos los ítems marcados → el agente puede reportar la fase E2E como completa.

---

## 8. Validación de Sitio Completo — Obligatoria antes del Deploy

**Esta fase es OBLIGATORIA al final de cualquier US, tarea, fix, o ciclo de trabajo.**  
No se puede hacer deploy sin pasar esta validación de sitio completo.

### 8.1 Propósito

Después de corregir un feature o bug, el agente SIEMPRE puede haber introducido regresiones en otras partes del sitio. Esta fase las detecta y corrige **antes** de hacer deploy.

### 8.2 Cobertura mínima del tour de sitio completo

```bash
# Lanzar tour de sitio completo con slow-mo para inspección visual
npx playwright test tests/e2e/site-tour/ --headed --slow-mo 300 --workers=1

# Si no existe tests/e2e/site-tour/ → ejecutar manualmente las rutas críticas:
npx playwright test --headed --slow-mo 300 --workers=1 --grep "@site-tour"
```

| Área                | Rutas a validar                           | Criterio de paso                      |
| ------------------- | ----------------------------------------- | ------------------------------------- |
| Landing / zo-system | `/`, `/t/zo-system/`                      | Carga sin error, hero visible         |
| Auth                | `/api/auth/signin`, `/api/auth/register`  | Formularios funcionales               |
| Admin global        | `/admin/tenants`, `/admin/social-planner` | Listados cargan, sin 500              |
| Tenant admin        | `/t/wondernails/admin/`                   | Dashboard carga con datos             |
| Finance             | `/t/wondernails/finance/`                 | KPIs visibles, sin pantalla blanca    |
| Inventory           | `/t/wondernails/inventory/`               | Lista de productos carga              |
| Bookings            | `/t/wondernails/book/`                    | Calendario visible, slots disponibles |
| POS                 | `/t/wondernails/finance/pos/`             | Terminal carga, sin error de red      |

### 8.3 Proceso auto-correctivo de sitio completo

```
ciclo_sitio = 1

MIENTRAS ciclo_sitio <= 5 Y hay errores en el tour:

  1. Registrar cada error encontrado:
     - URL exacta
     - Tipo (visual / 4xx / 5xx / JS error / pantalla blanca)
     - Screenshot en test-results/site-tour/ciclo-N-[ruta].png

  2. Priorizar por severidad:
     P0 → 500 / pantalla blanca / JS crash
     P1 → 404 / datos vacíos / formulario roto
     P2 → UI degradada / elemento faltante

  3. Corregir en orden P0 → P1 → P2
     (un fix por archivo, un ciclo por conjunto de fixes relacionados)

  4. npm run typecheck -- --noEmit (verificar que compila)

  5. Reiniciar servidor y repetir tour desde §8.2

  ciclo_sitio += 1

Si ciclo_sitio > 5 y aún hay errores:
  → BLOQUEO. Documentar en implementacion.md con:
     - Lista de errores persistentes
     - Fixes intentados
     - Hipótesis de causa raíz
```

### 8.4 Gate final antes del deploy

```bash
# 1. Headless completo (todos los E2E, no solo el subset del feature)
npm run test:e2e

# 2. Build de producción (debe ser exitoso)
npm run build

# 3. Lint + typecheck (sin errores)
npm run lint && npm run typecheck
```

**Solo si los tres comandos pasan sin error → proceder al deploy.**

### 8.5 Apagar servicios y hacer deploy

```powershell
# PowerShell — apagar el servidor dev levantado por el agente
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# Deploy: commit + push
git add -A
git commit -m "fix: [descripción de todos los fixes del ciclo]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin HEAD

# Abrir PR si no existe
gh pr create --title "[scope]: [descripción]" --body "..."
# O actualizar PR existente (push automáticamente actualiza el PR)
```

**Reglas del commit de cierre:**

- Conventional Commits obligatorio
- El mensaje describe QUÉ se corrigió y por qué (no "varios fixes")
- Si hay múltiples correcciones, usar bullets en el body

---

## 9. Checklist de Cierre COMPLETO (US / Task / Fix)

```
FASE FEATURE:
[ ] Servidor activo en http://localhost:3001
[ ] Playwright --headed: flujo del feature validado como persona
[ ] Caso de error validado
[ ] Tests E2E creados/actualizados en tests/e2e/ con tag @stry-xxx
[ ] Playwright headless subset: 0 fallidos, 0 skipped sin justificación
[ ] Ciclos de corrección documentados en implementacion.md

FASE SITIO COMPLETO:
[ ] Tour de sitio completo ejecutado (§8.2)
[ ] 0 regresiones en rutas críticas (landing, auth, admin, finance, inventory, bookings)
[ ] npm run test:e2e → 0 fallidos (headless completo)
[ ] npm run build → exitoso
[ ] npm run lint && npm run typecheck → sin errores

FASE DEPLOY:
[ ] Servidor dev detenido limpiamente
[ ] Commit creado con Conventional Commits
[ ] Push a rama activa
[ ] PR creado / actualizado
```

Solo con todos los ítems marcados → la tarea está COMPLETA y se puede reportar al usuario.

---

_Versión 1.2 | 2026-05-09 — §8 Validación de Sitio Completo obligatoria + pipeline auto-correct-deploy antes de reportar done._

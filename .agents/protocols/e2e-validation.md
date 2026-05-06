# Protocolo E2E — Validación como Persona (Playwright CLI)

> Versión: 1.1  
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

## 3. Árbol de diagnóstico y corrección de bugs

Cuando se detecta un fallo, seguir este árbol **antes** de editar código.  
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
1. IDENTIFICAR la capa rota:
   DB query → servicio → API route → componente cliente

2. EDITAR solo esa capa (un archivo, un cambio claro)

3. VERIFICAR que compila:
   npm run typecheck -- --noEmit 2>&1 | tail -20

4. RE-EJECUTAR solo el subset afectado:
   npm run test:e2e:subset -- --headed --grep "STRY-XXX"

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
             a. Aplicar árbol de diagnóstico (§3)
             b. Fix dirigido en la capa rota
             c. Documentar en implementacion.md (ver formato abajo)
             d. ciclo += 1
             e. continuar

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
[ ] Playwright --headed: 0 errores visuales en el flujo completo
[ ] Flujo completo probado: carga → acción → resultado → reload → persiste
[ ] Caso de error probado: input inválido → mensaje de error visible y correcto
[ ] Tests E2E creados/actualizados en tests/e2e/ con tag @stry-xxx
[ ] Playwright headless: 0 tests fallidos, 0 skipped sin justificación
[ ] Ciclos de corrección documentados en implementacion.md (tabla de ciclos)
[ ] Screenshot o trace de evidencia en test-results/
```

Solo con todos los ítems marcados → el agente puede reportar la fase E2E como completa.

---

_Versión 1.1 | 2026-05-06 — Puerto dinámico (3001/3002 auto-detect + BASE_URL), seed con BASE_URL, --workers=1 multitenant en headed y headless._

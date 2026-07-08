# Story: PWA instalable por tenant + fix servicios + observabilidad

> **ID:** STRY-026
> **Estado:** done
> **Prioridad:** P0
> **Sprint:** S2
> **Asignado:** PM → Architect → Dev → QA → Security
> **Creado:** 2026-07-06
> **Actualizado:** 2026-07-07
> **PR:** https://github.com/jagzao/sass-store/pull/4 (merged)

**Artefactos de sprint (agente / entrega):** `.agents/sprint/STRY-026-pwa-fix-servicios/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **dueño/operador de un tenant**, quiero que **mi app sea instalable en el celular con mi propio logo y colores**, que **los servicios se guarden y editen correctamente sin mostrar descripciones erróneas**, y que **los errores de runtime queden capturados y analizables**, para que **mis clientes y yo tengamos una experiencia confiable tanto en web como instalada**.

### Contexto

Se detectaron cuatro problemas operativos simultáneos:
1. La app **no es instalable** (no hay web manifest ni service worker; el `manifest.json` de la raíz es metadata de proyecto, no PWA).
2. Los **servicios no se guardan / se ven datos inconsistentes**: existen **4 archivos `.env` con `DATABASE_URL` apuntando a destinos distintos** (uno a `localhost`); `connection.ts` cae a un fallback silencioso a `localhost/dummy`; además el `admin_services` edita solo la columna `description` mientras el `SmartPublishWizard` escribe en `shortDescription`/`longDescription` → "descripción errónea al reabrir".
3. **No hay análisis de errores**: Sentry está configurado pero no se ha revisado/curado; además hay **credenciales de Supabase commiteadas en `SUPABASE_CREDENTIALS_GUIDE.md`** (fuga, relacionada con STRY-019).
4. **"Error al buscar servicios"** en `/t/[tenant]/admin_services` — síntoma del bug de DB/carga de datos (la búsqueda es client-side y solo activa con ≥3 caracteres).

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: App instalable por tenant (manifest dinámico)

```gherkin
Feature: PWA instalable con identidad por tenant

  Scenario: Instalación muestra logo y nombre del tenant
    Given el usuario navega a "/t/wondernails" desde Chrome/Edge mobile o desktop
    When  abre el menú "Instalar aplicación"
    Then  el ícono mostrado es el logo configurado del tenant "wondernails"
    And   el nombre de la app sugerido es el nombre del tenant
    And   el theme color coincide con el color de marca del tenant

  Scenario: Manifest se sirve por tenant
    Given el tenant "vigistudio" con logo y themeColor configurados
    When  se solicita "/t/vigistudio/manifest.webmanifest"
    Then  la respuesta es JSON con "name", "icons", "theme_color" del tenant
    And   "display" es "standalone"
    And   contiene al menos un ícono 192x192 y uno 512x512 (maskable)
```

### CA-2: Service worker offline + push

```gherkin
  Scenario: Páginas vistas funcionan offline
    Given el usuario visitó previamente "/t/wondernails"
    When  pierde conexión a internet y recarga la página
    Then  ve la página (o un fallback offline) en lugar de "Dinosaurio / sin conexión"

  Scenario: Suscripción a push notifications
    Given el tenant tiene VAPID keys configuradas
    When  el usuario acepta permisos de notificación
    Then  se crea una suscripción push asociada al tenant en la DB
    And   el endpoint de suscripción responde 201 con Result Pattern
```

### CA-3: Unificación de DB — una sola fuente de verdad

```gherkin
  Scenario: No hay DATABASE_URL apuntando a localhost en producción
    Given el repositorio con archivos .env
    When  se ejecuta el arranque de la app
    Then  toda lectura de DATABASE_URL apunta al mismo destino (Supabase prod)
    And   no existe .env.local en raíz apuntando a localhost

  Scenario: Fallo fuerte si falta DATABASE_URL
    Given DATABASE_URL no definida o igual a placeholder
    When  la app arranca
    Then  se lanza un error explícito (no fallback silencioso a localhost/dummy)
    And   el log indica claramente "DATABASE_URL no configurada"
```

### CA-4: Guardar/editar servicio conserva la descripción correcta

```gherkin
  Scenario: Editar servicio muestra la descripción real guardada
    Given un servicio creado vía SmartPublishWizard con shortDescription "Manicura premium"
    When  el admin abre "/t/wondernails/admin_services" y hace clic en Editar
    Then  el formulario muestra "Manicura premium" en el campo descripción
    And   al guardar, el valor se persiste sin sobrescribir campos vacíos

  Scenario: Guardar servicio nuevo funciona contra la DB correcta
    Given el admin en "/t/wondernails/admin_services"
    When  crea un servicio "Test PWA" con precio 50 y duración 1.5
    Then  el servicio aparece en la lista tras recarga
    And   al consultar Supabase directamente, el registro existe
```

### CA-5: Búsqueda de servicios no genera error

```gherkin
  Scenario: Buscar servicio devuelve resultados coherentes
    Given servicios cargados en "/t/wondernails/admin_services"
    When  el admin escribe "manicura" (≥3 caracteres) en el buscador
    Then  la tabla se filtra por nombre o descripción sin errores
    And   no aparecen errores de consola ni red

  Scenario: Búsqueda con < 3 caracteres no filtra
    Given la lista de servicios cargada
    When  el admin escribe "ma" (2 caracteres)
    Then  se muestran todos los servicios (filtro inactivo)
```

### CA-6: Observabilidad de errores

```gherkin
  Scenario: Error de API se captura y reporta
    Given un endpoint protegido por withResultHandler
    When  ocurre un error de DB o validación
    Then  el error se envía a Sentry con contexto (tenant, endpoint, usuario)
    And   la respuesta al cliente es un ProblemDetails sin stack trace

  Scenario: Sin credenciales commiteadas
    Given el repositorio
    When  se escanea en busca de secrets
    Then  no existe SUPABASE_CREDENTIALS_GUIDE.md con credenciales reales
    And   la password de Supabase fue rotada en el dashboard
```

---

## 3. Mockups / Wireframes

- [ ] No aplica (PWA usa logo/colores existentes por tenant; sin diseño nuevo de UI)

---

## 4. Contrato Técnico (API)

### Endpoints nuevos

```
GET  /t/[tenant]/manifest.webmanifest          → manifest dinámico (TS route)
GET  /sw.js                                      → service worker
POST /api/tenants/[tenant]/push/subscribe        → suscripción push (Result Pattern)
POST /api/tenants/[tenant]/push/unsubscribe      → desuscripción
```

### Endpoints modificados

```
PATCH /api/tenants/[tenant]/services/[id]        → acepta shortDescription / longDescription
GET  /api/tenants/[tenant]/services/[id]         → (opcional) retorna las 3 descripciones
```

### Request (Zod Schema) — push subscribe

```typescript
const PushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});
```

### DomainError Variants

- `ValidationError` — payload push inválido / manifest malformado
- `NotFoundError` — tenant no existe
- `DatabaseError` — fallo de persistencia (servicios / suscripción)
- `ConfigurationError` — VAPID keys / DATABASE_URL faltantes (nuevo, para evitar fallback silencioso)

---

## 5. Impacto Multitenancy

- [x] Nueva tabla con `tenant_id` → `push_subscriptions` (endpoint, keys, userAgent, tenantId)
- [ ] Nueva RLS policy → pendiente evaluar (la nueva tabla sí la necesita)
- [x] Modifica queries existentes → services PATCH ahora lee/escribe 3 descripciones
- [x] Manifest es **por tenant** (una ruta dinámica que lee el tenant de la URL)
- [x] **Tenants de prueba E2E:** `wondernails`, `centro-tenistico`, `manada-juma`

---

## 6. Plan de Implementación

> Detalle operativo en `.agents/sprint/STRY-026-pwa-fix-servicios/plan.md` (pasos numerados, criterios de "hecho", riesgos, **Asunciones / defaults**).

Orden propuesto (bugs primero por bloquear operación, luego PWA, luego observabilidad):

### Tramo A — Fix DB + servicios (bloqueante)
1. Unificar `.env` (eliminar `.env.local` raíz → localhost).
2. Eliminar fallback silencioso en `connection.ts` (`ConfigurationError`).
3. Fix `admin_services` + PATCH route para manejar `description` / `shortDescription` / `longDescription`.
4. Reproducir y confirmar "error al buscar".

### Tramo B — PWA instalable
5. Ruta manifest dinámica por tenant (`app/t/[tenant]/manifest.webmanifest.ts`).
6. Service worker + registro desde layout.
7. Generación de íconos por tenant (fallback si el tenant no tiene logo).
8. Push notifications: tabla, endpoint subscribe/unsubscribe, generación VAPID.

### Tramo C — Observabilidad
9. Curar Sentry (tags por tenant, `beforeSend`, breadcrumbs).
10. Eliminar `SUPABASE_CREDENTIALS_GUIDE.md`; rotar password (acción del dueño).
11. (Bloqueado por credenciales del dueño) análisis de logs reales Vercel/Supabase.

### Tramo D — QA
12. `testing-usuario.md` por escenario × tenant; Playwright headed → headless; UT.

---

## 7. Checklist de Calidad

- [ ] Tests unitarios ≥80% cobertura en código nuevo (push service, manifest, db-config)
- [ ] Tests E2E pasando (PWA install, guardar servicio, buscar, push subscribe) sin skips
- [ ] Result Pattern en lógica nueva (push, manifest, configuration check)
- [ ] `tenant_id` filtrado en todas las queries nuevas
- [ ] `npm run build` / `lint` / `typecheck` sin errores
- [ ] Documentación actualizada (BACKLOG.md, summaries)
- [ ] **§ 1.3:** `testing-usuario.md` derivado de la US; entorno levantado; `jagzao@gmail.com`/`admin` en cada slug; escenarios ejecutados por el agente
- [ ] **Visto bueno del dueño** antes de `done` + push/publicar

---

## 8. Métricas de Éxito

| Métrica                          | Target       | Actual |
| -------------------------------- | ------------ | ------ |
| Lighthouse PWA installable       | 100%         | —      |
| Servicios guardados correctamente | 100%        | roto   |
| Sesgo DB localhost eliminado     | 0 envs localhost prod | 1     |
| Errores capturados en Sentry     | con tag tenant | parcial |
| Cobertura código nuevo           | ≥80%         | —      |

---

## 9. Notas y Riesgos

- **Riesgo seguridad alto:** credenciales Supabase en `SUPABASE_CREDENTIALS_GUIDE.md` y `check-services-schema.js` (commiteados). Requiere **rotación por el dueño** (no la puedo cambiar yo).
- **Riesgo PWA:** Next 16 + service worker en App Router requiere verificar compatibilidad (`next-pwa` puede estar desactualizado; SW manual es más seguro).
- **Riesgo push:** Vercel serverless + web-push necesita confirmar que el payload pequeño cabe en el límite.
- **Dependencia del dueño:** para análisis de errores reales (Tramo C.11) se requieren URLs/credentials que el dueño se comprometió a compartir.
- **Asunciones / defaults** (aceptadas por el dueño, respuesta "0" = ninguna a refinar): ver lista de 10 en `plan.md` § Asunciones.

---

**Orquestador:** Al recibir esta story, el agente ejecuta:
`kilo run story --id STRY-026` → PM (✅ done) → Architect → Dev → QA (Playwright CLI) → **visto bueno del dueño** → `done` → push/publicar.

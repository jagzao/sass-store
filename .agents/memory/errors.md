### 2026-06-06 — implement — Errores Buffer en crypto y whatsapp webhook (preexistentes)
**Error:** `Buffer` no es asignable a `Uint8Array` / `ArrayBufferView` en `lib/crypto/token-encryption.ts` y `app/api/whatsapp/webhook/route.ts`. Errores preexistentes no introducidos por STRY-025.
**Intento 1:** Corregir `typecheck` local de archivos nuevos — éxito. Estos errores permanecen en archivos legados fuera del alcance de la story.
**Estado final:** Omitido (no bloquea build de Next.js; se ignora en CI existente).

### 2026-06-27 — SDD+E2E validation — Build de Next.js ahora pasa; servidor `next start` inestable
**Estado actual:** `npm run build` ahora sí completa exitosamente (1m6s, 1253 páginas, todas las rutas listadas).  
**Nuevo problema:** `npx next start -p 3002` levanta y responde health check brevemente, pero se muere al poco tiempo con `[tenant] High unknown host rate: 100.00%`. El proceso `node` termina; intentos de seed o segundo fetch reciben `ECONNREFUSED` / `ECONNRESET`.
**Impacto:** Playwright E2E no puede confiar en el servidor local; se cae antes o durante la ejecución.
**Intentos:** Levantar servidor 3 veces; health OK una vez; seed devuelve 404 (endpoint deshabilitado en prod) o ECONNRESET cuando el proceso muere.
**Estado:** BLOQUEANTE DE ENTORNO. Build OK, runtime inestable. Posible causa: el servidor intenta resolver `tenant` desde `Host` header y falla/alta ratio de unknown host; podría ser un crash silencioso de middleware de tenant o inicialización que no tolera localhost/127.0.0.1.

### 2026-07-07 — STRY-026 quality-runner — Dev server crash = OOM (resuelto)
**Síntoma:** `next dev` (Turbopack y webpack) muere bajo carga de tests E2E secuenciales, sin stack trace (el proceso termina; `ERR_CONNECTION_REFUSED` en el siguiente request).
**Causa raíz:** OOM — Node excede el heap por defecto compilando rutas on-demand bajo carga de Playwright. Confirmado: con `NODE_OPTIONS=--max-old-space-size=4096` el server aguantó login + 3 tests de servicios + 4 requests consecutivos sin morir; sin el flag moría al 2do-3er request.
**Fix aplicado:** `apps/web/package.json` → `"dev": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev -p 3003 --webpack"`. Esto desbloquea TODA la validación E2E, no solo STRY-026.
**Estado:** RESUELTO.

### 2026-07-07 — STRY-026 quality-runner — E2E servicios bloqueado por rol (datos, no código)
**Síntoma:** tras login OK (`jagzao@gmail.com`/`admin`), `/t/wondernails/admin_services` no renderiza el botón "Nuevo Servicio".
**Causa raíz:** `AdminRouteGuard` requiere `session.user.role === "Admin"`; en la DB Supabase, `users.role` de jagzao es **NULL** → el guard redirige a `/t/wondernails` (home) y renderiza null.
**Acción:** es un issue de seed/datos, no de código STRY-026. Pendiente: setear `role='Admin'` para jagzao (mutación en prod Supabase — requiere visto bueno del dueño). El código de STRY-026 (3 descripciones en routes + form) está build-verificado; el filter está unit-testeado.
**Estado:** BLOQUEANTE de datos para el E2E de servicios (SC-07/08).

### 2026-07-07 — STRY-026 quality-runner — "Bug auth" era FALSO: auth funciona; era OOM + test timing
**Síntoma inicial:** tras login, `/admin_services` redirigía a home; se sospechó `session.user.role` vacío.
**Investigación:** login real vía Playwright + dump de `/api/auth/session` mostró `session.user.role = "Admin"` correcto; `admin_services` renderiza el botón "Nuevo Servicio". El auth **NO tiene bug**.
**Causa real de los fallos previos:** (1) el dev server moría por OOM antes de completar el flujo (fix: `NODE_OPTIONS=--max-old-space-size=4096`); (2) el test usaba `waitForURL(/\/t\//)` que matcheaba la URL de login *antes* de que el login completara → `goto(admin_services)` corría sin sesión → AdminRouteGuard rebotaba.
**Fix del test:** `waitForURL` ahora espera la HOME (`/t/{tenant}` sin `login`) confirmando sesión establecida.
**Estado:** RESUELTO. E2E SC-07/08/09 en verde. No hay bug de auth.
**Error:** `npx tsc --noEmit` (apps/web) reporta 22 errores `implicit any` (TS7006/TS7031) en archivos **no tocados** por STRY-026: `components/finance/{BudgetManager,CategoryManager,FinancialDashboard}.tsx`, `components/inventory/SupplyExpenseReport.tsx`, `hooks/use{Budgets,Categories,SupplyExpenses}.ts`, `components/admin/menu-designer/MenuEditor.tsx`.
**Estado:** no corregidos (fuera de alcance). `next build` (Turbopack) pasa a pesar de ellos; `npm run lint` = 0 errores. Código nuevo de STRY-026 = 0 errores de tipo.
**Acción:** deuda para otra US.

### 2026-07-16 — STRY-029 quality-runner — Build falla por módulos legales preexistentes
**Síntoma:** `npm run build` falla con 4 errores de Turbopack:
- `./apps/web/lib/services/dataPrivacyRequestService.ts:2:1` Export `dataPrivacyRequests` doesn't exist in `@sass-store/database/schema`
- `./apps/web/lib/services/legalConsentService.ts:3:1` Export `legalConsents` doesn't exist
- `./apps/web/lib/services/legalDocumentService.ts:2:1` Export `legalDocuments` doesn't exist (×2)
**Impacto:** Build roto global, no introducido por STRY-029. UserMenu no tiene relación con estos imports.
**Estado:** BLOQUEANTE PREEXISTENTE. No corregido en esta story para no ampliar alcance. Requiere sincronizar schema de DB con exports de `packages/database/schema.ts`.

### 2026-08-05 — bugfix — Redirección de rutas tenant caía al login global `/auth/signin` en vez de `/t/{tenant}/login`
**Síntoma:** visitar una ruta admin de tenant sin sesión (p. ej. `/t/wondernails/admin`) redirigía a `http://localhost:3003/auth/signin?callbackUrl=...` en lugar de `http://localhost:3003/t/wondernails/login?callbackUrl=...`.
**Causa raíz:** varios guards usaban el login global de NextAuth (`/auth/signin` o `/api/auth/signin`) en vez del login del tenant actual:
- `apps/web/app/t/[tenant]/admin/layout.tsx`
- `apps/web/app/t/[tenant]/admin/quotes/page.tsx` y `[id]/page.tsx`
- `apps/web/lib/auth/tenant-validation.ts` (errores de validación)
- `apps/web/proxy.ts` (bloqueo de rutas `/t/*/admin` sin cookie)
**Fix aplicado:** todos los puntos anteriores ahora construyen URL de login con prefijo `/t/{tenantSlug}` y conservan `callbackUrl`. El login global `/auth/signin` solo se usa para rutas sin contexto de tenant (`/admin` nativo).
**Regresión:** `tests/e2e/auth/multi-tenant-admin-login.spec.ts` verifica que `/t/{tenant}/admin` sin sesión llega a `/t/{tenant}/login` para todos los tenants activos.
**Estado:** RESUELTO.

### 2026-08-07 — STRY-033 test-implementation — feedback-error-trigger no visible en /_test-error (preexistente)
**Síntoma:** `tests/e2e/error-feedback-widget.spec.ts` — 2 casos fallan: `getByTestId("feedback-error-trigger")` timeout en `/_test-error` y `/t/{tenant}/_test-error`.
**Verificación:** reproducido con `git stash` (código de STRY-033 fuera del working tree) — falla igual. No es una regresión introducida por el ícono de feedback en `TenantHeader`.
**Estado:** NO CORREGIDO — fuera de alcance de STRY-033. Pendiente investigar por separado (posible cambio en `app/_test-error/page.tsx` o `FeedbackErrorTrigger` sin acompañar el test, o timing del boundary de error).

### 2026-08-07 — bugfix (post STRY-034) — Hero carousel de wondernails: texto invisible/parpadeante al cargar
**Síntoma:** el panel de texto del slide principal ("DESTACADO", título, topic, descripción, botón "VER MÁS") aparecía en blanco o borroso durante varios segundos al cargar `/t/wondernails`, tanto en local como en producción (Vercel). Reportado por el usuario con capturas de pantalla.
**Reproducción:** con Playwright headed (`document.visibilityState`/`hasFocus` reales, no la tab de automatización de Chrome extension que da falsos negativos por estar en background) se confirmó vía polling de `getComputedStyle(title).opacity` cada 400ms: la opacidad subía a ~0.97, y luego CAÍA de vuelta a ~0.3 (con blur y translateY) antes de volver a subir a 1 varios segundos después — un reinicio de la animación de entrada, no una animación lenta.
**Causa raíz:** `HeroWondernailsFinal.tsx` renderiza `defaultSlides` (placeholder) inmediatamente y dispara el stagger de entrada (`staggerMainText`, GSAP `fromTo opacity 0→1`). Cuando el fetch async de servicios/productos reales completa, `setSlides(mappedSlides)` reemplaza los slides — como el `key` de `CarouselItem` era `` `${slide.img}-${idx}` ``, y las imágenes reales difieren de las placeholder, React desmontaba y remontaba los nodos, y el `useLayoutEffect` (que dependía de `slides`) volvía a disparar el stagger desde `opacity:0` a mitad del primer ciclo — dejando el texto invisible/borroso durante el reinicio.
**Fix:** (1) `key={idx}` en vez de `` key={`${slide.img}-${idx}`} `` — mantiene la identidad del nodo DOM al cambiar de placeholder a datos reales, así React actualiza el contenido in-place en vez de remontar. (2) Se quitó `slides` del array de dependencias del `useLayoutEffect` de inicialización — el stagger de entrada corre una sola vez al montar, no se repite cuando cambian los datos.
**Test de regresión:** `tests/e2e/tenant/wondernails-hero-carousel.spec.ts` — verifica que la opacidad del título nunca regresa por debajo de 0.5 después de haber alcanzado ≥0.85 (detecta el patrón de reinicio), y que el título es visible (opacidad > 0.8) a los pocos segundos de cargar.
**Estado:** RESUELTO. Verificado visualmente (screenshot) y con Playwright antes/después del fix.

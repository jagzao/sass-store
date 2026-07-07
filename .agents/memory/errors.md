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

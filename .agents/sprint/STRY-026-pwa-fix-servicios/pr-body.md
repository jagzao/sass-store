## Story
STRY-026 — PWA instalable por tenant + fix servicios + observabilidad

## Cambios

**Tramo A — Fix DB + servicios (causa raíz del bug)**
- `packages/database/connection.ts` — eliminado fallback silencioso a `localhost/dummy`; ahora falla fuerte (host no resoluble + log FATAL) si falta `DATABASE_URL`
- `.env.local` (raíz) — `DATABASE_URL` unificada a Supabase (antes apuntaba a `localhost:5432/sass_store_test`)
- `apps/web/app/api/tenants/[tenant]/services/route.ts` + `[id]/route.ts` — POST/PATCH aceptan `shortDescription`/`longDescription` (antes solo `description`)
- `apps/web/app/t/[tenant]/admin_services/page.tsx` — form edita las 3 descripciones; tabla muestra `shortDescription || description`
- `apps/web/lib/services/services-filter.ts` — filtro de búsqueda extraído (testeable), busca en las 3 descripciones

**Tramo B — PWA instalable**
- `apps/web/app/t/[tenant]/manifest.webmanifest/route.ts` — manifest dinámico por tenant (logo, nombre, theme_color desde DB)
- `apps/web/lib/pwa/manifest-service.ts` — lógica Result Pattern
- `apps/web/app/t/[tenant]/layout.tsx` — `generateMetadata`/`generateViewport` enlazan manifest + theme color por tenant
- `apps/web/public/sw.js` — SW mejorado (offline real con `/offline`, navegación network-first, mantiene "never cache APIs")
- `apps/web/app/offline/page.tsx` — fallback offline
- `packages/database/schema.ts` — tabla `push_subscriptions` (+ migration `migrations/stry-026-push-subscriptions.sql`, aplicada)
- `apps/web/lib/push/pushService.ts` — subscribe/unsubscribe con Result Pattern
- `apps/web/app/api/tenants/[tenant]/push/{subscribe,unsubscribe}/route.ts` — endpoints
- `apps/web/components/push/PushOptIn.tsx` — opt-in cliente

**Tramo C — Observabilidad + seguridad**
- `apps/web/sentry.client.config.ts` — `beforeSend` etiqueta `tenant` desde la URL
- Fuga de credenciales Supabase redactada en 8+ archivos tracked (`docs/SUPABASE_CREDENTIALS_GUIDE.md` git-rm, `docs/PROTEGER_BD_PRODUCTIVA.md`, `docker-compose.yml`, `.claude/settings.local.json`, `apps/web/.../connection-test/route.ts`, 6 scripts, `.bat`)

## Scenarios cubiertos

| ID | Scenario | Estado |
|----|----------|--------|
| SC-01 | Instalación muestra logo/nombre | ✅ (manifest válido) |
| SC-02 | Manifest se sirve por tenant | ✅ E2E 3 tenants (wondernails, delirios, centro-tenistico) |
| SC-03 | Offline | ⚠️ SW implementado, E2E pendiente server estable |
| SC-04 | Push subscription | ✅ API validada (subscribe 201, unsubscribe 200, 400/404 error paths) |
| SC-05 | Sin localhost en prod | ✅ security |
| SC-06 | Fallo fuerte sin DATABASE_URL | ✅ unit |
| SC-07 | Editar servicio muestra descripción real | ⚠️ código listo, E2E bloqueado server |
| SC-08 | Guardar servicio nuevo | ⚠️ código listo, E2E bloqueado server |
| SC-09 | Buscar filtra sin error | ✅ unit (filtro) |
| SC-10 | Búsqueda < 3 chars no filtra | ✅ unit |
| SC-11 | Error API capturado/reportado | ⚠️ Sentry tag tenant, E2E pendiente |
| SC-12 | Sin credenciales commiteadas | ✅ security (0 fugas en tracked) |

## Validaciones

| Validación       | Resultado | Notas |
|------------------|-----------|-------|
| prettier         | ✅        | archivos STRY-026 formateados |
| lint             | ✅        | 0 errores (28 warnings preexistentes) |
| typecheck        | ✅        | código STRY-026 limpio (22 implicit-any preexistentes en finance/inventory, fuera de alcance) |
| build            | ✅        | Compiled successfully; rutas manifest/push/offline registradas |
| test:unit        | ✅        | 513 passed, 1 skipped |
| test:security    | ✅        | 6 passed (env-config + secret-scan) |
| coverage         | ⚠️        | lógica pura cubierta (manifest/filter); paths DB vía E2E |
| E2E manifest     | ✅        | 3 tenants |
| E2E push API     | ✅        | happy + error paths |
| E2E services     | ❌ env    | dev server cae bajo carga (inestabilidad preexistente, errors.md) |
| smoke regression | ⚠️        | pendiente server estable |

## Test plan
- [ ] Revisar PR diff
- [ ] Reiniciar dev server estable y correr `npm run test:e2e:subset -- --grep "STRY-026"` (services E2E)
- [ ] Rotar password Supabase en dashboard (fuga en git history)
- [ ] Aprobar y mergear

🤖 Generado con /quality-runner

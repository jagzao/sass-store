# Architect Implementation Summary - Sass Store

> Última actualización: 2026-04-27 | Estado: VIGENTE | Dueño: Architect Agent
> Registro de **decisiones arquitectónicas aprobadas**, estado de adopción de patrones y deuda técnica estructural. Documento de referencia obligatoria para todo diseño de nuevos módulos.

---

## 1. Vision Arquitectónica

**Sass Store** es una plataforma SaaS multitenant para gestión de negocios (salones, estudios, centros deportivos). Diseñada para costos operativos ≤$5/mes por tenant con scale-to-zero.

**Stack tecnológico aprobado:**

| Capa | Tecnología | Decisión | Estado |
| ---- | ---------- | -------- | ------ |
| Framework | Next.js App Router (Port 3001) | Monolito UI + API colocadas | ✅ Vigente |
| Lenguaje | TypeScript strict | Tipado completo sin `any` | ✅ Vigente |
| ORM | Drizzle ORM + PostgreSQL | Reemplazó Prisma; mejor tree-shaking | ✅ Vigente |
| DB Host | Neon / Supabase | Autosuspend + branching para PRs | ✅ Vigente |
| Auth | NextAuth v5 beta | Google OAuth + credentials | ✅ Vigente |
| Cache | Upstash Redis | Rate limiting + colas | ✅ Vigente |
| Media | Cloudflare R2 | Store + variantes AVIF/WebP | ✅ Vigente |
| Hosting Frontend | Cloudflare Pages | Free tier + edge cache | ✅ Vigente |
| Hosting API | Cloud Run / Fly.io | 1 instancia max, scale-to-zero | ✅ Vigente |
| Monorepo | Turbo + npm workspaces | `apps/web` + `packages/*` | ✅ Vigente |
| Testing | Vitest (unit/int) + Playwright (E2E) | Separado, CI unificado | ✅ Vigente |

---

## 2. Decisiones Arquitectónicas Clave (ADRs)

### ADR-001: Patrón Result para manejo de errores

- **Estado:** APROBADO — obligatorio para todo código nuevo
- **Fecha:** 2025-Q4
- **Contexto:** try/catch dispersos, inconsistencia en respuestas API, fugas de errores sin tipo.
- **Decisión:** Implementar `Result<T, DomainError>` en `@sass-store/core` con combinadores (`map`, `flatMap`, `pipe`, `match`) y middleware `withResultHandler()` para API routes.
- **Responsable:** Architect Agent
- **Impacto:** ~46 API routes migradas; ~1,275 sitios legacy restantes en `apps/web/lib/db/*`, `hooks/`, rutas viejas.
- **Nota:** Ver `AGENTS.md` sección "Result Pattern Implementation".

### ADR-002: Monolito Next.js (App Router) vs Microservicios

- **Estado:** APROBADO
- **Fecha:** 2025-Q3
- **Contexto:** Equipo pequeño, necesidad de velocidad de desarrollo.
- **Decisión:** Mantener monolito en `apps/web` con todas las API routes en `app/api/**`. Los "microservicios" lógicos residen en `lib/server/**` y `lib/services/**`.
- **Consecuencia:** Build único mayor, pero deploy y CI más simples. Bundle guard de 250MB.

### ADR-003: Multitenancy por slug + RLS

- **Estatus:** APROBADO
- **Fecha:** 2025-Q3
- **Contexto:** Múltiples negocios compartiendo infraestructura con aislamiento de datos.
- **Decisión:** Resolución de tenant por prioridad (header `X-Tenant` > subdomain > path param `/t/[tenant]` > cookie > fallback `zo-system`). Aislamiento en DB mediante `tenant_id` + Row-Level Security (RLS) policies.
- **Nota:** Ver `docs/multi-tenant-best-practices.md`.

### ADR-004: Drizzle ORM sobre Prisma

- **Estatus:** APROBADO
- **Fecha:** 2025-Q4
- **Contexto:** Prisma generaba bundles grandes y cold-start lento en serverless.
- **Decisión:** Migrar a Drizzle ORM con esquema en `packages/database/schema.ts` (~2,934 líneas). Migraciones manuales con `drizzle-kit`.
- **Beneficio:** Mejor tree-shaking, queries SQL sin overhead ORM complejo.

### ADR-005: Media Pipeline optimizado (Cloudflare R2)

- **Estatus:** APROBADO
- **Fecha:** 2025-Q4
- **Contexto:** Subida de imágenes sin optimización generaba costos altos y LCP pobre.
- **Decisión:** Pipeline: Upload → Strip EXIF → Format convert (AVIF/WebP/JPEG) → Resize variants → Blurhash + DominantColor → Deduplicación por content hash → Store en R2 con prefijo `tenants/{slug}/`.
- **Tests:** `tests/e2e/media-pipeline/media-optimization.spec.ts`

### ADR-006: Quotas / Cost Guards (Eco/Warning/Freeze/Kill)

- **Estatus:** APROBADO
- **Fecha:** 2026-Q1
- **Contexto:** Prevenir costos imprevistos en tenants con tráfico alto o mal uso.
- **Decisión:** Niveles: 50% Eco (reduce calidad), 80% Warning (alertas), 90% Freeze (solo lectura), 100% Kill (modo mantenimiento). Implementado en middleware y API con headers `retry-after`.
- **Tests:** `tests/e2e/quotas/cost-guards.spec.ts`

---

## 3. Estado de Adopción de Patrones

### Result Pattern Adoption

| Área | Archivos migrados | Archivos legacy estimados | % Adopción |
| ---- | ----------------- | ------------------------ | ---------- |
| `apps/web/app/api/v1/**` (social, products) | ~12 rutas | 0 | ✅ 100% |
| `apps/web/app/api/finance/**` | ~8 rutas | 0 | ✅ 100% |
| `apps/web/app/api/payments/**` | ~3 rutas | 0 | ✅ 100% |
| `apps/web/app/api/tenants/[tenant]/**` (bookings, customers, services) | ~10 rutas | ~5 rutas | 🔄 ~67% |
| `apps/web/app/api/categories/**` | ~2 rutas | ~2 rutas | 🔄 ~50% |
| `apps/web/app/api/profile/**` | ~1 ruta | ~2 rutas | 🔄 ~33% |
| `apps/web/lib/db/**` (tenant-service, seed-data) | 0 | ~15 archivos | ⛔ 0% |
| `apps/web/hooks/**` (useRoleManagement, etc.) | 0 | ~8 archivos | ⛔ 0% |
| Services (`lib/server`, `lib/services`) | ~6 servicios | ~10 servicios | 🔄 ~37% |
| **Total estimado** | **~46 rutas/servicios** | **~1,275 sitios try/catch** | **🔄 ~35%** |

**Observación:** Los ~1,275 matches de try/catch incluyen tests y scripts. El número real de rutas/servicios de negocio legacy es más bajo (~40-50 archivos), pero sigue siendo bloque crítico.

### RLS / Multitenancy Adoption

| Área | Estado |
| ---- | ------ |
| Esquema DB (`packages/database/schema.ts`) | ✅ RLS policies definidas |
| Helper RLS (`packages/database/rls-helper.ts`) | ✅ Implementado |
| RBAC (`packages/database/rbac.ts`) | ✅ Implementado |
| Middleware tenant resolution | ✅ Implementado |
| Tests de aislamiento E2E | ✅ `tests/e2e/multitenant/` |

---

## 4. Deuda Técnica Arquitectónica

| # | Ítem | Severidad | Plan de mitigación | ETA |
|---|------|-----------|--------------------|----- |
| 1 | Middleware `middleware` convention deprecated en Next.js | P1 | Migrar a convención `proxy` o `_proxy` | Sprint actual |
| 2 | ~1,275 sitios try/catch sin Result Pattern | P1 | Migrar por fases (touched files first, luego críticos) | 3 sprints |
| 3 | `apps/web/lib/db/**` usa Prisma legacy en algunos helpers | P2 | Reemplazar con Drizzle queries tipadas | 2 sprints |
| 4 | `console.error` dispersos sin structured logging | P2 | Estandarizar con nivel `info/warn/error` + contexto tenant | Sprint actual |
| 5 | Build único de monolito crece; bundle guard 250MB se acerca | P2 | Evaluar code-splitting por tenant o lazy loading de dashboards | Futuro |
| 6 | NextAuth v5 beta — riesgo de breaking changes | P2 | Monitorear release notes; plan de migración a stable | Continuo |
| 7 | Falta event sourcing / audit trail completo | P3 | Diseñar tabla `audit_logs` con JSONB changes | Backlog |

---

## 5. Stándares Arquitectónicos Vigentes

### Convenciones de código (obligatorias)

```typescript
// ✅ Servicio debe retornar Result
export const getProduct = (id: string): Promise<Result<Product, DomainError>> => {
  return fromPromise(db.products.findUnique({ where: { id } }), (error) =>
    ErrorFactories.database("find_product", `Failed to find product ${id}`, undefined, error),
  );
};

// ✅ Handler de API usa withResultHandler
export const GET = withResultHandler(
  async (request): Promise<Result<Product, DomainError>> => {
    return await getProduct(id).flatMap(validateProduct).flatMap(checkPermissions);
  },
);

// ❌ FORBIDDEN: try/catch en lógica de negocio
export async function GET(request: NextRequest) {
  try {
    const product = await getProduct(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
```

### Estructura de rutas API aprobada

```
app/api/
├── v1/              # APIs públicas y versionadas
│   ├── products/
│   ├── public/
│   └── social/
├── tenants/[tenant]/# APIs por tenant (bookings, customers, services, etc.)
├── finance/         # Budgets, KPIs, matrix, movements, POS
├── inventory/       # Alerts, movements, suppliers
├── payments/        # Stripe / MercadoPago + refunds
├── auth/            # NextAuth handlers
├── users/           # Cart, profile
└── debug/           # Health checks (diagnose, ping, schema)
```

---

## 6. Roadmap Arquitectónico

### Phase 1: Foundation (Completado ~90%)

- [x] Result Pattern core (`packages/core/src/result/`)
- [x] Drizzle schema + RLS helpers
- [x] Tenant resolution + middleware
- [x] NextAuth v5 integration
- [x] Media pipeline (upload, optimize, variants)
- [x] Quotas / Cost Guards middleware

### Phase 2: Critical Paths (En Progreso)

- [x] Finance module (Result Pattern)
- [x] Payments module (Result Pattern)
- [x] Social planner module (Result Pattern)
- [x] **POS module (Result Pattern)** — migrado servicio + API `/api/finance/pos/sales` con `withResultHandler()` y `POSService` | 2026-04-27
- [ ] Booking module — migrar últimas rutas legacy (50% restante)
- [ ] Categories module — migrar a Result Pattern
- [ ] Profile module — migrar a Result Pattern

### Phase 3: Complete Migration (Backlog)

- [ ] `lib/db/**` helpers a Drizzle + Result Pattern
- [ ] `hooks/**` migrar a Result Pattern o manejo declarativo
- [ ] Structured logging tenant-aware
- [ ] Audit trail con event sourcing ligero
- [ ] Evaluar edge functions para workloads intensivos (image resize, PDF)

---

## 7. Checklist del Architect Agent (Diseño de Nuevos Módulos)

Antes de aprobar el diseño de un nuevo módulo o feature significativo:

- [ ] ¿Se definió el contrato de API con tipos Zod + Result Pattern?
- [ ] ¿Se identificaron los DomainError variants necesarios?
- [ ] ¿Se validó que todas las queries incluyan `tenant_id` o filtros RLS?
- [ ] ¿Se evaluó el impacto en bundle size (nuevas dependencias)?
- [ ] ¿Se definieron los planes de migración para código legacy afectado?
- [ ] ¿Se actualizó este documento con la nueva decisión arquitectónica?
- [ ] ¿Se notificó al Dev Leader sobre nuevas convenciones o breaking changes?
- [ ] ¿Se notificó al QA Leader sobre tests de integración/E2E necesarios?
- [ ] ¿Se notificó al PM sobre riesgos de timeline debido a deuda técnica relacionada?

---

## Registro de Decisiones (ADR Log)

| ID | Fecha | Decisión | Estado | Responsable |
|----|-------|----------|--------|-------------|
| ADR-001 | 2025-Q4 | Result Pattern obligatorio | APROBADO | Architect Agent |
| ADR-002 | 2025-Q3 | Monolito Next.js App Router | APROBADO | Architect Agent |
| ADR-003 | 2025-Q3 | Multitenancy slug + RLS | APROBADO | Architect Agent |
| ADR-004 | 2025-Q4 | Drizzle ORM sobre Prisma | APROBADO | Architect Agent |
| ADR-005 | 2025-Q4 | Media Pipeline R2 optimizado | APROBADO | Architect Agent |
| ADR-006 | 2026-Q1 | Quotas / Cost Guards | APROBADO | Architect Agent |

---

**🔥 Este documento es la autoridad técnica del proyecto. Cualquier desviación requiere revisión del Architect Agent y actualización de este registro.**

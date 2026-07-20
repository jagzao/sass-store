# STRY-030 Plan — Convertir zo-system en portal real de servicios de desarrollo

## Story

- Story canónica: `docs/stories/active/STRY-030-zo-system-services-portal.md`
- Estado: analysis
- Prioridad: P1
- Fuente: objetivo de negocio de `interview_nail/` (perfil público, gigs Fiverr, plan LinkedIn, CV real).

## Objetivo

Transformar `zo-system` de tenant de catálogo genérico en un portal de servicios de software creíble, alineado al perfil real de Juan German Zambrano Ortega: desarrollo full-stack .NET/React/Node/Next.js/Python, consultoría, automatización n8n y modernización de plataformas. Todo el contenido usado debe ser **público y apropiado para atraer clientes**; se excluye información fiscal, salarial, confidencial de empleadores actuales o detalles de contratos activos.

## Preguntas abiertas

Ninguna. Se resolvió en sesión previa:
1. Business type = `"development"` (único soportado).
2. Solo contenido público para adquisición de clientes.
3. Escribir plan primero.

## Asunciones / defaults

1. `zo-system` ya existe como tenant (`slug = 'zo-system'`). Se actualizará, no se recreará.
2. Se agregará/actualizará fila en `tenant_configs` con `category='business', key='type', value='development'` para activar `/t/zo-system/development`.
3. Se mantienen datos confidenciales fuera del portal: régimen fiscal, salario actual, cliente contractor activo, credenciales.
4. Se reutiliza el esquema de `services`, `products`, `dev_projects`, `dev_sprints`, `dev_tasks`, `dev_daily_reports` ya existente.
5. Se reutiliza `DevelopmentPortalClient` y API `/api/tenants/[tenant]/development/*`. No se crea nueva arquitectura.
6. Contenido en español principal; se permite inglés en títulos de proyectos/stack por audiencia mixta.
7. Imágenes de proyectos iniciales serán placeholders o gradientes (no se generan assets nuevos).

## Orden de trabajo

### 1. Base de datos y seed

**Archivos:**
- `packages/database/schema.ts` — ya tiene `tenant_configs` y tablas de development portal. No modificar salvo que falte algo.
- `apps/web/lib/db/seed-data.ts` — ajustar datos de `zo-system` y agregar seed de `tenant_configs` + projectos/sprints/tareas iniciales.
- `packages/database/migrations/add-development-portal-tables.sql` — ya aplicada; no tocar.

**Hechos por paso:**
1.1. Seed `tenant_configs` para `zo-system` con `value='development'`.
1.2. Actualizar descripción de `zo-system` a texto orientado a servicios.
1.3. Reemplazar servicios genéricos (`Tech Consultation`, `Code Review`, `API Design Session`) por 5-6 servicios reales basados en gigs Fiverr / plan LinkedIn, **incluyendo Node.js, Next.js y Python**:
  - Migración a .NET 8 / modernización de plataformas .NET.
  - Desarrollo de API REST / backend (.NET 8 / NestJS / Node.js).
  - Aplicaciones web con Next.js / React / TypeScript.
  - Bug fix / feature en .NET, React, Vue o Node.
  - Automatización de workflows con n8n / Python scripts.
  - Consultoría técnica / revisión de arquitectura (opcional como entry point).
1.4. Ajustar productos para reflejar entregables reales (starter kits, paquetes API). Opcional: dejar productos actuales si no generan ruido.
1.5. Seed 1-2 proyectos demo en `dev_projects` con sprints y tareas realistas que demuestren capacidad de delivery (ej. "Modernización API Saloneo", "Portal de Clientes Zo").
1.6. Ejecutar `npm run db:seed` en local; verificar que no duplica por condicionales `ON CONFLICT` / `select` previo.

### 2. Landing page y contenido público

**Archivos:**
- `apps/web/components/tenant/zo-system/ZoHero.tsx`
- `apps/web/components/tenant/zo-system/ZoServices.tsx`
- `apps/web/components/tenant/zo-system/ZoProjects.tsx`
- `apps/web/components/tenant/zo-system/ZoLandingPage.tsx`
- `apps/web/app/t/[tenant]/services/page.tsx` (o ruta equivalente existente)

**Hechos por paso:**
2.1. **Home principal `ZoHero`**: headline orientado a consultoría/desarrollo senior (ej. "Arquitectura & Desarrollo .NET/React/Node/Python para equipos remotos"), subtítulo con stack real (.NET 8, React, Next.js, TypeScript, Node.js, Python, Azure, n8n), CTAs a `/t/zo-system/services` y `/t/zo-system/development`.
2.2. **Home principal `ZoServices`**: reemplazar bullet genéricos con los 5-6 servicios reales del paso 1.3; incluir precios de referencia y tiempos de entrega aproximados; CTA a `/t/zo-system/services`.
2.3. **Home principal `ZoProjects`**: reemplazar proyectos placeholder por casos reales verificables o personal projects públicos:
  - Pochtech / sass-store (multi-tenant SaaS marketplace, Next.js + .NET 8 + n8n).
  - Saloneo (multi-tenant ERP salón, React + Supabase + Vercel).
  - Portal de citas multi-tenant (genérico, sin nombre de cliente confidencial).
  - Whisper transcription CLI (Python + FFmpeg + OpenAI).
2.4. **Home principal `ZoLandingPage`**: ajustar `<title>`/meta description si existe; agregar sección de stack/tecnologías si no hay; asegurar que el home cargue servicios desde API para no duplicar data.
2.5. **Página pública de servicios `/t/zo-system/services`**: reutilizar la ruta existente del catálogo; si la UI actual es genérica, crear/ajustar componente tenant-specific que liste los servicios seedeados con precios, duración y descripción corta. Debe mostrar los 5-6 servicios reales.

### 3. Portal de cliente `/t/zo-system/development`

**Archivos:**
- `apps/web/app/t/[tenant]/development/page.tsx` — ya bifurca por business type.
- `apps/web/app/t/[tenant]/development/DevelopmentPortalClient.tsx` — ya renderiza proyectos/sprints/daily.
- `apps/web/lib/tenant/development-guard.ts` — ya soporta `"development"`.

**Hechos por paso:**
3.1. Verificar que `resolvePortalTenant("zo-system")` devuelve `businessType: "development"` tras el seed.
3.2. Asegurar que `DevelopmentPortalClient` muestra los proyectos/sprints seedeados con nombres reales.
3.3. Agregar un CTA en el portal para contactar/agendar consulta (link a `/t/zo-system/services`).
3.4. Opcional: permitir generar daily report manual si no hay datos; ya existe endpoint `generate=true`.

### 4. Tests

**Archivos:**
- `tests/unit/development-service.spec.ts` — ya cubre lógica. Mantener. No borrar tests existentes.
- Nuevo: `tests/unit/zo-system-portal-seed.spec.ts` (opcional) para validar que servicios seedeados tienen slugs/nombres esperados. ponytail: skip si agrega boilerplate; preferir assert dentro del mismo service test o demo.
- Nuevo Playwright E2E: `tests/e2e/zo-system-portal.spec.ts` con 2 tests:
  - landing de `zo-system` muestra servicios reales.
  - `/t/zo-system/development` redirige a login si no hay sesión, y muestra proyectos tras login.

### 5. Validación

Pipeline tras cada cambio:
1. `npx prettier --write` en archivos modificados.
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run test:unit`
6. E2E headed + headless sobre `zo-system`.
7. `npm run security:autofix` si aplica.

## Riesgos

- Usar contenido del CV sin filtrar puede filtrar datos personales o confidenciales. Revisar cada bullet antes de merge.
- Cambiar servicios/productos seedeados puede afectar tests E2E existentes que esperan `Tech Consultation` u otros nombres. Revisar `tests/e2e` y actualizar si es necesario.
- `zo-system` es fallback tenant; cambiar su `mode` o configuración puede afectar flujos de auth/E2E que asumen `catalog`/`booking`. Verificar `tests/e2e/auth/login-zosystem.spec.ts` y `fallback-comprehensive.spec.ts`.
- Modificar `tenant_configs` en seed puede requerir actualizar `tests/setup/test-database.ts` o fixtures.

## DoD

- `zo-system` tiene `tenant_configs` con business type `"development"`.
- Home (`/t/zo-system`) muestra headline, stack y CTAs actualizados.
- Home y `/t/zo-system/services` muestran los 5-6 servicios reales con precios/duración.
- `/t/zo-system/development` es accesible y renderiza proyectos/sprints seedeados.
- Tests unitarios existentes siguen pasando; nuevos tests E2E pasan.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit` verdes.
- `testing-usuario.md` actualizado y ejecutado por agente con credenciales `jagzao@gmail.com`/`admin`.
- Visto bueno del dueño antes de marcar `done`.

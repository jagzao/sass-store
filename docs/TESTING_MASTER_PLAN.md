# Plan Maestro de Pruebas — Fase 1 (Multitenant Core)

## Objetivo

Validar de extremo a extremo (E2E) e integración que cada tenant opera de forma aislada y con UX de mínimo número de clics, que el planner social guarda la programación (sin publicar), que la media se optimiza al subir, y que SEO/A11y/Performance cumplen los presupuestos.

## 0) Alcance y Actores

### Módulos Incluidos

- **Storefront por tenant**: catálogo/servicios estilo Amazon (Home/PLP → PDP → carrito/checkout o reserva)
- **Autenticación Google + roles**: Visitante / Cliente / Staff / Admin
- **Admin por tenant**: Branding (logo/colores/tipografía), Catálogo, Agenda/Pedidos (calendario), Planner social (planificación)
- **Media pipeline**: subida con optimización (AVIF/WebP, variantes, EXIF off, blurhash, dominantColor, dedup)
- **Multitenancy estricto**: RLS por tenantId (UI + API + cache + storage)
- **Fallback**: si no se resuelve tenant de dominio/URL → zo-system (SEO correcto)
- **Quotas/cost-guards**: avisos 80/90/100% + modos eco/freeze/kill
- **SEO/A11y/Perf**: presupuestos y validaciones

### Tenants (todos entran a prueba)

- **zo-system** (default/fallback) — modo catálogo
- **wondernails** — booking
- **vigistudio** — booking
- **villafuerte** (Centro Tenístico Villafuerte) — booking
- **vainilla-vargas** — catálogo
- **delirios** — catálogo
- **nom-nom** — catálogo

### Roles de Prueba

- Admin por tenant
- Staff por tenant
- Cliente por tenant
- Visitante

## 1) Ambientes, Datos y Convenciones

### Entornos

- Local/staging/prod (QA prioriza staging)
- TZ por defecto: America/Mexico_City
- Idioma: ES (puede haber FR/EN en futuro; preparar SEO hreflang más adelante)

### Semillas Mínimas por Tenant

- **Catálogo/Servicios**: 10–20 ítems con imágenes
- **Agenda**: al menos 1 staff y slots disponibles (booking)
- **Planner social**: 5–10 posts futuros (varias redes)
- **Cuentas**: 1 Admin, 1–2 Staff, 1 Cliente

### Selectores de Test (Norma)

- Usar `data-testid="..."` siempre para elementos clave (botones de compra, reservar, guardar, duplicar, subir media)
- Nunca basarse en texto visible que pueda cambiar; no usar selectores frágiles por CSS

## 2) Self-healing (Auto-sanación) Aplicado a E2E y al Sistema

### En E2E (Playwright/CI)

- Esperas por estado (visible/habilitado/estabilidad de red) en vez de sleep
- Reintento controlado (1–2) sólo en pasos flakey conocidos (primer render, fetch lento); si falla una aserción lógica → no reintentar (es bug)
- Idempotencia: limpiar sesión, semilla por run, clocks fijos al crear reservas
- Auto-relogin si el token expiró (una sola vez, con traza)
- Screenshots/video/trace automáticos en fallas

### En el Sistema

- Reintentos con backoff ante 5xx externos (p.ej., consulta de slots), timeouts y circuit breakers
- Reconexión DB/Redis cuando se corta
- Healthchecks liveness/readiness; reinicio del contenedor si hay degradación sostenida
- **Regla**: toda acción de self-healing deja log (para auditar que no se están ocultando defectos)

## 3) Presupuestos de UX (Click-budgets)

- **Compra desde Home/PLP**: ≤ 3 clics (Agregar → Ver mini-cart → Pagar)
- **Reserva desde Home/PLP (booking)**: ≤ 2 clics (slot preseleccionado → Confirmar)
- **Reordenar**: ≤ 1 clic desde "Comprar de nuevo"
- **Admin acciones frecuentes** (guardar cambios, subir imagen, programar post): ≤ 2 clics

## 4) Matriz de Cobertura (roles × tenants × módulos)

| Módulo / Caso                  | zo-system                 | wondernails | vigistudio | villafuerte | vainilla-vargas | delirios | nom-nom |
| ------------------------------ | ------------------------- | ----------- | ---------- | ----------- | --------------- | -------- | ------- |
| Storefront (compra/PLP/PDP)    | ✔️                        | ⚪          | ⚪         | ⚪          | ✔️              | ✔️       | ✔️      |
| Storefront (reserva rápida)    | ⚪                        | ✔️          | ✔️         | ✔️          | ⚪              | ⚪       | ⚪      |
| Admin Branding                 | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |
| Admin Catálogo/Servicios       | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |
| Admin Agenda/Pedidos           | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |
| Planner Social (planificación) | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |
| Media Upload/Optimización      | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |
| Fallback a zo-system           | ✔️ (validación principal) | —           | —          | —           | —               | —        | —       |
| Aislamiento multitenant        | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |
| SEO/A11y/Perf                  | ✔️                        | ✔️          | ✔️         | ✔️          | ✔️              | ✔️       | ✔️      |

## 5) Casos E2E Detallados (por flujo crítico)

**Formato**: Precondición → Pasos → Expectativas (incluye click-budget y validaciones de datos/estado)

### 5.1 Compra Rápida (catálogo)

**Tenants**: vainilla-vargas, delirios, nom-nom, (zo-system como sanity)
**Rol**: Visitante/Cliente
**Pre**: catálogo con productos disponibles, imágenes optimizadas

**Pasos**:

1. Visitar /t/nom-nom
2. En Home/PLP, Agregar en un producto destacado
3. Mini-cart sticky muestra el item; clic en Pagar
4. Confirmar (mock o flujo real según entorno)

**Expectativas**:

- ≤ 3 clics totales
- Orden creada con tenantId correcto; totales calculados; mini-cart no bloquea navegación
- Imagen en PDP/PLP carga variante optimizada (no original), con blurhash en LQIP

### 5.2 Reserva Rápida (booking)

**Tenants**: wondernails, vigistudio, villafuerte
**Rol**: Cliente (logueado con Google)

**Pasos**:

1. Visitar /t/wondernails
2. Sección "Reservar otra vez": CTA muestra primer slot disponible
3. Confirmar reserva

**Expectativas**:

- ≤ 2 clics
- Evento/pedido con staffId y slot válidos; timezone correcta; si hay sync, estado "pendiente de sync" → "sincronizado"

### 5.3 Reordenar en 1 Clic

**Tenants**: delirios (o cualquiera de catálogo)
**Rol**: Cliente con historial

**Pasos**:

1. Ir a módulo "Comprar de nuevo"
2. Clic "Reordenar"

**Expectativas**:

- ≤ 1 clic
- Orden clonada con mismo ítem(s), tenantId correcto

### 5.4 Aislamiento Multitenant

**Tenants**: cualquiera; probar alternando
**Rol**: Cliente logueado

**Pasos**:

1. Navegar /t/wondernails → agregar algo al carrito
2. Cambiar a /t/nom-nom

**Expectativas**:

- Carrito reseteado; cachés por queryKey incluyen tenant.slug
- Ningún producto/orden/slot de otro tenant aparece
- Endpoints devuelven 403/404 si se intenta cruzar tenantId

### 5.5 Admin — Branding

**Tenants**: todos
**Rol**: Admin

**Pasos**:

1. Cambiar color primario y logo
2. Guardar; refrescar Storefront

**Expectativas**:

- Tokens aplicados; contraste AA
- Mapa en "Contacto" se carga lazy; datos de contacto visibles

### 5.6 Admin — Catálogo/Servicios (CRUD)

**Tenants**: todos
**Rol**: Admin/Staff

**Pasos**:

1. Crear producto/servicio con imagen
2. Editar precio/duración
3. Desactivar y luego reactivar
4. Eliminar (o archivar si aplica)

**Expectativas**:

- Visible en PLP cuando activo; oculto cuando desactivado; metadatos de media persistidos

### 5.7 Admin — Agenda/Pedidos

**Tenants**: todos
**Rol**: Admin/Staff

**Pasos**:

1. Crear evento/pedido desde calendario
2. Editar hora/nota
3. Cancelar

**Expectativas**:

- Estados coherentes; si hay sync: flags de sincronización correctos

### 5.8 Planner Social (planificación, sin publicación)

**Tenants**: todos
**Rol**: Admin/Staff

**Pasos**:

1. Abrir Planner (Mes)
2. Crear post: título, contenido, multiselect redes, hora/TZ, varias imágenes (picker)
3. Programar
4. Duplicar y mover por drag&drop; editar override de una red

**Expectativas**:

- Post pasa a scheduled; targets por red creados con assetIds
- Vista Año (heatmap) refleja densidad; Semana/Día muestran detalles

### 5.9 Fallback y SEO

**Tenant**: host no mapeado
**Rol**: Visitante

**Pasos**:

1. Entrar con un dominio/subdominio no registrado

**Expectativas**:

- Render de zo-system (fallback)
- Canonical a zo-system o noindex
- No aparecen datos de otros tenants

### 5.10 Quotas y Cost-guards

**Tenants**: 1–2 fijados para pruebas de límite
**Rol**: Admin/Staff

**Pasos**:

1. Forzar subida de media hasta 80/90/100% (usar archivos pequeños repetidos)
2. Forzar posts planner hasta tope
3. Forzar pedidos hasta tope

**Expectativas**:

- Avisos en 80/90/100%; comportamiento por modo:
  - **eco**: restringe extras (p.ej., 1 imagen)
  - **freeze**: sólo draft; no schedule
  - **kill**: bloquea endpoints no críticos
- 429 amable con texto de upgrade donde aplique

## 6) Pruebas de Integración (API/DB/Cache)

### Contrato API (resumen de endpoints)

**Productos/Servicios**:

- `GET /api/v1/products?search`
- `POST /api/v1/products`
- `PATCH/DELETE /api/v1/products/:id`

**Pedidos/Reservas**:

- `POST /api/v1/orders`
- `POST /api/v1/bookings`
- `PATCH /.../:id`

**Media**:

- `POST /api/v1/media/upload` (form-data)

**Planner**:

- `GET /api/v1/social/posts?from&to&status&platform`
- `POST /api/v1/social/posts` (draft + targets por multiselect)
- `GET/PATCH/DELETE /api/v1/social/posts/:id`
- `POST /api/v1/social/posts/:id/schedule`
- `POST /api/v1/social/posts/:id/cancel`
- `PATCH/DELETE /api/v1/social/targets/:id`

### Validaciones Comunes

- `x-tenant` obligatorio (o derivación inequívoca); todo filtra por tenantId
- ProblemDetails en 4xx/5xx con type/title/status/detail
- Rate-limit por tenant (429 con retry-after si aplica)
- Cache tags por tenant: invalidación `tenant:{id}:...`

### DB/RLS

- Cualquier query sin tenantId → falla; tests de lectura/escritura cruzada deben devolver 403/404
- Migrations idempotentes y constraints de FK consistentes (media → posts/targets)

## 7) SEO — Test & Optimización (por tenant)

### Páginas a Auditar por Tenant

- Home `/t/[slug]`
- PLP (paginada) `/t/[slug]/products` y/o `/services`
- PDP/Service `/t/[slug]/products/{id}`
- Contacto `/t/[slug]/contact`

### Checklist

- **Metadatos por tenant**: `<title>`, `<meta name="description">`, favicon/logo
- **Canonical por ruta**; en fallback: canonical a zo-system o noindex
- **OpenGraph/Twitter**: título, descripción, imagen (variant optimizada del tenant)
- **Structured data (JSON-LD)**:
  - LocalBusiness/Organization en Contacto (nombre, dirección, teléfono, horario, geo si aplica)
  - Product/Service en PDP (nombre, precio, availability)
  - BreadcrumbList en PDP si hay jerarquías
- **Sitemap por tenant** y robots.txt correcto
- **Performance (Core Web Vitals)**: LCP P75 < 2.5 s, INP P75 < 200 ms, CLS < 0.1
- **Imágenes**: loading="lazy" bajo el fold, dimensiones fijas para evitar CLS, servir AVIF/WebP
- **Accesibilidad AA** (ver sección A11y)

### Pruebas

- Lighthouse (staging) por tenant en páginas clave (guardar reportes)
- Broken links scan; verificación de canonicals y noindex en fallback
- Confirmar que PLP paginada no crea contenido duplicado (rel prev/next si aplica)

## 8) Accesibilidad (A11y)

### Criterios

- Contraste AA (texto/íconos en botones y links)
- Navegación por teclado completa (focus visible)
- Labels y roles correctos (formularios, diálogo, carruseles)
- Textos alternativos en imágenes clave (logo, productos)
- Anuncios ARIA en operaciones (agregar al carrito, guardar, programar)

### Pruebas

- Recorrido con teclado de Storefront y Admin
- Validar focus order lógico en Composer y en Checkout/Reserva

## 9) Performance

### Presupuestos

- LCP P75 < 2.5 s en Home/PLP
- INP P75 < 200 ms en interacciones principales (Agregar/Reservar/Guardar)
- Peso JS por ruta con code-splitting y RSC; imágenes optimizadas

### Verificaciones

- Streaming SSR en páginas RSC; no blocking modals en operaciones críticas
- Cache hit-rate en CDN; stale-while-revalidate activo en PLP

## 10) Observabilidad y Auditoría

- Logs con tenant, route, latency, status, userId?
- Auditoría de acciones críticas: login, cambio de branding, CRUD catálogo, crear/editar/programar posts, crear/cancelar reservas/pedidos
- Alarmas básicas: tasa de 5xx, UnknownHostRate (fallback), media-errors

## 11) Reporte de Bugs y Severidad

### Severidad

- **P0**: fuga de datos entre tenants, checkout/reserva imposible, caída global
- **P1**: pérdida de función clave (upload media, programar post)
- **P2**: bug con alternativa temporal (UI menor, copy)
- **P3**: cosmético/documentación

### Reporte Mínimo

Tenant, Rol, Ruta exacta, Pasos, Resultado esperado vs. real, Evidencias (capturas/trace), Logs si hay

## 12) Criterios de Salida (Release Gates)

- Todos los E2E críticos en verde por tenant (compra/reserva/reorden/branding/CRUD/Planner)
- Aislamiento multitenant probado (sin fugas)
- Media pipeline estable (subida/variantes/dedup)
- SEO/A11y/Perf cumplen presupuestos
- Sin P0/P1 abiertos

## 13) Anexos

### Política de Datos de Prueba

- No reusar cuentas reales; usar fixtures por tenant
- Limpieza de datos al terminar la suite (o usar entornos efímeros)

### Nomenclatura de Tests

- `e2e/{tenant}/{modulo}/{flujo}.spec` (ej: `e2e/nom-nom/storefront/compra-rapida.spec`)
- `api/{recurso}/{verbo}-{escenario}.spec`

### Checklists Rápidas

- ☐ Click-budgets cumplidos (3/2/1)
- ☐ x-tenant o derivación inequívoca en todos los requests autenticados
- ☐ Canonical/noindex correcto en fallback
- ☐ Variantes de imagen sirven AVIF/WebP (no original)
- ☐ Planner crea scheduled + targets por red + assetIds
- ☐ Quotas: avisos y 429 amable en límites
- ☐ Accesibilidad: focus/contraste/roles
- ☐ Logs y auditoría escritos

# Quality Harness — Sass Store

Checklist y gates de calidad para cada pantalla/feature. Aplica a todo cambio de UI/UX, API o flujo de negocio.

## 1. Criterios de aceptación por pantalla/feature

Antes de implementar, toda pantalla debe tener AC explícitos en al menos estas dimensiones:

| Dimensión       | Qué validar                                                                |
| --------------- | -------------------------------------------------------------------------- |
| Funcional       | Flujo feliz, errores, validaciones, estados vacíos/loading                 |
| UI/UX           | Tokens de tema, dark/light, contraste, responsividad, focus/hover/disabled |
| Accesibilidad   | ARIA labels, roles, navegación teclado, contraste WCAG 2.1 AA              |
| Seguridad       | Auth, autorización, tenant isolation, rate limiting, sanitización          |
| Testing         | Unit, integration y/o E2E según la capa; screenshot si es UI               |
| Observabilidad  | Logs útiles, sin leaks de PII/secrets, métricas si aplica                  |
| Branding/tenant | El cambio no rompe colores, tokens o contraste de otros tenants            |

## 2. Gates obligatorios antes de merge

1. `npx prettier --write` sobre archivos modificados.
2. `npm run lint` sin errores (warnings preexistentes documentados).
3. `npm run typecheck`.
4. `npm run build`.
5. `npm run test:unit` (o subset si la feature lo justifica).
6. E2E subset dirigido a la feature (`npm run test:e2e:subset -- --grep "..."`).
7. **Validación cross-tenant**: correr smoke E2E en `wondernails`, `centro-tenistico`, `zo-system`, `manada-juma` para cambios de UI/branding.
8. Revisión manual del diff: no secrets, no console.logs de debug, no rutas de prueba expuestas en prod.
9. **Screenshots diff visual** para cambios de UI: capturar home/login/error de cada tenant afectado y revisar antes de commit.
10. Multi-review (`/multi-review`) para features con impacto en seguridad/tenant.

## 3. Dimensiones extra para UI/UX

Para cada componente/página nuevo o modificado:

- Usar tokens Tailwind del tema (`bg-primary`, `text-foreground`, `border-border`, etc.).
- Verificar en modo oscuro y claro.
- Verificar responsividad móvil (320px), tablet (768px), desktop (1440px).
- Verificar estados: default, hover, focus, active, disabled, loading, error.
- Incluir `data-testid` para elementos críticos de E2E.
- No hardcodear colores hex; usar variables o `className` semantic.
- **HSL válido**: las variables CSS `--primary`, `--background`, `--foreground`, etc. deben tener formato `hue sat% lig%`. Valores como `249 250 251` o `232 52 61` son inválidos y rompen Shadcn/Tailwind.
- **Contraste cross-tenant**: con cada cambio de tema/branding, escanear con `@axe-core/playwright` las páginas de cada tenant activo: home, login y error page.
- **No abusar de `!important`**: cada uso nuevo en CSS necesita comentario justificativo y ticket de deuda. Preferir especificidad y tokens.

## 4. Tests recomendados según capa

| Capa             | Tests mínimos                                                    |
| ---------------- | ---------------------------------------------------------------- |
| API route        | Unit/integration del handler, casos de error, rate limit, auth   |
| Service          | Unit con Result Pattern, mocks de DB/external                    |
| Componente React | Unit con Testing Library: render, interacciones, estados         |
| Página/E2E       | Playwright: happy path, error path, mobile viewport, a11y básico |

## 4.1. TypeScript strict

- No introducir ni ampliar `any` en archivos que se tocan. Cada archivo modificado debe salir con tipos explícitos (o dejar `ponytail:` si hay dependencia bloqueante).
- Usar `satisfies` o tipos de dominio antes que castings.

## 5. Loop de seguridad (obligatorio para API/auth/tenant)

Para cada cambio que toque autenticación, autorización, API routes o datos multitenancy:

1. **Authn**: ¿todos los handlers protegidos validan sesión/token? ¿el anonimato es intencional y documentado?
2. **Authz**: ¿se usa `assertTenantAccess` o equivalente? ¿se prueba acceso cross-tenant (usuario de tenant A intenta leer/escribir tenant B)?
3. **Tenant isolation**: ¿las queries filtran por `tenantId`? ¿nunca se usa `x-tenant-id` o `slug` del cliente sin lookup en DB?
4. **Input validation**: ¿todos los inputs pasan por Zod/`validateWithZod`? ¿se rechazan payloads vacíos, largos o malformados?
5. **Rate limiting**: ¿la ruta está bajo rate limiter? ¿se prueba el fallback cuando Redis no está disponible?
6. **Secrets/PII**: ¿no hay logs, respuestas de error ni screenshots de tests que filtren contraseñas, tokens o datos personales?
7. **Scan estático**: `npm run security:autofix` y revisión manual del diff.
8. **Dependency audit**: `npm audit --production` sin high/critical sin justificación.
9. **RLS/tenant isolation**: al tocar schema, service o API, correr `apply-rls.ts` / `test-rls.ts` y verificar que todas las queries filtren por `tenantId`.

## 5.1. Branding en producción

- **No re-seedear** la base de producción ni de E2E para cambiar branding. `seed-data.ts` es fuente de verdad para **nuevos tenants**.
- Cambios de branding en tenants existentes requieren migración/mejora manual aprobada por el dueño del tenant, nunca automática.

## 6. Deuda técnica y ponytail comments

- Todo atajo deliberado debe dejar un comentario `ponytail: ...` con upgrade path.
- Al final de cada story, revisar si algún `ponytail:` quedó pendiente y crear ticket o backlog item.

## 7. Revisión post-merge

- 24h después del deploy: revisar logs de error (Sentry) y métricas de Core Web Vitals.
- Si la feature tiene webhook/integración externa: verificar retry queue y alertas.

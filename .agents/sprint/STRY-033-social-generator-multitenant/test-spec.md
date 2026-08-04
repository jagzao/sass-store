# Test Strategy — STRY-033: Generador de Contenido Social Multi-Tenant

## Objetivo de calidad

Verificar que la generación mensual y la publicación cada 15 min en LinkedIn funcionan correctamente para N tenants en paralelo (no solo zo-system), con aislamiento total de datos/credenciales entre tenants y sin que el fallo de uno bloquee a los demás.

## Nota sobre testabilidad

Los workflows `Content Generator` y `Social Publisher` viven como configuración n8n (nodos Postgres/HTTP/Code inline vía n8n Public API), no como código TypeScript del repo. No son unit-testeables con Vitest sin extraer su lógica a un paquete — eso está fuera de alcance de esta STRY. Se validan con **scripts de integración caja-negra** (mismo patrón que `scripts/validate-scheduled-notifications-db.js` / `-api.js`): ejecutan el workflow real vía n8n Execution API y verifican el resultado en Postgres. Solo la pantalla Socials del admin (SC-06) es código Next.js real → esa sí tiene Playwright E2E.

## Stack de este proyecto

- Unit/Integration: Vitest (`npm run test:unit`, `npm run test:integration`)
- E2E: Playwright (`npm run test:e2e:subset -- --grep "social-policy"`)
- Security: `npm run test:security`
- Coverage: `npm run test:coverage`
- Integración n8n (caja negra, fuera del runner estándar): `node scripts/validate-social-multitenant-generation.js`, `node scripts/validate-social-multitenant-publisher.js`

## Matriz de trazabilidad

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | Generación produce contenido distinto por tenant | Integration (script caja-negra) | `scripts/validate-social-multitenant-generation.js` | Alta | ⬜ pendiente |
| SC-02 | Tenant sin policy se omite sin bloquear a los demás | Integration (script caja-negra) | `scripts/validate-social-multitenant-generation.js` | Alta | ⬜ pendiente |
| SC-03 | Publisher publica a múltiples tenants en el mismo tick | Integration + Security (isolation) | `scripts/validate-social-multitenant-publisher.js` | Alta | ⬜ pendiente |
| SC-04 | Tenant sin token OAuth2 no publica y reintenta | Integration (script caja-negra) | `scripts/validate-social-multitenant-publisher.js` | Media | ⬜ pendiente |
| SC-05 | Fallo de un tenant no bloquea a los demás | Integration + Security (isolation) | `scripts/validate-social-multitenant-publisher.js` | Alta | ⬜ pendiente |
| SC-06 | Admin configura brand voice desde pantalla Socials | E2E (Playwright) | `tests/e2e/social/socials-policy-config.spec.ts` | Alta | ⬜ pendiente |
| SC-07 | Workflows renombrados en n8n | Smoke manual (n8n API) | `scripts/validate-n8n-workflow-names.js` | Baja | ⬜ pendiente |
| EC-01 | Habilita canal a mitad de mes → no retroactivo | Integration (script caja-negra) | `scripts/validate-social-multitenant-generation.js` | Media | ⬜ pendiente |
| EC-02 | Dos tenants con mismo publish_at_utc | Integration (script caja-negra) | `scripts/validate-social-multitenant-publisher.js` | Media | ⬜ pendiente |
| EC-03 | Deshabilita canal con post approved pendiente → no publica | Integration + Security | `scripts/validate-social-multitenant-publisher.js` | Alta | ⬜ pendiente |
| EC-04 | Token expira entre generación y publicación | Integration (script caja-negra) | `scripts/validate-social-multitenant-publisher.js` | Media | ⬜ pendiente |
| EC-05 | Policy editado a mitad de mes no afecta posts existentes | Integration (script caja-negra) | `scripts/validate-social-multitenant-generation.js` | Baja | ⬜ pendiente |
| EC-06 | Alto volumen de tenants due en el mismo tick | Performance/Integration | `scripts/validate-social-multitenant-publisher.js` | Baja | ⬜ pendiente |

## Cobertura adicional

| Tipo | Aplica | Objetivo | Riesgo cubierto | Prioridad |
|------|--------|----------|-----------------|-----------|
| Smoke regression | Sí | Rutas sociales existentes (`/t/[tenant]/social`, `/admin/social-planner`) siguen funcionando | Regresión | Alta |
| Multitenant isolation | Sí | Un tenant no ve/publica con posts, tokens o brand voice de otro | Seguridad/Aislamiento | Alta (SC-01, SC-03, SC-05) |
| Result Pattern paths | Sí (UI nueva de policy) | El endpoint que persiste `tenant_channels.policy` retorna `Ok`/`Err` tipados | Correctness | Media |
| Performance | Sí (EC-06) | El tick del Publisher no se trunca con volumen alto de tenants | UX/Escalabilidad | Baja |

## Datos de prueba

- Tenants: `zo-system` (policy ya configurado, caso control) | `wondernails` (segundo tenant, para probar aislamiento y casos sin policy/sin token)
- Usuario admin: jagzao@gmail.com
- n8n: workflow ids `5oaNrXIEIUAI2GGU` (Generator) y `h6aFaBxAUewJthNq` (Publisher), API key ya usada en la investigación previa
- Tabla clave: `tenant_channels` (columnas `tenant_id`, `channel`, `enabled`, `policy`, `posting_window`, `default_hashtags`)
- Tokens: `social/tokens` con al menos un token OAuth2 LinkedIn real (zo-system) y un tenant sin token (wondernails) para SC-04

## Checklist de salida para /quality-runner

- [ ] Todos los SC-XX y EC-XX tienen test o script correspondiente
- [ ] Scripts de integración caja-negra corren limpio contra la DB real (sin mocks de red, patrón `validate-scheduled-notifications-*.js`)
- [ ] Playwright E2E de SC-06 pasa en headless
- [ ] Isolation test: wondernails no ve/publica con datos de zo-system y viceversa
- [ ] Tras cualquier edición de los workflows vía n8n API: `deactivate` + `activate` explícito antes de dar por válida la corrida

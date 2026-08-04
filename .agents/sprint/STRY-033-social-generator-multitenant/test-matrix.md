# Test Matrix — STRY-033: Generador de Contenido Social Multi-Tenant

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

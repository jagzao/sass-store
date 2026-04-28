# CLAUDE.md — Instrucciones para Claude Code

## Regla Obligatoria: Validación E2E al terminar implementaciones

**Después de completar cualquier tarea de implementación, SIEMPRE ejecutar validación E2E con Playwright CLI antes de reportar como terminada.**

Comando estándar:

```bash
npm run test:e2e:subset -- --grep "nombre del feature o tenant"
```

Para features de tenant específico:

```bash
npm run test:e2e:subset -- --grep "centro-tenistico|nombre-tenant"
```

Para validación completa:

```bash
npm run test:e2e
```

Esto aplica a:

- Nuevos componentes o páginas (landing, hero, sections)
- Cambios en estilos globales (globals.css, TenantStyles)
- Cambios en rutas o layouts de tenant
- Cualquier fix de UI o diseño

No reportar implementación como "lista" hasta que Playwright confirme que no hay regresiones visibles.

---

## Stack Principal

Ver `AGENTS.md` para reglas de arquitectura, Result Pattern (MANDATORIO), y estructura del monorepo.

## Tests

- Unit: `npm run test:unit`
- E2E: `npm run test:e2e`
- E2E subset: `npm run test:e2e:subset -- --grep "X"`
- Coverage targets: rutas críticas >80%, lógica de negocio >70%

## Tenants

Cada tenant debe tener su propio look & feel con landing propia en:
`apps/web/components/tenant/[slug]/`

Registrar en `apps/web/app/t/[tenant]/page.tsx`.

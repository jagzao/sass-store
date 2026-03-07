# Contexto Backend - sass-store

> **Referencia principal:** [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md)  
> **Protocolos relacionados:** [multitenancy.md](../protocols/multitenancy.md) | [validation.md](../protocols/validation.md)

---

## Reglas de oro (obligatorias)

### Multitenancy (CRÍTICO)

- El proyecto es multitenant: **toda** lectura/escritura por negocio debe filtrar por `tenantId`.
- No mezclar datos entre tenants: nunca consultar tablas tenant-scoped sin condicion de tenant.
- Aplicar RLS en tablas publicas con `tenant_id` y validar politicas al tocar seguridad.
- Resolver tenant de forma consistente (slug/ruta/header) **antes** de ejecutar logica de negocio.
- **NUNCA** confiar en `tenantId` del cliente; siempre usar el del contexto autenticado.

### Result Pattern (OBLIGATORIO)

- En API nueva usar Result Pattern: `Result<T, DomainError>`, `withResultHandler`, `match`.
- Evitar `try/catch` en logica de dominio; usar errores tipados con `ErrorFactories`.
- Validar payloads con `validateWithZod` y schemas explicitos para body/query/path.

### Seguridad

- Verificar auth y autorizacion antes de mutaciones (roles por tenant en `user_roles`).
- Mantener errores sanitizados para cliente; nunca exponer secretos ni stack interno.
- Registrar contexto minimo en logs: `requestId`, `tenantId`, `userId`, `endpoint`, `error.type`.

## Convenciones de capas (Monolith-only)

- API routes: `apps/web/app/api/**` y wrappers de middleware de Result.
- Servicios de dominio: `apps/web/lib/**`.
- Tipos, errores y middleware comunes: `packages/core/src/**`.
- Validacion compartida: `packages/validation/src/zod-result.ts`.
- Schema DB canonico: `packages/database/schema.ts`.

## Checklist rapido por endpoint nuevo

- [ ] Obtiene y valida contexto de tenant.
- [ ] Valida auth y permisos por rol/tenant.
- [ ] Usa `withResultHandler` en la ruta.
- [ ] Devuelve `Result<T, DomainError>` sin excepciones crudas.
- [ ] Usa `validateWithZod` para entradas.
- [ ] Incluye filtro `tenantId` en queries.
- [ ] Cubre rama success y rama error en tests.

## Comandos utiles

- `npm run dev -- --filter=@sass-store/web`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:security`
- `npm run rls:apply`
- `npm run rls:test`

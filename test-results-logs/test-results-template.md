# Resultados de Pruebas E2E

Fecha de ejecución: 2026-01-30

## Comando ejecutado

```bash
# Comando utilizado: npm run dev -- --filter=@sass-store/web
```

## Resumen General

- **Total de tests**: No ejecutado (solo servidor de desarrollo iniciado)
- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Tiempo total**: Servidor corriendo

## Resultados por Tenant

### Tenant: zo-system

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - Error: Route "/t/[tenant]" used `...params` or similar expression. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties.
  - Error: column social_posts.metadata does not exist (en endpoints de social: queue, library, analytics)

### Tenant: wondernails

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - Error: Route "/t/[tenant]/register" used `...params` or similar expression. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties.
  - Error: column social_posts.metadata does not exist (en endpoints de social: queue, library, analytics)

### Tenant: vigistudio

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - No se ejecutaron pruebas para este tenant

### Tenant: villafuerte

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - No se ejecutaron pruebas para este tenant

### Tenant: vainilla-vargas

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - No se ejecutaron pruebas para este tenant

### Tenant: delirios

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - No se ejecutaron pruebas para este tenant

### Tenant: nom-nom

- **Tests pasados**: N/A
- **Tests fallidos**: N/A
- **Errores**:
  - No se ejecutaron pruebas para este tenant

## Detalle de Errores

### Error 1: params Promise en TenantLayout

- **Test**: N/A (error en tiempo de ejecución)
- **Tenant**: zo-system, wondernails
- **Mensaje**: Route "/t/[tenant]/register" used `...params` or similar expression. `params` is a Promise and must be unwrapped with `await` or `React.use()` before accessing its properties.
- **Stack trace**: at TenantLayout (app\t\[tenant]\layout.tsx:23:11)

### Error 2: Columna metadata no existe en social_posts

- **Test**: N/A (error en endpoints de social)
- **Tenant**: zo-system, wondernails
- **Mensaje**: Error [PostgresError]: column "metadata" does not exist
- **Stack trace**:
  - apps/web/app/api/v1/social/queue/route.ts:72:19
  - apps/web/app/api/v1/social/library/route.ts:111:19
  - apps/web/app/api/v1/social/analytics/route.ts:50:28

## Observaciones y Notas

- El servidor de desarrollo se inició correctamente en puerto 3001.
- Se detectaron advertencias de Next.js sobre `params` siendo una Promise en el TenantLayout.
- Los endpoints del módulo social fallan porque la columna `metadata` no existe en la tabla `social_posts`.
- No se ejecutaron pruebas E2E automatizadas, solo se inició el servidor de desarrollo.

## Próximos Pasos

- [ ] Corregir el error de `params` Promise en TenantLayout
- [ ] Agregar la columna `metadata` a la tabla `social_posts` o actualizar las consultas SQL
- [ ] Ejecutar `npm run test:e2e:all` para correr la suite completa de pruebas E2E
- [ ] Ejecutar `npx tsx scripts/test-all-tenants.ts` para probar todos los tenants

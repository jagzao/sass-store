# Protocolo de Validación de Cambios

> **Versión:** 1.0.0  
> **Última actualización:** 2026-03-02  
> **Proyecto:** sass-store  

---

## Propósito

Este protocolo define los checks obligatorios que deben ejecutarse antes de considerar cualquier cambio como válido y listo para commit.

---

## 1. Checklist Pre-Commit (OBLIGATORIO)

### 1.1 Validaciones Generales

```bash
# Ejecutar SIEMPRE antes de commit
npm run lint && npm run typecheck && npm run build
```

| Check | Comando | Bloqueante |
|-------|---------|------------|
| Linting | `npm run lint` | ✅ Sí |
| Type checking | `npm run typecheck` | ✅ Sí |
| Build | `npm run build` | ✅ Sí |
| Format | `npm run lint -- --fix` | ⚠️ Auto-fix |

### 1.2 Validaciones por Tipo de Archivo

| Archivo Modificado | Tests Requeridos |
|-------------------|------------------|
| `apps/web/app/api/**` | `test:unit` + `test:integration` |
| `apps/web/lib/services/**` | `test:unit` + `test:integration` |
| `apps/web/lib/db/schema.ts` | `test:integration` + `db:generate` |
| `packages/core/src/**` | `test:unit` |
| `packages/validation/src/**` | `test:unit` |
| `apps/web/components/**` | `test:unit` (component tests) |
| `apps/web/app/(...)/*.tsx` | `test:e2e:subset` |

---

## 2. Validación de Impacto Multitenant

### 2.1 Preguntas Obligatorias

Antes de cualquier cambio que toque datos, responder:

1. **¿El cambio afecta tablas tenant-scoped?**
   - Si sí → Ejecutar `npm run rls:test`
   
2. **¿Se agregan nuevas tablas con datos de negocio?**
   - Si sí → Agregar columna `tenant_id` + RLS policy
   
3. **¿Se modifican queries existentes?**
   - Si sí → Verificar que mantienen filtro `tenantId`

4. **¿Se exponen datos via API?**
   - Si sí → Validar que response no incluye datos de otros tenants

### 2.2 Test de Aislamiento

```typescript
// tests/integration/tenant-isolation.spec.ts
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    // Setup: Crear datos en tenant A
    const tenantA = await createTenant();
    const productA = await createProduct({ tenantId: tenantA.id });
    
    // Act: Intentar acceder desde tenant B
    const tenantB = await createTenant();
    const result = await getProduct(productA.id, tenantB.id);
    
    // Assert: No debe encontrar el producto
    expect(result).toBeNull(); // o expectFailure(result) para Result Pattern
  });
});
```

---

## 3. Validación de Result Pattern

### 3.1 Verificación de Código Nuevo

**Buscar patrones prohibidos:**

```bash
# Buscar try/catch en archivos nuevos (debe usar Result Pattern)
grep -r "try {" apps/web/lib/services/*.ts --include="*.ts"

# Buscar throw en servicios (debe usar ErrorFactories)
grep -r "throw new" apps/web/lib/services/*.ts --include="*.ts"
```

### 3.2 Checklist Result Pattern

- [ ] Importa `Result`, `Ok`, `Err`, `match` de `@sass-store/core/src/result`
- [ ] Importa `DomainError`, `ErrorFactories` de `@sass-store/core/src/errors/types`
- [ ] Funciones retornan `Result<T, DomainError>`
- [ ] API routes usan `withResultHandler`
- [ ] Validación usa `validateWithZod`
- [ ] No hay `try/catch` en lógica de negocio
- [ ] Errores son tipados con `ErrorFactories`

---

## 4. Validación de Seguridad

### 4.1 Checks de Seguridad

```bash
# Ejecutar audit de dependencias
npm audit

# Ejecutar security tests
npm run test:security

# Auto-fix de vulnerabilidades conocidas
npm run security:autofix
```

### 4.2 Checklist de Seguridad

- [ ] No hay secrets en código (usar `.env.local`)
- [ ] Inputs validados con Zod
- [ ] SQL queries usan parámetros (no string interpolation)
- [ ] RLS policies aplicadas en tablas nuevas
- [ ] Auth verificada en endpoints protegidos
- [ ] No expone stack traces al cliente

---

## 5. Validación de Tests

### 5.1 Cobertura Mínima

| Tipo de Código | Cobertura Mínima |
|----------------|------------------|
| Servicios de dominio | 80% |
| API routes | 70% |
| Utilidades | 90% |
| Componentes UI | 60% |

### 5.2 Tests Obligatorios por Feature

**Para cada nuevo feature:**

1. **Test de éxito (happy path)**
   ```typescript
   it('should create product successfully', async () => {
     const result = await createProduct(validData);
     expectSuccess(result);
   });
   ```

2. **Test de validación**
   ```typescript
   it('should reject invalid product data', async () => {
     const result = await createProduct(invalidData);
     expectFailure(result);
     expect(result.error.type).toBe('ValidationError');
   });
   ```

3. **Test de autorización**
   ```typescript
   it('should reject unauthorized access', async () => {
     const result = await createProduct(data, unauthenticatedContext);
     expectFailure(result);
     expect(result.error.type).toBe('AuthorizationError');
   });
   ```

4. **Test de multitenancy**
   ```typescript
   it('should isolate data between tenants', async () => {
     // Ver sección 2.2
   });
   ```

---

## 6. Validación de Base de Datos

### 6.1 Antes de Migración

```bash
# Generar migración
npm run db:generate

# Revisar SQL generado
cat apps/web/lib/db/migrations/*.sql
```

### 6.2 Checklist de Migración

- [ ] Backup de datos existentes
- [ ] Migración es reversible (down migration)
- [ ] No hay data loss en cambios de columna
- [ ] Índices agregados para queries frecuentes
- [ ] RLS policies actualizadas si hay nuevas tablas

### 6.3 Después de Migración

```bash
# Aplicar migración
npm run db:push

# Verificar schema
npm run db:studio

# Re-poblar datos de prueba si es necesario
npm run db:seed
```

---

## 7. Validación de Documentación

### 7.1 Actualizaciones Requeridas

| Cambio | Documentación a Actualizar |
|--------|---------------------------|
| Nuevo endpoint | API docs + `context_be.md` |
| Nuevo DTO | `context_shared.md` |
| Nuevo caso borde | `test_cases.md` |
| Error resuelto | `debug_logs.md` |
| Decisión arquitectónica | `decisions.md` |

### 7.2 Formato de Commit

```
feat(module): descripción breve

- Cambio específico 1
- Cambio específico 2

Tests: npm run test:unit npm run test:integration
Refs: #issue-number
```

---

## 8. Comando de Validación Completa

```bash
# Ejecutar todas las validaciones
npm run lint && \
npm run typecheck && \
npm run build && \
npm run test:unit && \
npm run test:integration && \
npm run test:security && \
echo "✅ All validations passed!"
```

---

## 9. Fallo en Validación

### Si algún check falla:

1. **NO hacer commit** hasta resolver
2. Documentar el error en `debug_logs.md`
3. Aplicar corrección
4. Re-ejecutar validación completa
5. Si persiste después de 3 intentos → Escalar

### Template de Bloqueo

```markdown
## 🚫 VALIDATION BLOCKED

**Fecha:** YYYY-MM-DD HH:MM
**Comando fallido:** `npm run test:unit`
**Error:** [Mensaje de error]

**Intentos:**
1. [Primera corrección] - Resultado: [Falló/Parcial]
2. [Segunda corrección] - Resultado: [Falló/Parcial]
3. [Tercera corrección] - Resultado: [Falló/Parcial]

**Estado:** BLOQUEADO - Requiere revisión manual
```

---

*Este protocolo es obligatorio. Cualquier bypass debe ser aprobado y documentado.*

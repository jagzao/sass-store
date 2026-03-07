# Test Cases Borde - sass-store

> **Referencia:** [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md) | [testing.md](../protocols/testing.md)  
> **Protocolo:** Mantener sincronizado con bugs encontrados

---

## Índice por Categoría

| Categoría | Casos | Prioridad |
|-----------|-------|-----------|
| [#seguridad](#seguridad-y-multitenancy) | 4 | P1 |
| [#auth](#auth-y-autorización) | 4 | P1 |
| [#result-pattern](#result-pattern-y-validación) | 4 | P1 |
| [#bookings](#reservas-bookings) | 4 | P2 |
| [#finance](#finanzas-finance) | 3 | P2 |
| [#social](#social-media) | 3 | P2 |
| [#ecommerce](#e-commercepos) | 4 | P2 |
| [#infra](#infraestructura-y-calidad) | 4 | P3 |

---

## Seguridad y Multitenancy

### #seguridad #multitenancy

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| SEC-001 | Aislamiento por `tenantId`: un tenant nunca ve datos de otro | P1 | `npm run test:security -- --grep "tenant isolation"` |
| SEC-002 | CRUD cross-tenant bloqueado en `products`, `services`, `bookings`, `campaigns`, `social_posts`, `customers` | P1 | `npm run test:integration -- --grep "cross-tenant"` |
| SEC-003 | RLS activo y políticas correctas en tablas tenant-scoped | P1 | `npm run rls:test` |
| SEC-004 | Request sin tenant válido devuelve error tipado (no data leakage) | P1 | Verificar response no incluye datos de otros tenants |

**Test Template:**
```typescript
describe('Tenant Isolation', () => {
  it('SEC-001: should not allow tenant A to access tenant B data', async () => {
    const tenantA = await createTenant();
    const tenantB = await createTenant();
    const productA = await createProduct({ tenantId: tenantA.id });
    
    // Intentar acceder desde tenant B
    const result = await getProduct(productA.id, tenantB.id);
    
    expect(result).toBeNull(); // o expectFailure(result)
  });
});
```

---

## Auth y Autorización

### #auth #autorización

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| AUTH-001 | Request sin token devuelve 401 con error tipado | P1 | `npm run test:unit -- --grep "unauthenticated"` |
| AUTH-002 | Token inválido devuelve 401 con error tipado | P1 | Verificar `AuthorizationError` |
| AUTH-003 | Token expirado devuelve 401 con mensaje claro | P1 | Mock de tiempo expirado |
| AUTH-004 | Usuario autenticado sin rol requerido devuelve 403 | P1 | Verificar `ForbiddenError` |
| AUTH-005 | Usuario con rol en tenant A intentando operar tenant B | P1 | Cross-tenant role check |
| AUTH-006 | Endpoints críticos sin permisos devuelven `AuthorizationError` | P1 | Listar endpoints críticos |

**Test Template:**
```typescript
describe('Authorization', () => {
  it('AUTH-004: should reject user without required role', async () => {
    const user = await createUser({ role: 'viewer' });
    const result = await deleteProduct(productId, { userId: user.id });
    
    expectFailure(result);
    expect(result.error.type).toBe('AuthorizationError');
  });
});
```

---

## Result Pattern y Validación

### #result-pattern #validación

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| RES-001 | Cada servicio y ruta probados en rama `Ok` y rama `Err` | P1 | Coverage report |
| RES-002 | Errores mapeados a `DomainError` correcto (`ValidationError`, `NotFoundError`, `DatabaseError`, etc.) | P1 | Verificar tipo de error |
| RES-003 | Payloads inválidos con `validateWithZod`: tipos incorrectos, faltantes, valores fuera de rango | P1 | `npm run test:unit -- --grep "validation"` |
| RES-004 | Confirmar que no hay `try/catch` legacy nuevo en lógica de negocio | P1 | ESLint rule + code review |

**Test Template:**
```typescript
describe('Result Pattern', () => {
  it('RES-002: should map errors to correct DomainError', async () => {
    const result = await getProduct('non-existent-id', tenantId);
    
    expectFailure(result);
    expect(result.error.type).toBe('NotFoundError');
    expect(result.error.resource).toBe('Product');
  });
});
```

---

## Reservas (Bookings)

### #bookings #logica

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| BK-001 | Conflicto de horario: dos reservas al mismo tiempo para mismo servicio | P2 | `npm run test:integration -- --grep "booking conflict"` |
| BK-002 | Timezone: reserva creada en timezone diferente se muestra correctamente | P2 | Mock de timezone |
| BK-003 | Estado inválido: transición de estado no permitida | P2 | Verificar `ValidationError` |
| BK-004 | Datos parciales: reserva con campos opcionales faltantes | P2 | Verificar defaults |

**Test Template:**
```typescript
describe('Bookings', () => {
  it('BK-001: should reject conflicting booking times', async () => {
    const booking1 = await createBooking({
      serviceId: 'service-1',
      date: '2026-03-15',
      time: '10:00'
    });
    
    const booking2 = await createBooking({
      serviceId: 'service-1',
      date: '2026-03-15',
      time: '10:00'  // Mismo horario
    });
    
    expectFailure(booking2);
    expect(booking2.error.type).toBe('ConflictError');
  });
});
```

---

## Finanzas (Finance)

### #finance #logica

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| FIN-001 | Rango de fechas inválido: fecha inicio > fecha fin | P2 | Verificar `ValidationError` |
| FIN-002 | Granularidad inválida: agrupación por período no soportado | P2 | Verificar error claro |
| FIN-003 | Tenant inexistente: reporte para tenant que no existe | P2 | Verificar `NotFoundError` |

---

## Social Media

### #social #upload

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| SOC-001 | Upload sin archivo: request sin multipart | P2 | Verificar `ValidationError` |
| SOC-002 | Formato no soportado: archivo con extensión no permitida | P2 | Verificar lista de formatos |
| SOC-003 | Tamaño excedido: archivo mayor al límite | P2 | Verificar límite configurado |

---

## E-commerce/POS

### #ecommerce #logica

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| ECOM-001 | Stock insuficiente: orden con cantidad > stock disponible | P2 | Verificar `InsufficientStockError` |
| ECOM-002 | Pagos duplicados: mismo orderId procesado dos veces | P2 | Verificar idempotencia |
| ECOM-003 | Estado de orden inválido: transición no permitida | P2 | Verificar máquina de estados |
| ECOM-004 | Precio cambiado: precio en carrito != precio actual del producto | P2 | Verificar validación de precio |

---

## Infraestructura y Calidad

### #infra #testing

| ID | Caso | Prioridad | Validación |
|----|------|-----------|------------|
| INF-001 | Migraciones Drizzle (`db:generate`, `db:push`) sin romper seed actual | P3 | `npm run db:generate && npm run db:push && npm run db:seed` |
| INF-002 | Smoke e2e de flujo base: login -> tenant dashboard -> acción principal | P3 | `npm run test:e2e:subset -- --grep "smoke"` |
| INF-003 | Tests de integración con DB de prueba aislada (`TEST_DATABASE_URL`) | P3 | Verificar aislamiento de DB |
| INF-004 | Reejecución de suite mínima tras fix: unit + integration + security | P3 | Script de validación |

---

## Casos Borde por Módulo

### Productos

| Caso | Descripción | Prioridad |
|------|-------------|-----------|
| Producto sin nombre | Crear producto con nombre vacío | P1 |
| Precio negativo | Crear producto con precio < 0 | P1 |
| Producto duplicado | Crear producto con mismo nombre en mismo tenant | P2 |
| Categoría inexistente | Asignar producto a categoría que no existe | P2 |

### Clientes

| Caso | Descripción | Prioridad |
|------|-------------|-----------|
| Email duplicado | Crear cliente con email existente en mismo tenant | P1 |
| Email inválido | Crear cliente con email mal formateado | P1 |
| Teléfono inválido | Crear cliente con teléfono en formato incorrecto | P2 |

### Usuarios

| Caso | Descripción | Prioridad |
|------|-------------|-----------|
| Usuario sin tenant | Usuario recién creado sin tenant asignado | P1 |
| Múltiples roles | Usuario con roles en múltiples tenants | P2 |
| Rol eliminado | Usuario con rol que fue eliminado | P2 |

---

## Priorización

| Prioridad | Descripción | Cobertura Requerida |
|-----------|-------------|---------------------|
| P1 | Crítico - Seguridad y datos | 100% |
| P2 | Importante - Funcionalidad core | 80% |
| P3 | Deseable - Calidad y DX | 60% |

---

## Comandos de Validación por Categoría

```bash
# Seguridad
npm run test:security
npm run rls:test

# Auth
npm run test:unit -- --grep "auth"
npm run test:integration -- --grep "authorization"

# Result Pattern
npm run test:unit -- --grep "Result"

# Bookings
npm run test:integration -- --grep "booking"

# Finance
npm run test:unit -- --grep "finance"

# Social
npm run test:unit -- --grep "social"

# E-commerce
npm run test:integration -- --grep "order"
npm run test:integration -- --grep "cart"

# Infra
npm run test:e2e:subset -- --grep "smoke"
```

---

## Estadísticas

| Métrica | Valor |
|---------|-------|
| Total casos documentados | 32 |
| Casos P1 (críticos) | 16 |
| Casos P2 (importantes) | 12 |
| Casos P3 (deseables) | 4 |
| Categorías | 8 |

---

*Última actualización: 2026-03-02*
*Mantener sincronizado con bugs encontrados en desarrollo*

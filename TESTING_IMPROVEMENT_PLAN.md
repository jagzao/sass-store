# 🎯 Plan Integral de Mejora de Tests

## 📋 **FASE 1: Fundamentos y Utilidades (Semana 1)**

### 1.1 Patrones de Diseño Detectados

✅ **Result Pattern**: Completamente implementado en `packages/core/src/result/`

- Combinators: `map`, `flatMap`, `match`, `pipe`
- Utilidades: `combineAll`, `retry`, `withTimeout`, `ResultCache`
- Testing helpers: `expectSuccess`, `expectFailure`

✅ **Domain Errors**: Tipados en `packages/core/src/errors/types.ts`

- `ValidationError`, `NotFoundError`, `AuthorizationError`
- `AuthenticationError`, `BusinessRuleError`

✅ **Test Utilities**: Existentes en `tests/utils/`

- `ClickBudgetTracker` para medir UX

### 1.2 Crear Utilidades de Testing Adicionales

#### **A. Data Builders (Test Factory Pattern)**

```typescript
// tests/builders/TenantBuilder.ts
export class TenantBuilder {
  private tenant: Partial<Tenant> = {};

  static aTenant() {
    return new TenantBuilder();
  }

  withId(id: string) {
    this.tenant.id = id;
    return this;
  }

  withSlug(slug: string) {
    this.tenant.slug = slug;
    return this;
  }

  withCatalogMode() {
    this.tenant.mode = "catalog";
    return this;
  }

  build(): Tenant {
    return {
      id: this.tenant.id || `tenant-${Date.now()}`,
      slug: this.tenant.slug || `test-${Date.now()}`,
      name: this.tenant.name || "Test Tenant",
      mode: this.tenant.mode || "catalog",
      status: "active",
      branding: {},
      contact: {},
      location: {},
      quotas: {},
      googleCalendarId: null,
      googleCalendarTokens: null,
      googleCalendarConnected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.tenant,
    };
  }
}
```

#### **B. Mock Database Layer**

```typescript
// tests/mocks/MockDatabase.ts
export class MockDatabase {
  private data: Map<string, any> = new Map();

  // Mock collections
  tenants = new Map<string, Tenant>();
  products = new Map<string, Product>();
  users = new Map<string, User>();
  cart = new Map<string, Cart>();
  orders = new Map<string, Order>();

  // Simulate database operations
  async insert<T>(collection: Map<string, T>, data: T): Promise<T> {
    const id = (data as any).id || `${collection.name}-${Date.now()}`;
    const item = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    collection.set(id, item);
    return item;
  }

  async findById<T>(collection: Map<string, T>, id: string): Promise<T | null> {
    return collection.get(id) || null;
  }

  async findMany<T>(
    collection: Map<string, T>,
    filter: (item: T) => boolean,
  ): Promise<T[]> {
    return Array.from(collection.values()).filter(filter);
  }

  // Clear for test isolation
  clear() {
    this.tenants.clear();
    this.products.clear();
    this.users.clear();
    this.cart.clear();
    this.orders.clear();
  }
}
```

#### **C. Test Setup Utilities**

```typescript
// tests/setup/TestContext.ts
export interface TestContext {
  db: MockDatabase;
  user: User;
  tenant: Tenant;
}

export const createTestContext = (): TestContext => {
  const db = new MockDatabase();
  const tenant = TenantBuilder.aTenant().withSlug(`test-${Date.now()}`).build();

  const user = UserBuilder.aUser().withTenant(tenant.id).build();

  return { db, user, tenant };
};
```

## 🚀 **FASE 2: Tests Críticos de Services Layer (Semanas 2-3)**

### 2.1 Estructura de Tests por Domain

#### **A. Inventory Service Tests**

```typescript
// tests/unit/services/InventoryService.spec.ts
describe("InventoryService - Result Pattern", () => {
  let context: TestContext;
  let inventoryService: InventoryService;

  beforeEach(() => {
    context = createTestContext();
    inventoryService = new InventoryService(context.db);
  });

  describe("Product Lookup", () => {
    it("should return success result when product found", async () => {
      // Arrange
      const product = ProductBuilder.aProduct()
        .withTenant(context.tenant.id)
        .withStock(10)
        .build();

      await context.db.insert(context.db.products, product);

      // Act
      const result = await inventoryService.getProduct(product.id);

      // Assert
      expectSuccess(result).toEqual(product);
    });

    it("should return NotFoundError when product missing", async () => {
      // Act
      const result = await inventoryService.getProduct("non-existent");

      // Assert
      expectFailure(result).toEqual(
        expect.objectContaining({
          type: "NotFoundError",
          resource: "Product",
        }),
      );
    });
  });

  describe("Stock Management", () => {
    it("should validate stock availability for cart items", async () => {
      // Arrange
      const product = ProductBuilder.aProduct()
        .withTenant(context.tenant.id)
        .withStock(5)
        .build();

      await context.db.insert(context.db.products, product);

      const cartItem = {
        productId: product.id,
        quantity: 3, // Should be available
      };

      // Act
      const result = await inventoryService.validateStock([cartItem]);

      // Assert
      expectSuccess(result).toEqual({
        available: true,
        items: [
          {
            productId: product.id,
            requested: 3,
            available: 5,
            sufficient: true,
          },
        ],
      });
    });

    it("should return InsufficientStockError when overcommitted", async () => {
      // Similar but with quantity > stock
    });
  });
});
```

#### **B. Cart Service Tests**

```typescript
// tests/unit/services/CartService.spec.ts
describe("CartService - Result Pattern", () => {
  describe("Add to Cart", () => {
    it("should validate stock before adding items", async () => {
      const result = await cartService.addItem(userId, productId, quantity);

      if (isFailure(result) && result.error.type === "InsufficientStockError") {
        expect(result.error.details.available).toBeLessThan(quantity);
      }
    });

    it("should track tenant isolation", async () => {
      // Test that cart items are isolated by tenant
    });
  });

  describe("Cart Calculations", () => {
    it("should calculate correct totals with discounts", async () => {
      // Test business rules for pricing
    });
  });
});
```

#### **C. User Service Tests**

```typescript
// tests/unit/services/UserService.spec.ts
describe("UserService - Authentication & Authorization", () => {
  describe("User Registration", () => {
    it("should return ValidationError for invalid email", async () => {
      const result = await userService.register({
        email: "invalid-email",
        password: "ValidPassword123!",
      });

      expectFailure(result).toEqual(
        expect.objectContaining({
          type: "ValidationError",
          field: "email",
        }),
      );
    });

    it("should return success result for valid registration", async () => {
      const result = await userService.register(validUserData);
      expectSuccess(result).toHaveProperty("id");
      expectSuccess(result).toHaveProperty("email", validUserData.email);
    });
  });

  describe("Authentication Flow", () => {
    it("should handle invalid credentials", async () => {
      const result = await userService.authenticate(
        "test@example.com",
        "wrong-password",
      );

      expectFailure(result).toEqual(
        expect.objectContaining({
          type: "AuthenticationError",
          reason: "invalid_credentials",
        }),
      );
    });

    it("should return user data on successful authentication", async () => {
      const result = await userService.authenticate(
        "test@example.com",
        "correct-password",
      );

      expectSuccess(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: "test@example.com",
          roles: expect.any(Array),
        }),
      );
    });
  });
});
```

### 2.2 Patrones de Testing Avanzados

#### **A. Result Pattern Testing**

```typescript
// tests/unit/patterns/ResultPattern.spec.ts
describe("Result Pattern - Advanced Patterns", () => {
  it("should handle complex business workflows", async () => {
    const result = await pipe(Ok(userId))
      .flatMap(validateUser)
      .flatMap(checkPermissions)
      .flatMap(loadUserData)
      .map(processUserData)
      .flatMap(saveUserData)
      .get();

    expect(isSuccess(result)).toBe(true);
  });

  it("should compose multiple error types", async () => {
    const errors = [
      ErrorFactories.validation("Invalid field", "email"),
      ErrorFactories.businessRule("Duplicate user", "user_email"),
      ErrorFactories.authorization("Insufficient permissions"),
    ];

    const result = combineAll(errors);

    expect(isFailure(result)).toBe(true);
    expectFailure(result).toHaveLength(3);
  });
});
```

#### **B. Performance Testing**

```typescript
// tests/unit/performance/ServicePerformance.spec.ts
describe("Service Performance", () => {
  it("should handle bulk operations efficiently", async () => {
    const startTime = performance.now();

    const result = await inventoryService.batchUpdateStock(largeStockUpdates);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(1000); // 1 second max
    expectSuccess(result);
  });

  it("should cache frequently accessed data", async () => {
    const cache = new ResultCache<string, Product>(5000); // 5s TTL

    // First call - should hit database
    const firstCall = await cache.getOrCompute("product-123", () =>
      inventoryService.getProduct("product-123"),
    );

    // Second call - should hit cache
    const secondCall = await cache.getOrCompute("product-123", () =>
      inventoryService.getProduct("product-123"),
    );

    expect(firstCall).toEqual(secondCall);
  });
});
```

## 🔌 **FASE 3: Tests de Integración y API (Semanas 4-5)**

### 3.1 API Route Testing con Result Pattern

#### **A. Product API Integration**

```typescript
// tests/integration/api/ProductAPI.spec.ts
describe("Product API - Integration", () => {
  describe("GET /api/v1/products", () => {
    it("should return paginated results with Result handling", async () => {
      const response = await fetch(
        `/api/v1/products?tenant=${context.tenant.slug}`,
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.items).toBeInstanceOf(Array);
      expect(data.data.pagination).toBeDefined();
    });

    it("should handle tenant isolation correctly", async () => {
      // Test that products are filtered by tenant
      const otherTenantResponse = await fetch(
        `/api/v1/products?tenant=other-tenant`,
      );
      const thisTenantResponse = await fetch(
        `/api/v1/products?tenant=${context.tenant.slug}`,
      );

      expect(thisTenantResponse.data.items).not.toEqual(
        otherTenantResponse.data.items,
      );
    });
  });

  describe("POST /api/v1/products", () => {
    it("should validate input using Result Pattern", async () => {
      const invalidProduct = {
        name: "", // Empty name should fail
        price: -10, // Negative price should fail
        sku: "INVALID SKU", // Invalid format should fail
      };

      const response = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidProduct),
      });

      expect(response.status).toBe(400);
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.details).toHaveProperty("errors");
    });
  });
});
```

#### **B. Error Handling Integration**

```typescript
// tests/integration/error-handling/GlobalErrorHandling.spec.ts
describe('Global Error Handling', () => {
  it('should handle database errors gracefully', async () => {
    // Mock database failure
      vi.mocked(database).products.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await fetch('/api/v1/products');

      expect(response.status).toBe(500);
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('DatabaseError');
    });

    it('should sanitize error responses for security', async () => {
      // Ensure no sensitive information leaks
      const response = await fetch('/api/v1/products');

      const result = await response.json();

      if (isFailure(result)) {
        expect(result.error).not.toHaveProperty('stack');
        expect(result.error).not.toHaveProperty('internal');
      }
    });
  });
});
```

## ⚡ **FASE 4: Casos Límite y Edge Cases (Semana 6)**

### 4.1 Escenarios de Error y Recuperación

```typescript
// tests/unit/edge-cases/RecoveryScenarios.spec.ts
describe("Error Recovery and Edge Cases", () => {
  describe("Concurrent Operations", () => {
    it("should handle race conditions in cart operations", async () => {
      const cart = new CartService();

      // Simulate concurrent adds to same cart
      const promises = Array.from({ length: 10 }, (_, i) =>
        cart.addItem(userId, productId, 1 + i),
      );

      const results = await Promise.all(promises);

      // Should handle gracefully without data corruption
      expect(results.every((r) => isSuccess(r) || isFailure(r))).toBe(true);
    });
  });

  describe("Resource Exhaustion", () => {
    it("should handle rate limiting gracefully", async () => {
      // Simulate hitting rate limits
      const promises = Array.from({ length: 100 }, () =>
        fetch("/api/v1/products"),
      );

      const results = await Promise.allSettled(promises);

      const rateLimited = results.filter((r) => r.status === 429).length;

      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  describe("Data Corruption Scenarios", () => {
    it("should validate data integrity", async () => {
      // Test scenarios that could lead to corrupted state
      const cart = await cartService.addItem(userId, productId, 1);
      const result = await cartService.removeItem(userId, productId, 2);

      expectFailure(result).toEqual(
        expect.objectContaining({
          type: "BusinessRuleError",
          message: expect.stringContaining("greater than"),
        }),
      );
    });
  });
});
```

### 4.2 Performance y Escalabilidad

```typescript
// tests/unit/performance/Scalability.spec.ts
describe("Scalability Performance", () => {
  it("should handle large datasets efficiently", async () => {
    const largeDataSet = Array.from({ length: 10000 }, (_, i) =>
      ProductBuilder.aProduct().withSku(`PROD-${i}`).build(),
    );

    const startTime = performance.now();
    const result = await inventoryService.batchInsert(largeDataSet);
    const duration = performance.now() - startTime;

    expectSuccess(result);
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  it("should maintain memory efficiency", async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform memory-intensive operations
    await performBulkOperations();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Should not leak excessive memory
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB max
  });
});
```

## 🛠️ **FASE 5: Herramientas y Automatización (Continua)**

### 5.1 Scripts de Testing

```bash
# scripts/generate-test-data.ts
# Genera datos de prueba realistas para load testing

# scripts/performance-benchmark.ts
# Mide rendimiento de servicios específicos

# scripts/coverage-threshold-check.ts
# Verifica que la cobertura cumpla umbrales
```

### 5.2 CI/CD Configuration

```yaml
# .github/workflows/test-coverage.yml
name: Test Coverage Check
on: [push, pull_request]

jobs:
  test-and-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage thresholds
        run: npm run test:coverage:check

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## 📊 **Métricas y Objetivos**

### Cobertura Target por Fase:

| Fase | Target    | Tests Críticos  | Tiempo Estimado |
| ---- | --------- | --------------- | --------------- |
| 1    | 72% → 85% | Services Core   | 2 semanas       |
| 2    | 85% → 92% | API Integration | 2 semanas       |
| 3    | 92% → 95% | Edge Cases      | 1 semana        |
| 4    | 95% → 98% | Performance     | 1 semana        |

### Tipos de Tests por Categoría:

| Categoría     | Unit Tests | Integration | E2E    | Total   |
| ------------- | ---------- | ----------- | ------ | ------- |
| Services      | 85         | 15          | 10     | 110     |
| API Layer     | 60         | 40          | 20     | 120     |
| UI Components | 70         | 10          | 30     | 110     |
| **TOTAL**     | **215**    | **65**      | **60** | **340** |

### Calidad Target:

- **Coverage**: ≥95% líneas, ≥90% branches, ≥90% funciones
- **Performance**: <100ms para 95% de operations CRUD
- **Reliability**: <0.1% error rate en tests de estrés
- **Maintainability**: 100% Result Pattern compliance

## 🎯 **Estrategia de Implementación**

### Priorización por Impacto:

1. **🔥 Crítico**: Services con Result Pattern
   - Inventory, Cart, User, Payment
   - 85% coverage en 2 semanas

2. **⚠️ Alto**: API Routes y middleware
   - Todos los endpoints con validación
   - 92% coverage en 2 semanas adicionales

3. **📋 Medio**: UI Components y hooks
   - Componentes críticos del carrito y catálogo
   - 95% coverage en 3 semanas

4. **🔧 Bajo**: Edge cases y performance
   - Tests de estrés y carga
   - 98% coverage en 1 semana

### Enfoque en Calidad:

- **Mock-first**: Evitar dependencias de base de datos
- **Result Pattern**: 100% compliance en nuevo código
- **Type Safety**: Aprovechamiento de TypeScript estricto
- **Documentation**: Tests auto-documentados con descripciones claras

---

**🚀 Ready para implementación: Comenzar con Fase 1 inmediatamente**
**📈 Monitoreo: Reporte semanal de progreso de cobertura**
**🔄 Iteración: Revisión y ajuste cada 2 semanas**

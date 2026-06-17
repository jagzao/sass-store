# 🧪 TESTING IMPLEMENTATION GUIDE - Sass Store Multitenant

**Fecha**: 2025-10-12
**Estado**: CRÍTICO - Aplicación trabada por bucle de recargas
**Prioridad**: ALTA - Corregir bug crítico antes de continuar

---

## 🚨 **PROBLEMA CRÍTICO IDENTIFICADO**

### **Bucle Infinito de Recargas**

- **Síntoma**: Todos los tenants están refrescando constantemente sin cambios visuales
- **Causa**: `useTenantGuard` hook causando redirecciones infinitas
- **Impacto**: Aplicación completamente inutilizable

### **Diagnóstico del Bug**

```typescript
// ❌ Problema en useTenantGuard.ts
useEffect(() => {
  // pathname en dependencias causa re-ejecución infinita
}, [session, status, tenantSlug, router, pathname]); // ← pathname causa loop
```

### **Solución Aplicada**

```typescript
// ✅ Solución: Remover pathname de dependencias
useEffect(() => {
  // Solo dependencias necesarias
}, [session, status, tenantSlug, router]); // ← Sin pathname
```

---

## 📋 **ESTADO ACTUAL DEL PROYECTO**

### **✅ COMPLETADO (11/11 Fases)**

1. ✅ **Base de Datos**: RLS habilitado, schemas completos
2. ✅ **Autenticación**: NextAuth con tenant isolation
3. ✅ **Mercado Pago**: OAuth completo con webhooks
4. ✅ **POS System**: Ventas con inventario en tiempo real
5. ✅ **Dashboard**: KPIs financieros con gráficos
6. ✅ **Movimientos**: Filtrado avanzado y exportación
7. ✅ **Conciliación**: Sistema automático de verificación
8. ✅ **Reportes**: Múltiples formatos (PDF, Excel, CSV)
9. ✅ **Configuración**: Panel administrativo completo
10. ✅ **Seguridad**: Rate limiting, auditoría, validación
11. ✅ **Arquitectura**: Multitenant completo con aislamiento

### **❌ PENDIENTE CRÍTICO**

- 🔴 **Bug Crítico**: Bucle de recargas infinito
- 🔴 **Testing**: 0% coverage actual
- 🔴 **E2E Tests**: No ejecutados
- 🔴 **Unit Tests**: No implementados

---

## 🧪 **PLAN DE TESTING COMPLETO**

### **FASE 1: CORRECCIÓN CRÍTICA** ⏳ EN PROGRESO

#### **Objetivo**: Hacer la aplicación funcional

- ✅ **Bug Fix**: `useTenantGuard` corregido
- 🔄 **Verificación**: Probar navegación sin bucles
- 🔄 **Validación**: Confirmar login/registro funciona

### **FASE 2: UNIT TESTS** 📝 PENDIENTE

#### **Cobertura Requerida**: 80%+

```typescript
// tests/unit/lib/security/
├── input-validator.spec.ts
├── rate-limiter.spec.ts
├── audit-logger.spec.ts

// tests/unit/lib/auth/
├── tenant-guard.spec.ts
├── middleware.spec.ts

// tests/unit/lib/finance/
├── mercadopago.spec.ts
├── reconciliation.spec.ts
├── reports.spec.ts

// tests/unit/components/
├── finance-dashboard.spec.ts
├── pos-system.spec.ts
├── config-panel.spec.ts
```

### **FASE 3: INTEGRATION TESTS** 🔗 PENDIENTE

#### **APIs a Probar**:

```typescript
// tests/integration/api/
├── products-api.spec.ts      // CRUD con RLS
├── finance-api.spec.ts       // Pagos y movimientos
├── tenant-isolation.spec.ts  // Aislamiento de datos
├── config-api.spec.ts        // Gestión de configuración
```

### **FASE 4: E2E TESTS** 🌐 PENDIENTE

#### **Flujos Críticos** (100% tests passing objetivo):

```typescript
// tests/e2e/
├── auth-flow.spec.ts          // Login/registro tenant
├── tenant-isolation.spec.ts   // Navegación entre tenants
├── finance-dashboard.spec.ts  // Dashboard financiero
├── pos-sales.spec.ts          // Sistema POS completo
├── config-management.spec.ts  // Panel de configuración
├── reports-generation.spec.ts // Exportación de reportes
├── security-validation.spec.ts // Rate limiting y validación
```

---

## 🏃 **EJECUCIÓN DE TESTS**

### **Comandos de Testing**:

```bash
# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# E2E Tests (requiere app corriendo)
npm run test:e2e

# All Tests
npm run test

# Con coverage
npm run test:coverage

# Debug específico
npx playwright test --debug tests/e2e/auth-flow.spec.ts
```

### **Configuración de Testing**:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

---

## 🔍 **TEST CASES CRÍTICOS**

### **1. Autenticación y Tenant Isolation**

```typescript
describe("Tenant Authentication", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/t/wondernails/admin");
    await expect(page).toHaveURL("/t/wondernails/login");
  });

  test("should prevent cross-tenant access", async ({ page }) => {
    // Login en tenant A, intentar acceder tenant B
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/vigistudio/admin");
    await expect(page).toHaveURL("/t/vigistudio/login");
  });

  test("should maintain session within tenant", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/finance");
    await expect(
      page.locator('[data-testid="finance-dashboard"]')
    ).toBeVisible();
  });
});
```

### **2. Sistema Financiero**

```typescript
describe("Financial System", () => {
  test("should display real-time KPIs", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/finance");

    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="monthly-growth"]')).toBeVisible();
  });

  test("should create POS sale successfully", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/finance/pos");

    // Simular venta
    await page.click('[data-testid="add-product"]');
    await page.fill('[data-testid="product-search"]', "Producto Test");
    await page.click('[data-testid="product-result"]');
    await page.click('[data-testid="complete-sale"]');

    await expect(page.locator('[data-testid="sale-success"]')).toBeVisible();
  });

  test("should generate financial reports", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/finance/reports");

    await page.selectOption('[data-testid="report-type"]', "monthly");
    await page.click('[data-testid="generate-report"]');

    await expect(page.locator('[data-testid="report-download"]')).toBeVisible();
  });
});
```

### **3. Configuración del Sistema**

```typescript
describe("Configuration Management", () => {
  test("should update payment methods", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/config");

    // Deshabilitar Mercado Pago
    await page.click('[data-testid="mercadopago-enabled"]');
    await page.click('[data-testid="save-config"]');

    await expect(page.locator('[data-testid="config-saved"]')).toBeVisible();
  });

  test("should validate configuration changes", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/config");

    // Intentar IVA inválido
    await page.fill('[data-testid="tax-rate"]', "150");
    await page.click('[data-testid="save-config"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
  });
});
```

### **4. Seguridad y Rate Limiting**

```typescript
describe("Security Features", () => {
  test("should block excessive requests", async ({ page }) => {
    // Simular múltiples requests rápidos
    const requests = Array(150)
      .fill()
      .map(() => page.request.post("/api/v1/products"));

    await Promise.all(requests);

    // Verificar bloqueo
    const response = await page.request.post("/api/v1/products");
    expect(response.status()).toBe(429);
  });

  test("should detect malicious input", async ({ page }) => {
    await loginAsTenant(page, "wondernails");
    await page.goto("/t/wondernails/admin_products");

    // Intentar SQL injection
    await page.fill(
      '[data-testid="product-name"]',
      "'; DROP TABLE products; --"
    );
    await page.click('[data-testid="save-product"]');

    await expect(page.locator('[data-testid="security-error"]')).toBeVisible();
  });
});
```

---

## 📊 **MÉTRICAS DE TESTING**

### **Objetivos de Coverage**:

- **Unit Tests**: ≥80% coverage
- **Integration Tests**: ≥90% API coverage
- **E2E Tests**: 100% flujos críticos
- **Security Tests**: 100% vulnerabilidades conocidas

### **Estado Actual**:

- **Unit Tests**: 0% (0/100+ tests)
- **Integration Tests**: 0% (0/50+ tests)
- **E2E Tests**: 0% (0/30+ tests)
- **Security Tests**: 0% (0/20+ tests)

### **Tiempo Estimado**:

- **Fase 1** (Bug Fix): 30 minutos
- **Fase 2** (Unit Tests): 4-6 horas
- **Fase 3** (Integration): 2-3 horas
- **Fase 4** (E2E): 3-4 horas
- **Total**: 9-13 horas

---

## 🚨 **PRIORIDADES INMEDIATAS**

### **1. Corregir Bug Crítico** ⏳ EN PROGRESO

```bash
# Verificar corrección
npm run dev
# Navegar a /t/wondernails/admin
# Confirmar no hay bucle de recargas
```

### **2. Implementar Tests Básicos**

```bash
# Crear estructura de tests
mkdir -p tests/unit/lib/security
mkdir -p tests/integration/api
mkdir -p tests/e2e

# Instalar dependencias si faltan
npm install --save-dev @playwright/test vitest
```

### **3. Ejecutar Primeros Tests**

```bash
# Test básico de funcionamiento
npx playwright test --headed tests/e2e/auth-flow.spec.ts
```

---

## 📁 **ARCHIVOS DE TEST CREADOS**

### **Estructura de Tests**:

```
tests/
├── unit/
│   ├── lib/
│   │   ├── security/
│   │   │   ├── input-validator.spec.ts
│   │   │   ├── rate-limiter.spec.ts
│   │   │   └── audit-logger.spec.ts
│   │   └── auth/
│   │       ├── tenant-guard.spec.ts
│   │       └── middleware.spec.ts
│   └── components/
│       ├── finance-dashboard.spec.ts
│       └── config-panel.spec.ts
├── integration/
│   └── api/
│       ├── products-api.spec.ts
│       ├── finance-api.spec.ts
│       └── tenant-isolation.spec.ts
└── e2e/
    ├── auth-flow.spec.ts
    ├── tenant-isolation.spec.ts
    ├── finance-dashboard.spec.ts
    ├── pos-sales.spec.ts
    ├── config-management.spec.ts
    └── security-validation.spec.ts
```

---

## 🎯 **SIGUIENTES PASOS**

### **Inmediato** (Próximas 2 horas):

1. ✅ **Corregir bug de recargas** (EN PROGRESO)
2. 🔄 **Verificar funcionamiento básico**
3. 🔄 **Crear primeros unit tests**
4. 🔄 **Implementar E2E básico**

### **Corto Plazo** (Próximas 4 horas):

5. 🔄 **Unit tests completos** (80% coverage)
6. 🔄 **Integration tests** (APIs críticas)
7. 🔄 **E2E flujos principales**

### **Mediano Plazo** (Próximas 8 horas):

8. 🔄 **Testing completo** (100% coverage)
9. 🔄 **Performance testing**
10. 🔄 **Security testing**

---

## 📞 **CONTACTO Y SOPORTE**

**Estado del Proyecto**: Aplicación trabada - CRÍTICO
**Próxima Actualización**: Después de corregir bug
**Tiempo Estimado**: 9-13 horas para testing completo

---

**⚠️ IMPORTANTE**: No continuar con desarrollo hasta corregir el bug crítico y tener testing básico funcionando.

# Tests E2E - Sistema Financiero

## 📋 Tests Creados

### 1. **finance/smoke.spec.ts** - Tests de Humo

Verifica que todas las páginas nuevas carguen correctamente:

- ✅ Carga de página de categorías
- ✅ Carga de página de presupuestos
- ✅ Carga de página de gastos de insumos
- ✅ Carga de dashboard financiero con nuevos widgets
- ✅ Verificación de endpoints de API
- ✅ Tests de responsividad

**Comando para ejecutar:**

```bash
npx playwright test tests/e2e/finance/smoke.spec.ts
```

---

### 2. **finance/categories.spec.ts** - Tests de Categorías

Tests completos para gestión de categorías:

- ✅ Visualización de página con estadísticas
- ✅ Filtrado por tipo (Ingresos/Gastos)
- ✅ Búsqueda de categorías
- ✅ Crear nueva categoría
- ✅ Validación de campos requeridos
- ✅ Restaurar categorías por defecto
- ✅ Editar categoría existente

**Comando para ejecutar:**

```bash
npx playwright test tests/e2e/finance/categories.spec.ts
```

---

### 3. **finance/budgets.spec.ts** - Tests de Presupuestos

Tests completos para gestión de presupuestos:

- ✅ Visualización de página con estadísticas
- ✅ Filtrado por estado
- ✅ Búsqueda de presupuestos
- ✅ Crear nuevo presupuesto mensual
- ✅ Validación de campos requeridos
- ✅ Cálculo automático de fechas
- ✅ Alertas de progreso
- ✅ Pausar y reactivar presupuestos

**Comando para ejecutar:**

```bash
npx playwright test tests/e2e/finance/budgets.spec.ts
```

---

### 4. **finance/dashboard.spec.ts** - Tests de Dashboard

Tests del dashboard financiero mejorado:

- ✅ Visualización de todos los widgets
- ✅ Acciones rápidas funcionales
- ✅ Navegación a nuevas páginas
- ✅ Resumen mensual correcto
- ✅ Presupuestos activos con progreso
- ✅ Distribución de gastos
- ✅ Resumen de gastos en insumos
- ✅ Alertas de presupuestos
- ✅ Responsividad

**Comando para ejecutar:**

```bash
npx playwright test tests/e2e/finance/dashboard.spec.ts
```

---

### 5. **inventory/supplies.spec.ts** - Tests de Gastos de Insumos

Tests del reporte de gastos de insumos:

- ✅ Visualización de página con estadísticas
- ✅ Filtrado por período
- ✅ Rango de fechas personalizado
- ✅ Distribución por categoría
- ✅ Tabla de productos
- ✅ Estado vacío
- ✅ Información de insumos
- ✅ Formato de moneda correcto
- ✅ Responsividad

**Comando para ejecutar:**

```bash
npx playwright test tests/e2e/inventory/supplies.spec.ts
```

---

## 🚀 Ejecución de Tests

### Ejecutar Todos los Tests Financieros

```bash
npx playwright test tests/e2e/finance/
```

### Ejecutar Todos los Tests (Incluyendo Inventario)

```bash
npx playwright test tests/e2e/finance/ tests/e2e/inventory/
```

### Ejecutar con UI (Modo Desarrollo)

```bash
npx playwright test tests/e2e/finance/ --ui
```

### Ejecutar con Navegador Visible

```bash
npx playwright test tests/e2e/finance/ --headed
```

### Generar Reporte HTML

```bash
npx playwright test tests/e2e/finance/ --reporter=html
npx playwright show-report
```

---

## 📝 Cobertura de Tests

| Funcionalidad          | Tests   | Estado      |
| ---------------------- | ------- | ----------- |
| Categorías - CRUD      | 7 tests | ✅ Completo |
| Categorías - Filtros   | 2 tests | ✅ Completo |
| Presupuestos - CRUD    | 8 tests | ✅ Completo |
| Presupuestos - Estados | 2 tests | ✅ Completo |
| Dashboard - Widgets    | 8 tests | ✅ Completo |
| Dashboard - Navegación | 4 tests | ✅ Completo |
| Insumos - Reporte      | 8 tests | ✅ Completo |
| Smoke Tests            | 6 tests | ✅ Completo |

**Total: 45 tests E2E**

---

## 🔧 Configuración Requerida

### Variables de Entorno (.env.test)

```env
TEST_TENANT_SLUG="tu-tenant"
TEST_ADMIN_EMAIL="admin@tu-tenant.com"
TEST_ADMIN_PASSWORD="tu-password"
BASE_URL="http://localhost:3001"
```

### Base de Datos

Asegúrate de tener las migraciones aplicadas:

```bash
cd apps/api
npm run db:push
```

---

## 🐛 Solución de Problemas

### Error: "Page not accessible"

- Verifica que el servidor esté corriendo: `npm run dev`
- Verifica las credenciales en `.env.test`

### Error: "Timeout exceeded"

- Aumenta el timeout en `playwright.config.ts`
- Verifica la velocidad de tu conexión

### Error: "Element not found"

- Verifica que los componentes tengan los textos esperados
- Revisa que las páginas carguen correctamente

---

## 📊 Resultados Esperados

Todos los tests deberían pasar si:

1. ✅ El servidor está corriendo en localhost:3001
2. ✅ Las migraciones de base de datos están aplicadas
3. ✅ Las credenciales de test son correctas
4. ✅ Los componentes UI están implementados correctamente

---

## 🔄 Integración CI/CD

Para ejecutar en CI/CD:

```yaml
- name: Run E2E Tests
  run: |
    npm run dev &
    npx wait-on http://localhost:3001
    npx playwright test tests/e2e/finance/
```

---

**Fecha de creación:** 2026-02-14  
**Versión:** 1.0.0  
**Autor:** OpenCode Agent

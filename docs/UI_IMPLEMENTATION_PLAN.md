# Plan de Implementación UI - Sistema de Gestión Financiera

## 📋 Resumen Ejecutivo

Este documento detalla el plan completo para implementar la interfaz de usuario del sistema de gestión financiera, incluyendo categorías de transacciones, presupuestos y vinculación inventario-gastos.

**Tiempo Estimado**: 5-7 días de desarrollo  
**Prioridad**: Alta  
**Dependencias**: APIs ya implementadas y listas para uso

---

## 🗂️ Estructura de Archivos Propuesta

```
apps/web/
├── app/t/[tenant]/
│   ├── finance/
│   │   ├── page.tsx                    # Dashboard financiero (existente - mejorar)
│   │   ├── categories/
│   │   │   └── page.tsx               # Gestión de categorías
│   │   ├── budgets/
│   │   │   ├── page.tsx               # Lista de presupuestos
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Detalle de presupuesto
│   │   └── movements/
│   │       └── page.tsx               # Movimientos financieros (mejorar)
│   └── inventory/
│       ├── page.tsx                    # Inventario (existente - mejorar)
│       └── supplies/
│           └── page.tsx               # Gestión de insumos y reporte
│
├── components/
│   ├── finance/
│   │   ├── CategoryManager.tsx        # CRUD de categorías
│   │   ├── CategoryList.tsx           # Lista de categorías
│   │   ├── BudgetCard.tsx             # Tarjeta de presupuesto
│   │   ├── BudgetList.tsx             # Lista de presupuestos
│   │   ├── BudgetForm.tsx             # Formulario de presupuesto
│   │   ├── BudgetProgress.tsx         # Barra de progreso del presupuesto
│   │   ├── BudgetCategoryLimit.tsx    # Límites por categoría
│   │   ├── MovementForm.tsx           # Formulario de movimiento
│   │   ├── MovementList.tsx           # Lista de movimientos
│   │   └── FinancialDashboard.tsx     # Dashboard principal
│   │
│   ├── inventory/
│   │   ├── ProductSupplyToggle.tsx    # Toggle para marcar como insumo
│   │   ├── SupplyExpenseReport.tsx    # Reporte de gastos de insumos
│   │   ├── ExpenseLinkList.tsx        # Lista de vinculaciones
│   │   └── InventoryTransactionWithExpense.tsx # Transacción con gasto
│   │
│   └── ui/
│       ├── ColorPicker.tsx            # Selector de color
│       ├── IconSelector.tsx           # Selector de icono
│       ├── ProgressBar.tsx            # Barra de progreso
│       ├── DateRangePicker.tsx        # Selector de rango de fechas
│       └── AlertBadge.tsx             # Badge de alerta
│
├── hooks/
│   ├── useCategories.ts               # Hook para categorías
│   ├── useBudgets.ts                  # Hook para presupuestos
│   ├── useMovements.ts                # Hook para movimientos
│   └── useSupplyExpenses.ts           # Hook para gastos de insumos
│
└── lib/
    └── api/
        ├── categories.ts              # Cliente API de categorías
        ├── budgets.ts                 # Cliente API de presupuestos
        └── supply-expenses.ts         # Cliente API de gastos de insumos
```

---

## 🎯 Fases de Implementación

### **FASE 1: Componentes Base y Hooks (Día 1-2)**

#### 1.1 Componentes UI Reutilizables

- [ ] `ColorPicker.tsx` - Selector de color con paleta predefinida
- [ ] `IconSelector.tsx` - Selector de iconos (usando lucide-react)
- [ ] `ProgressBar.tsx` - Barra de progreso con colores según porcentaje
- [ ] `AlertBadge.tsx` - Badge para alertas de presupuesto
- [ ] `DateRangePicker.tsx` - Selector de fechas para períodos

#### 1.2 Hooks Personalizados

- [ ] `useCategories(tenantId)` - CRUD de categorías
- [ ] `useBudgets(tenantId)` - CRUD de presupuestos
- [ ] `useBudgetProgress(budgetId)` - Progreso del presupuesto
- [ ] `useSupplyExpenses(tenantId)` - Gastos de insumos

#### 1.3 Clientes API

- [ ] `categories.ts` - Cliente para `/api/categories`
- [ ] `budgets.ts` - Cliente para `/api/budgets`
- [ ] `supply-expenses.ts` - Cliente para `/api/inventory/expense-links`

**Tiempo estimado**: 12-16 horas

---

### **FASE 2: Gestión de Categorías (Día 2-3)**

#### 2.1 Página de Categorías

**Ruta**: `/t/[tenant]/finance/categories`

**Componentes**:

- [ ] `CategoryManager.tsx` - Componente principal
- [ ] `CategoryList.tsx` - Lista con filtro por tipo (ingreso/gasto)
- [ ] `CategoryForm.tsx` - Formulario para crear/editar
  - Nombre
  - Tipo (radio buttons: Ingreso/Gasto)
  - Color (ColorPicker)
  - Icono (IconSelector)
  - Descripción (opcional)
  - Es gasto fijo? (checkbox)
  - Orden (number)

**Características**:

- [ ] Visualización en lista con color e icono
- [ ] Drag & drop para reordenar
- [ ] Toggle para mostrar/ocultar categorías por defecto
- [ ] Botón "Restaurar categorías por defecto"
- [ ] Validación: No permitir duplicados (nombre + tipo)

**Tiempo estimado**: 8-10 horas

---

### **FASE 3: Sistema de Presupuestos (Día 3-5)**

#### 3.1 Lista de Presupuestos

**Ruta**: `/t/[tenant]/finance/budgets`

**Componentes**:

- [ ] `BudgetList.tsx` - Lista de presupuestos
- [ ] `BudgetCard.tsx` - Tarjeta resumen de cada presupuesto
  - Nombre y período
  - Progreso visual (barra)
  - Monto gastado / total
  - Alerta si > 80%
  - Estado (badge: activo, pausado, completado)
- [ ] `BudgetFilters.tsx` - Filtros por período y estado

#### 3.2 Crear/Editar Presupuesto

**Ruta**: `/t/[tenant]/finance/budgets` (modal o drawer)

**Formulario**:

- [ ] Nombre del presupuesto
- [ ] Tipo de período (select: Semanal, Quincenal, Mensual, Personalizado)
- [ ] Fecha inicio y fin (DateRangePicker)
- [ ] Límite total (input currency)
- [ ] Alerta al % (slider: 50-100%)
- [ ] Rollover habilitado? (toggle)
- [ ] Notas (textarea)

#### 3.3 Detalle de Presupuesto

**Ruta**: `/t/[tenant]/finance/budgets/[id]`

**Componentes**:

- [ ] `BudgetDetailHeader.tsx` - Encabezado con info general
- [ ] `BudgetProgress.tsx` - Progreso general con gráfico
- [ ] `BudgetCategoryLimits.tsx` - Tabla de límites por categoría
  - Categoría (select de categorías de gasto)
  - Límite (input currency)
  - Gastado (calculado automáticamente)
  - Restante
  - % usado
  - Acciones (editar, eliminar)
- [ ] `AddCategoryLimit.tsx` - Formulario para agregar límite
- [ ] `BudgetTransactions.tsx` - Transacciones asociadas al período
- [ ] `BudgetActions.tsx` - Acciones: Pausar, Completar, Cancelar, Duplicar

#### 3.4 Widgets para Dashboard

- [ ] `ActiveBudgetWidget.tsx` - Presupuesto activo en dashboard principal
- [ ] `BudgetAlertWidget.tsx` - Alertas de presupuestos cercanos al límite

**Tiempo estimado**: 20-24 horas

---

### **FASE 4: Vinculación Inventario-Gastos (Día 5-6)**

#### 4.1 Gestión de Insumos en Productos

**Ruta**: `/t/[tenant]/admin/products` (mejorar existente)

**Modificaciones**:

- [ ] Agregar toggle "Es insumo" en formulario de producto
- [ ] Al activar, mostrar:
  - Select de categoría de gasto
  - Toggle "Crear gasto automáticamente"
  - Input de plantilla de descripción
- [ ] Badge "Insumo" en lista de productos

#### 4.2 Reporte de Gastos de Insumos

**Ruta**: `/t/[tenant]/inventory/supplies`

**Componentes**:

- [ ] `SupplyExpenseReport.tsx` - Reporte principal
  - Filtros por fecha (rango)
  - Tabla con:
    - Producto (nombre + SKU)
    - Categoría de gasto
    - Cantidad total comprada
    - Costo total
    - # de transacciones
  - Gráfico de torta: Distribución por categoría
  - Gráfico de barras: Evolución mensual
- [ ] `SupplyExpenseSummary.tsx` - Cards de resumen
  - Total gastado en período
  - Producto con mayor gasto
  - Variación vs período anterior

#### 4.3 Vinculaciones en Transacciones

**Ruta**: `/t/[tenant]/inventory` (mejorar existente)

**Modificaciones**:

- [ ] Al registrar entrada de inventario:
  - Detectar si es producto insumo
  - Mostrar preview del gasto que se creará
  - Checkbox para confirmar creación de gasto
- [ ] Badge "Gasto creado" en transacciones de insumos
- [ ] Link para ver detalle del gasto asociado

#### 4.4 Lista de Vinculaciones

**Ruta**: `/t/[tenant]/inventory/expense-links` (opcional)

**Componentes**:

- [ ] `ExpenseLinkList.tsx` - Tabla de vinculaciones
  - Producto
  - Transacción de inventario
  - Movimiento financiero (con link)
  - Monto
  - Estado
  - Acciones (cancelar)

**Tiempo estimado**: 12-16 horas

---

### **FASE 5: Dashboard Financiero Mejorado (Día 6-7)**

#### 5.1 Mejoras a `/t/[tenant]/finance`

**Nuevas Secciones**:

- [ ] **Resumen del Mes**
  - Ingresos totales
  - Gastos totales
  - Balance (ingresos - gastos)
  - Comparación vs mes anterior

- [ ] **Presupuestos Activos**
  - Cards de presupuestos en curso
  - Alertas de presupuestos al 80%+

- [ ] **Gastos por Categoría**
  - Gráfico circular de distribución
  - Top 5 categorías con mayor gasto

- [ ] **Insumos**
  - Resumen de gastos en insumos del mes
  - Link al reporte detallado

- [ ] **Acciones Rápidas**
  - Botón "Registrar ingreso"
  - Botón "Registrar gasto"
  - Botón "Crear presupuesto"

**Tiempo estimado**: 8-10 horas

---

## 🎨 Especificaciones de Diseño

### Paleta de Colores

- **Ingresos**: Verde (#10B981)
- **Gastos**: Rojo (#EF4444)
- **Alerta**: Naranja (#F97316)
- **Presupuesto**: Azul (#3B82F6)
- **Insumos**: Púrpura (#8B5CF6)

### Iconografía (Lucide)

- Categorías: `Tag`, `Folder`, `Bookmark`
- Presupuestos: `Wallet`, `PiggyBank`, `Calculator`
- Insumos: `Package`, `Box`, `ShoppingCart`
- Finanzas: `DollarSign`, `TrendingUp`, `TrendingDown`

### Layout

- Usar sistema de grillas existente
- Cards con shadow suave
- Separadores visuales claros
- Responsive (mobile-first)

---

## 🔌 Integración con APIs

### Endpoints a Utilizar

```typescript
// Categorías
GET    /api/categories?tenant={id}&type={income|expense}
POST   /api/categories?tenant={id}
PUT    /api/categories/{id}?tenant={id}
DELETE /api/categories/{id}?tenant={id}
POST   /api/categories/seed

// Presupuestos
GET    /api/budgets?tenant={id}
POST   /api/budgets?tenant={id}
GET    /api/budgets/{id}?tenant={id}&includeProgress=true
PUT    /api/budgets/{id}?tenant={id}
DELETE /api/budgets/{id}?tenant={id}
GET    /api/budgets/{id}/categories
POST   /api/budgets/{id}/categories

// Gastos de Insumos
GET    /api/inventory/expense-links?tenant={id}
POST   /api/inventory/expense-links
PUT    /api/inventory/expense-links/{id}
GET    /api/inventory/supply-report?tenant={id}&startDate=&endDate=
```

---

## 🧪 Testing Plan

### Tests Unitarios

- [ ] Hooks funcionan correctamente
- [ ] Componentes renderizan sin errores
- [ ] Formularios validan correctamente
- [ ] Cálculos de progreso son correctos

### Tests de Integración

- [ ] Crear categoría → Aparece en lista
- [ ] Crear presupuesto → Calcula progreso correctamente
- [ ] Marcar producto como insumo → Al comprar, crea gasto
- [ ] Eliminar presupuesto → Elimina límites asociados

### Tests E2E (Playwright)

- [ ] Flujo completo de creación de categoría
- [ ] Flujo completo de creación de presupuesto
- [ ] Flujo de compra de insumo con gasto automático

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px - Layout de una columna
- **Tablet**: 640px - 1024px - Dos columnas
- **Desktop**: > 1024px - Layout completo

---

## 🔒 Consideraciones de Seguridad

- [ ] Validar que el usuario tiene acceso al tenant
- [ ] Sanitizar inputs de formularios
- [ ] Manejar errores de API con mensajes amigables
- [ ] Confirmar acciones destructivas (eliminar)

---

## 🚀 Plan de Despliegue

1. **Día 1-2**: Fase 1 (Componentes base y hooks)
2. **Día 2-3**: Fase 2 (Categorías)
3. **Día 3-5**: Fase 3 (Presupuestos)
4. **Día 5-6**: Fase 4 (Insumos)
5. **Día 6-7**: Fase 5 (Dashboard) + Testing
6. **Día 7**: Revisión final y ajustes

---

## ✅ Checklist de Aceptación

- [ ] Usuario puede crear/editar/eliminar categorías
- [ ] Usuario puede crear/editar/eliminar presupuestos
- [ ] Usuario puede ver progreso de presupuestos en tiempo real
- [ ] Usuario puede configurar límites por categoría en presupuestos
- [ ] Usuario puede marcar productos como insumos
- [ ] Al comprar insumo, se crea gasto automáticamente
- [ ] Usuario puede ver reporte de gastos de insumos
- [ ] Dashboard financiero muestra resumen completo
- [ ] Toda la UI es responsive
- [ ] Tests pasan correctamente

---

**¿Apruebas este plan? ¿Hay algo que quieras ajustar o priorizar diferente?**

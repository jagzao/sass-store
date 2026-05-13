# Inventory — Test Report

**Fecha última prueba:** 2026-05-12
**URL:** http://localhost:3003/t/wondernails/inventory
**URL Final:** http://localhost:3003/t/wondernails/inventory
**Status:** ✅ OK
**Título página:** Sass Store
**Errores consola:** 9

## 🔍 Funcionalidades detectadas

### 🖱️ Botones

- Inventario
- Proveedores
- Movimientos
- Transferencias
- Ubicaciones
- Alertas
- Configuración
- Anterior
- Siguiente
- 0
  1
  Issue

### 🔗 Links

- Calendario
  0
- 🏠Inicio
- 📋Citas
- 📅Agenda
- 👥Clientas
- ☰Más

### 📝 Inputs / Formularios

- Buscar por nombre, SKU o categoría...

### 📌 Headings

- Sistema de Inventario

## 📋 Checklist de validación (para LLM / QA)

- [ ] La página carga sin errores de consola críticos
- [ ] Se ven los botones principales y responden al click
- [ ] Se ven los links de navegación
- [ ] Los formularios (si aplica) tienen labels y placeholders legibles
- [ ] No hay elementos rotos (imágenes, iconos, fuentes)
- [ ] Responsive: la UI no se rompe en viewport 1280x720

## 🖼️ Evidencia

![Screenshot](inventory.png)

## ⚠️ Errores de consola

- `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
- `Inventory error: Error: No autorizado
  at useInventory.useCallback[apiRequest] (http://localhost:3003/_next/static/ch`
- `Error loading inventory: Error: No autorizado
  at useInventory.useCallback[apiRequest] (http://localhost:3003/_next/s`
- `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
- `Inventory error: Error: No autorizado
  at useInventory.useCallback[apiRequest] (http://localhost:3003/_next/static/ch`

---

_Generado automáticamente por Playwright Web Map Report_

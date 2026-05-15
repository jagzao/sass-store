# BOOK LOGGED — Deep Audit Report

**Tenant:** centro-tenistico  
**URL:** http://localhost:3003/t/centro-tenistico/book  
**Status:** ✅ OK (logueado)  
**Título página:** Reservar Cita  
**Fecha:** 2026-05-13  
**Errores consola:** 0

## 🔍 Funcionalidades detectadas

### 🖱️ Botones (7)

- QHola, QA
- Tue12thLibre
- Wed13thLibre
- Thu14thLibre
- Fri15thLibre
- Sat16thLibre
- Reservar ahora

### 🔗 Links (4)

- Productos
- Servicios
- Reservar
- Contacto

### 📝 Inputs / Formularios (1)

- `input` label="Buscar servicio..."

### 📌 Headings (1)

- Horarios disponibles

## 🎬 Flujos de interacción verificados

- Selector de servicio funciona
- Carousel de fechas navegable
- Grid de horarios seleccionable
- Formulario de datos visible y rellenable
- Botón 'Reservar ahora' clickeable
- Submit envía POST a /api/tenants/{tenant}/bookings

## ⚠️ Errores de consola

_Sin errores._

## 📋 Checklist de validación (para LLM / QA)

- [ ] La página carga sin errores de consola críticos
- [ ] Se ven los botones principales y responden al click
- [ ] Se ven los links de navegación
- [ ] Los formularios (si aplica) tienen labels y placeholders legibles
- [ ] No hay elementos rotos (imágenes, iconos, fuentes)
- [ ] Responsive: la UI no se rompe en viewport 1280x720
- [ ] Flujos principales (reserva, compra, edición) funcionan
- [ ] Redirecciones de auth funcionan correctamente

## 🖼️ Evidencia

![Screenshot](../screenshots/book_logged.png)

---

_Generado automáticamente por Playwright Deep Audit_

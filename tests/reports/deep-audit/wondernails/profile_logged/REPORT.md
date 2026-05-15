# PROFILE LOGGED — Deep Audit Report

**Tenant:** wondernails  
**URL:** http://localhost:3003/t/wondernails/profile  
**Status:** ✅ OK (logueado)  
**Título página:** Perfil de Usuario  
**Fecha:** 2026-05-13  
**Errores consola:** 0

## 🔍 Funcionalidades detectadas

### 🖱️ Botones (10)

- QHola, QA
- Editar
- Cambiar ContraseñaActualiza tu contraseña de acceso
- Preferencias de NotificacionesConfigura cómo recibir notificaciones
- PrivacidadConfigura tu privacidad y datos
- AdministradorAcceso completo al sistema y gestión de usuarios✓ Rol actual
- GerenteGestión de operaciones y reportes
- PersonalAcceso limitado a funciones operativas
- ClienteAcceso básico para compras y reservas
- Seleccionar archivo

### 🔗 Links (4)

- Productos
- Servicios
- Reservar
- Contacto

### 📝 Inputs / Formularios (1)

- `input`

### 📌 Headings (5)

- Hola, QA
- Información PersonalEditar
- Configuración de Cuenta
- Gestión de Roles
- Logo Tenant

## 🎬 Flujos de interacción verificados

- Avatar con iniciales del usuario
- Información Personal: Nombre, Email, Teléfono, Fecha nacimiento, Género, Rol
- Botón 'Editar' activa modo edición
- Inputs editables en modo edición
- Botón 'Guardar Cambios' persiste cambios vía PUT /api/profile
- Configuración de Cuenta: Cambiar Contraseña, Preferencias, Privacidad
- Gestión de Roles: Admin / Gerente / Personal / Cliente
- Admin Links: Gestionar Productos / Servicios (si aplica)
- Logo Tenant upload (Admin only)
- Modal de cambio de contraseña con validación

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

![Screenshot](../screenshots/profile_logged.png)

---

_Generado automáticamente por Playwright Deep Audit_

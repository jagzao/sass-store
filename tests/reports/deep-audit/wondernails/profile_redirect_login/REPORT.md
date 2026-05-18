# PROFILE REDIRECT LOGIN — Deep Audit Report

**Tenant:** wondernails  
**URL:** http://localhost:3003/t/wondernails/profile  
**Status:** 🔀 REDIRECT a login  
**Título página:** Iniciar Sesión  
**Fecha:** 2026-05-16  
**Errores consola:** 0

## 🔍 Funcionalidades detectadas

### 🖱️ Botones (2)

- Iniciar Sesión
- Continuar con Google

### 🔗 Links (8)

- Reservar
- Productos
- Servicios
- Contacto
- Iniciar Sesión
- ¿Olvidaste tu contraseña?
- Regístrate aquí
- ← Volver a la tienda

### 📝 Inputs / Formularios (3)

- `input` placeholder="tu@email.com" label="email-input"
- `input` placeholder="••••••••" label="password-input"
- `input`

### 📌 Headings (2)

- Wonder Nails Studio
- Inicia sesión en tu cuenta

## 🎬 Flujos de interacción verificados

- Página protegida: redirige a /login cuando el usuario no está autenticado

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

![Screenshot](../screenshots/profile_redirect_login.png)

---

_Generado automáticamente por Playwright Deep Audit_

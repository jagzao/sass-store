# User Acceptance Test Steps (UAT) — Template

> **Feature:** [Nombre del Feature]
> **Tenant objetivo:** [wondernails | vigistudio | villafuerte | zo-system]
> **Fecha:** [YYYY-MM-DD]
> **Generado por:** Agente Feature Developer
> **Estado:** PENDIENTE_VALIDACION

---

## 1. Contexto y Propósito

Este documento describe los **pasos que un usuario final (no técnico) ejecutaría** para utilizar la funcionalidad. Sirve como:

1. **Guía de validación manual** para el Product Owner / Usuario.
2. **Base para tests E2E automatizados** (Playwright).
3. **Contrato de aceptación**: si estos pasos pasan, la feature está lista.

---

## 2. Precondiciones

| # | Precondición | Cómo verificar |
|---|-------------|----------------|
| 1 | Usuario autenticado como Admin | Login con email + password válidos |
| 2 | Tenant activo y configurado | URL `/t/[tenant]` responde 200 |
| 3 | Datos de prueba disponibles | Productos / servicios / citas existen en DB |

---

## 3. Pasos de Usuario (Happy Path)

### Escenario Principal: [Descripción del flujo principal]

| Paso | Acción del Usuario | Resultado Esperado | Selector / Texto Playwright |
|------|-------------------|--------------------|----------------------------|
| 1 | Ingresar a la URL de login | Página de login visible | `input[type="email"]` |
| 2 | Introducir email y contraseña | Campos llenos | `tu@email.com` / `••••••••` |
| 3 | Hacer clic en "Iniciar Sesión" | Redirección al dashboard | `button:has-text("Iniciar Sesión")` |
| 4 | Navegar a la sección [X] | Página [X] carga correctamente | URL: `/t/[tenant]/[seccion]` |
| 5 | Hacer clic en [botón] | Modal / formulario aparece | `button:has-text("[texto]")` |
| 6 | Completar campo [Y] con [valor] | Valor aceptado | `input[name="[Y]"]` |
| 7 | Hacer clic en [Confirmar] | Mensaje de éxito visible | `text=éxito | confirmada | guardado` |
| 8 | Verificar que [resultado] aparece en la lista | [Resultado] visible en UI | `[data-testid="..."]` o `text=[resultado]` |

---

## 4. Casos Alternativos y Edge Cases

### Escenario Alternativo 1: [Descripción]

| Paso | Acción del Usuario | Resultado Esperado |
|------|-------------------|--------------------|
| 1 | [Acción] | [Resultado] |

### Escenario de Error: [Descripción]

| Paso | Acción del Usuario | Resultado Esperado (manejo de error) |
|------|-------------------|--------------------------------------|
| 1 | [Acción inválida] | Mensaje de error claro: "[mensaje]" |

---

## 5. Datos de Prueba

| Campo | Valor de Prueba | Tipo |
|-------|----------------|------|
| Email | `test@example.com` | Válido |
| Nombre | `Cliente Demo` | Válido |
| Teléfono | `555-1234-5678` | Válido |
| Cantidad | `3` | Válido |
| Cantidad (inválida) | `-1` | Inválido (debe rechazar) |

---

## 6. Checklist de Validación (para el Usuario)

- [ ] Todos los pasos del Happy Path se ejecutan sin errores.
- [ ] Los textos/mensajes son claros y comprensibles.
- [ ] La UI responde en menos de 3 segundos por paso.
- [ ] Los errores se manejan con mensajes amigables.
- [ ] Los datos persisten correctamente (recarga de página).

---

## 7. Mapeo a Tests E2E de Playwright

Una vez validado por el usuario, estos pasos se convierten en:

```typescript
// tests/e2e/[feature]/[feature]-user-acceptance.spec.ts
test("[Feature] - Happy Path", async ({ page }) => {
  // Paso 1: Navegar a login
  await page.goto("/t/[tenant]/login");
  // Paso 2: Llenar credenciales
  await page.fill('input[type="email"]', "test@example.com");
  // ... etc
});
```

---

## 8. Historial de Validación

| Fecha | Validador | Estado | Comentarios |
|-------|-----------|--------|-------------|
| | | PENDIENTE | |

---

*Documento generado automáticamente. Debe ser validado por el Product Owner antes de escribir tests E2E.*

# User Acceptance Test Steps (UAT) — POS Checkout con Tarjeta

> **Feature:** POS Checkout — Cobro en punto de venta con múltiples métodos de pago
> **Tenant objetivo:** wondernails
> **Fecha:** 2026-04-28
> **Generado por:** Agente Feature Developer
> **Estado:** PENDIENTE_VALIDACION

---

## 1. Contexto y Propósito

Validar que un administrador de tienda pueda:
1. Ingresar al punto de venta (POS).
2. Agregar productos al carrito.
3. Cobrar al cliente con efectivo, tarjeta o MercadoPago.
4. Ver el ticket de venta generado.

---

## 2. Precondiciones

| # | Precondición | Cómo verificar |
|---|-------------|----------------|
| 1 | Usuario autenticado como Admin | Login con `admin@test.com` / `Admin123!` |
| 2 | Tenant activo con productos | URL `/t/wondernails/pos` responde 200 y muestra productos |
| 3 | Servidor de desarrollo levantado | `npm run dev` en puerto 3001 |

---

## 3. Pasos de Usuario (Happy Path)

### Escenario Principal: Cobro rápido en POS

| Paso | Acción del Usuario | Resultado Esperado | Selector / Texto Playwright |
|------|-------------------|--------------------|----------------------------|
| 1 | Abrir navegador e ir a `/t/wondernails/pos` | Redirección a login si no autenticado | `input[type="email"]` |
| 2 | Ingresar email `admin@test.com` y contraseña | Campos llenos | `input[name="email"]` / `input[name="password"]` |
| 3 | Hacer clic en "Iniciar Sesión" | Dashboard del admin visible | `text=Dashboard` |
| 4 | Navegar a "Punto de Venta" | Página POS carga: muestra grid de productos y sección de carrito | `text=Punto de Venta` |
| 5 | Identificar producto "Producto E2E Test" y hacer clic en "Agregar" | Producto aparece en carrito con cantidad 1 | `button:has-text("Agregar")` |
| 6 | Verificar que carrito muestra "Carrito (1 items)" | Texto visible en panel derecho | `text=Carrito (1 items)` |
| 7 | Hacer clic en "Cobrar $XX.XX" | Modal de pago aparece | `button:has-text("Cobrar")` |
| 8 | Seleccionar método de pago "Efectivo" | Opción marcada | `input[value="cash"]` |
| 9 | Hacer clic en "Confirmar Cobro" | Modal cierra, mensaje "Venta completada" | `text=Venta completada` |
| 10 | Verificar que carrito se vacía | "Carrito (0 items)" | `text=Carrito (0 items)` |

---

## 4. Casos Alternativos

### Escenario Alternativo 1: Pago con MercadoPago

| Paso | Acción del Usuario | Resultado Esperado |
|------|-------------------|--------------------|
| 5a | Agregar producto al carrito | Producto en carrito |
| 6a | Hacer clic en "Cobrar" | Modal de pago |
| 7a | Seleccionar "MercadoPago" | Opción marcada |
| 8a | Hacer clic en "Confirmar Cobro" | Redirección a MercadoPago (sandbox) o QR generado |
| 9a | Completar pago en MercadoPago | Redirección de vuelta con "Pago confirmado" |

### Escenario de Error: Stock insuficiente

| Paso | Acción del Usuario | Resultado Esperado (manejo de error) |
|------|-------------------|--------------------------------------|
| 5b | Intentar agregar cantidad 999 de un producto | Mensaje: "Stock insuficiente: solo quedan X unidades" |

---

## 5. Datos de Prueba

| Campo | Valor de Prueba | Tipo |
|-------|----------------|------|
| Email | `admin@test.com` | Válido |
| Contraseña | `Admin123!` | Válido |
| Producto | `Producto E2E Test` | Pre-seedeado por API |
| Precio | `$99.99` | Válido |
| Cantidad | `1` | Válido |
| Cantidad (inválida) | `0` | Inválido (botón deshabilitado) |

---

## 6. Checklist de Validación (para el Usuario)

- [ ] Todos los pasos del Happy Path se ejecutan sin errores.
- [ ] Los textos/mensajes son claros y comprensibles.
- [ ] La UI responde en menos de 3 segundos por paso.
- [ ] Los errores se manejan con mensajes amigables.
- [ ] Los datos persisten correctamente (recarga de página mantiene venta en historial).

---

## 7. Mapeo a Tests E2E de Playwright

Una vez validado por el usuario, estos pasos se convierten en:

```typescript
// tests/e2e/pos/pos-checkout-uat.spec.ts
test("POS Checkout - Happy Path", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/t/wondernails/pos");
  await page.waitForFunction(() => !document.body.innerText.includes("Cargando punto de venta"));

  // Agregar producto
  await page.click("button:has-text('Agregar')");
  await expect(page.locator("text=Carrito (1 items)")).toBeVisible();

  // Cobrar
  await page.click("button:has-text('Cobrar')");
  await page.click("input[value='cash']");
  await page.click("button:has-text('Confirmar Cobro')");

  // Verificar éxito
  await expect(page.locator("text=Venta completada")).toBeVisible();
});
```

---

## 8. Historial de Validación

| Fecha | Validador | Estado | Comentarios |
|-------|-----------|--------|-------------|
| 2026-04-28 | — | PENDIENTE | Esperando validación de PO |

---

*Documento generado automáticamente. Debe ser validado por el Product Owner antes de escribir tests E2E formales.*

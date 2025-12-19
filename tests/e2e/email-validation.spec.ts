import { test, expect } from "@playwright/test";

test.describe("Email Validation with Unicode Characters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/t/wondernails/register");
  });

  test("should accept email with ñ character during registration", async ({
    page,
  }) => {
    // Esperar a que el formulario de registro se cargue
    await page.waitForSelector('[data-testid="register-form"]');

    // Llenar el formulario con un correo que contiene ñ
    await page.fill("#name", "Usuario de Prueba");
    await page.fill("#email", "usuario@dominioño.com");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no hay errores de validación
    const errorMessage = page.locator("role=alert");
    await expect(errorMessage).not.toBeVisible();

    // Verificar que el registro fue exitoso (redirección a login)
    await expect(page).toHaveURL(/login/);
  });

  test("should accept email with accented characters during registration", async ({
    page,
  }) => {
    // Esperar a que el formulario de registro se cargue
    await page.waitForSelector('[data-testid="register-form"]');

    // Llenar el formulario con un correo que contiene acentos
    await page.fill("#name", "Usuario de Prueba");
    await page.fill("#email", "usuário@dominio.com");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no hay errores de validación
    const errorMessage = page.locator("role=alert");
    await expect(errorMessage).not.toBeVisible();

    // Verificar que el registro fue exitoso (redirección a login)
    await expect(page).toHaveURL(/login/);
  });

  test("should accept email with ü character during registration", async ({
    page,
  }) => {
    // Esperar a que el formulario de registro se cargue
    await page.waitForSelector('[data-testid="register-form"]');

    // Llenar el formulario con un correo que contiene ü
    await page.fill("#name", "Usuario de Prueba");
    await page.fill("#email", "usuario@dominiö.com");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no hay errores de validación
    const errorMessage = page.locator("role=alert");
    await expect(errorMessage).not.toBeVisible();

    // Verificar que el registro fue exitoso (redirección a login)
    await expect(page).toHaveURL(/login/);
  });

  test("should reject invalid email format even with unicode characters", async ({
    page,
  }) => {
    // Esperar a que el formulario de registro se cargue
    await page.waitForSelector('[data-testid="register-form"]');

    // Llenar el formulario con un correo inválido (falta el @)
    await page.fill("#name", "Usuario de Prueba");
    await page.fill("#email", "usuariodominioño.com");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que hay un error de validación
    const errorMessage = page.locator("role=alert");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("inválido");
  });

  test("should show validation error for email without domain", async ({
    page,
  }) => {
    // Esperar a que el formulario de registro se cargue
    await page.waitForSelector('[data-testid="register-form"]');

    // Llenar el formulario con un correo sin dominio
    await page.fill("#name", "Usuario de Prueba");
    await page.fill("#email", "usuarioño@");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que hay un error de validación
    const errorMessage = page.locator("role=alert");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("inválido");
  });

  test("should accept complex unicode email in both local and domain parts", async ({
    page,
  }) => {
    // Esperar a que el formulario de registro se cargue
    await page.waitForSelector('[data-testid="register-form"]');

    // Llenar el formulario con un correo complejo con unicode en ambas partes
    await page.fill("#name", "Usuario de Prueba");
    await page.fill("#email", "usuáriño@dominiñoñ.com");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no hay errores de validación
    const errorMessage = page.locator("role=alert");
    await expect(errorMessage).not.toBeVisible();

    // Verificar que el registro fue exitoso (redirección a login)
    await expect(page).toHaveURL(/login/);
  });
});

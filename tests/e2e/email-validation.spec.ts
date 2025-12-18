import { test, expect } from "@playwright/test";

test.describe("Validación de correo electrónico con caracteres Unicode", () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de registro
    await page.goto("/t/wondernails/register");
  });

  test("debería aceptar correo electrónico con letra ñ en la parte local", async ({
    page,
  }) => {
    // Llenar el formulario con un correo electrónico que contiene ñ
    await page.fill("#name", "Estefanía Granillo Muñoz");
    await page.fill("#email", "estefagranillomuñoz@gmail.com");
    await page.fill("#phone", "5512345678");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");

    // Aceptar términos y condiciones
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no haya errores de validación
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).not.toBeVisible();

    // Verificar que se redirija a la página de login
    await expect(page).toHaveURL(/.*login\?registered=true/);
  });

  test("debería aceptar correo electrónico con letra ñ en el dominio", async ({
    page,
  }) => {
    // Llenar el formulario con un correo electrónico que contiene ñ en el dominio
    await page.fill("#name", "Juan Pérez");
    await page.fill("#email", "juan.perez@miñonia.com");
    await page.fill("#phone", "5587654321");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");

    // Aceptar términos y condiciones
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no haya errores de validación
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).not.toBeVisible();

    // Verificar que se redirija a la página de login
    await expect(page).toHaveURL(/.*login\?registered=true/);
  });

  test("debería aceptar correo electrónico con acentos", async ({ page }) => {
    // Llenar el formulario con un correo electrónico que contiene acentos
    await page.fill("#name", "María González");
    await page.fill("#email", "maría.gonzález@ejemplo.com");
    await page.fill("#phone", "5511223344");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");

    // Aceptar términos y condiciones
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que no haya errores de validación
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).not.toBeVisible();

    // Verificar que se redirija a la página de login
    await expect(page).toHaveURL(/.*login\?registered=true/);
  });

  test("debería rechazar correo electrónico con formato inválido", async ({
    page,
  }) => {
    // Llenar el formulario con un correo electrónico inválido
    await page.fill("#name", "Usuario Inválido");
    await page.fill("#email", "usuario@");
    await page.fill("#phone", "5599887766");
    await page.fill("#password", "Password123");
    await page.fill("#confirmPassword", "Password123");

    // Aceptar términos y condiciones
    await page.check("#terms");

    // Enviar el formulario
    await page.click('[data-testid="register-submit"]');

    // Verificar que haya un error de validación
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("email");
  });
});

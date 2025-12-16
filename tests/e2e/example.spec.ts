import { test, expect } from "@playwright/test";

test.describe("Example Test Suite", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Verificar que la página cargó correctamente
    await expect(page).toHaveTitle(/Sass Store|Home/i);
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Buscar y hacer click en el enlace de login
    // Ajusta estos selectores según tu aplicación
    const loginLink = page.getByRole("link", {
      name: /login|sign in|iniciar sesión/i,
    });

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login|auth|signin/i);
    } else {
      test.skip("Login link not found on homepage");
    }
  });
});

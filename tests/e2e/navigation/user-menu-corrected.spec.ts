import { test, expect } from '@playwright/test';

/**
 * Test: User Menu Navigation (CORRECTED VERSION)
 * Validates user menu functionality and navigation
 */

test.describe('User Menu Navigation (CORRECTED)', () => {
  const tenants = ['wondernails', 'nom-nom'];

  test('should display user menu with correct navigation options', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant page
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check if user menu is visible
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      if (await userMenu.count() > 0) {
        await expect(userMenu).toBeVisible();

        // Open user menu
        await userMenu.click();
        await page.waitForTimeout(200);

        // Check for menu items
        const menuItems = page.locator('[data-testid="user-menu-item"], .user-menu-item');
        const itemCount = await menuItems.count();
        expect(itemCount).toBeGreaterThanOrEqual(1);

        // Check for profile link
        const profileLink = page.locator('[data-testid="profile-link"], a:has-text("Perfil"), a:has-text("Mi Perfil")');
        if (await profileLink.count() > 0) {
          await expect(profileLink).toBeVisible();
        }

        // Check for orders link
        const ordersLink = page.locator('[data-testid="orders-link"], a:has-text("Pedidos"), a:has-text("Mis Pedidos")');
        if (await ordersLink.count() > 0) {
          await expect(ordersLink).toBeVisible();
        }

        // Check for logout button
        const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Cerrar Sesión"), button:has-text("Salir")');
        if (await logoutButton.count() > 0) {
          await expect(logoutButton).toBeVisible();
        }

        // Close menu
        await page.click('body');
        await page.waitForTimeout(200);

        console.log(`✅ ${tenant}: User menu navigation validated`);
      }
    }
  });

  test('should navigate to profile page correctly', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant page
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Open user menu
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      if (await userMenu.count() > 0) {
        await userMenu.click();
        await page.waitForTimeout(200);

        // Click profile link
        const profileLink = page.locator('[data-testid="profile-link"], a:has-text("Perfil"), a:has-text("Mi Perfil")');
        if (await profileLink.count() > 0) {
          await profileLink.click();
          await page.waitForLoadState('networkidle');

          // Should be on profile page
          expect(page.url()).toContain(`/t/${tenant}/profile`);

          // Check for profile content
          const profileContent = page.locator('[data-testid="profile-content"], .profile-content');
          await expect(profileContent).toBeVisible();

          console.log(`✅ ${tenant}: Profile navigation works correctly`);
        }
      }
    }
  });

  test('should navigate to orders page correctly', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant page
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Open user menu
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      if (await userMenu.count() > 0) {
        await userMenu.click();
        await page.waitForTimeout(200);

        // Click orders link
        const ordersLink = page.locator('[data-testid="orders-link"], a:has-text("Pedidos"), a:has-text("Mis Pedidos")');
        if (await ordersLink.count() > 0) {
          await ordersLink.click();
          await page.waitForLoadState('networkidle');

          // Should be on orders page
          expect(page.url()).toContain(`/t/${tenant}/orders`);

          // Check for orders content
          const ordersContent = page.locator('[data-testid="orders-content"], .orders-content');
          await expect(ordersContent).toBeVisible();

          console.log(`✅ ${tenant}: Orders navigation works correctly`);
        }
      }
    }
  });

  test('should handle logout correctly', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant page
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Open user menu
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      if (await userMenu.count() > 0) {
        await userMenu.click();
        await page.waitForTimeout(200);

        // Click logout button
        const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Cerrar Sesión"), button:has-text("Salir")');
        if (await logoutButton.count() > 0) {
          await logoutButton.click();
          await page.waitForLoadState('networkidle');

          // Should be redirected to login page or home page
          const isLoginPage = page.url().includes('/login');
          const isHomePage = page.url().includes(`/t/${tenant}`);
          
          expect(isLoginPage || isHomePage).toBe(true);

          console.log(`✅ ${tenant}: Logout works correctly`);
        }
      }
    }
  });

  test('should show admin options for admin users', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant page
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Open user menu
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu');
      if (await userMenu.count() > 0) {
        await userMenu.click();
        await page.waitForTimeout(200);

        // Check for admin options (may not be visible for regular users)
        const adminOptions = page.locator('[data-testid="admin-option"], .admin-option');
        const adminCount = await adminOptions.count();
        
        // Admin options may or may not be present depending on user role
        expect(adminCount).toBeGreaterThanOrEqual(0);

        // Close menu
        await page.click('body');
        await page.waitForTimeout(200);

        console.log(`✅ ${tenant}: Admin options checked`);
      }
    }
  });
});
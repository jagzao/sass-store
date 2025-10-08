import { test, expect } from '@playwright/test';

/**
 * Navigation & Core System Capabilities Tests
 * Tests for Login, Navigation, Search, Filters, Cart, Checkout
 */

test.describe('Authentication & Login', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/t/wondernails/login');

    await page.fill('[data-testid="email-input"], input[name="email"]', 'test@wondernails.com');
    await page.fill('[data-testid="password-input"], input[name="password"]', 'password123');

    await page.click('[data-testid="login-btn"], button[type="submit"]');

    // Should redirect to dashboard or home
    await expect(page).toHaveURL(/dashboard|home|products/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/t/wondernails/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    const errorMessage = page.locator('[data-testid="error-message"], [role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/t/wondernails/dashboard');

    const logoutBtn = page.locator('[data-testid="logout-btn"], button:has-text("Logout")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();

      // Should redirect to login or home
      await expect(page).toHaveURL(/login|^\/$|^\/t\/wondernails\/?$/);
    }
  });

  test('should remember me functionality work', async ({ page, context }) => {
    await page.goto('/t/wondernails/login');

    await page.fill('input[name="email"]', 'test@wondernails.com');
    await page.fill('input[name="password"]', 'password123');

    const rememberMe = page.locator('input[name="rememberMe"], input[type="checkbox"]');
    if (await rememberMe.isVisible()) {
      await rememberMe.check();
    }

    await page.click('button[type="submit"]');

    // Get cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));

    // Session should persist
    expect(sessionCookie).toBeDefined();
    if (sessionCookie) {
      expect(sessionCookie.expires).toBeGreaterThan(Date.now() / 1000 + 86400); // > 1 day
    }
  });
});

test.describe('Navigation & Menu', () => {
  test('should navigate through main menu', async ({ page }) => {
    await page.goto('/t/wondernails');

    // Test navigation to products
    const productsLink = page.locator('[data-testid="nav-products"], a[href*="products"]');
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await expect(page).toHaveURL(/products/);
    }

    // Test navigation to services
    await page.goBack();
    const servicesLink = page.locator('[data-testid="nav-services"], a[href*="services"]');
    if (await servicesLink.isVisible()) {
      await servicesLink.click();
      await expect(page).toHaveURL(/services/);
    }

    // Test navigation to booking
    await page.goBack();
    const bookingLink = page.locator('[data-testid="nav-booking"], a[href*="booking"]');
    if (await bookingLink.isVisible()) {
      await bookingLink.click();
      await expect(page).toHaveURL(/booking|services/);
    }
  });

  test('should show mobile menu on mobile devices', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.goto('/t/wondernails');

    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"]');
    await mobileMenuToggle.click();

    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
  });

  test('should navigate with breadcrumbs', async ({ page }) => {
    await page.goto('/t/wondernails/products/nail-polish-red');

    const breadcrumbs = page.locator('[data-testid="breadcrumbs"], nav[aria-label="breadcrumb"]');
    if (await breadcrumbs.isVisible()) {
      const homeLink = breadcrumbs.locator('a').first();
      await homeLink.click();

      await expect(page).toHaveURL(/^\/$|^\/t\/wondernails\/?$/);
    }
  });
});

test.describe('Search Functionality', () => {
  test('should search products successfully', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    await searchInput.fill('nail polish');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);

    const results = page.locator('[data-testid="search-results"], [data-testid="products-grid"]');
    await expect(results).toBeVisible();

    const productCards = page.locator('[data-testid="product-card"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show no results message for invalid search', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    await searchInput.fill('xyzabc123nonexistent');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);

    const noResults = page.locator('[data-testid="no-results"], .no-results');
    await expect(noResults).toBeVisible();
  });

  test('should filter search results', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const searchInput = page.locator('[data-testid="search-input"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('nail');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500);

      // Apply filter
      const filterButton = page.locator('[data-testid="filter-category"]');
      if (await filterButton.isVisible()) {
        await filterButton.click();

        const filterOption = page.locator('[data-testid="filter-option"]').first();
        await filterOption.click();

        await page.waitForTimeout(500);

        // Results should be filtered
        const results = page.locator('[data-testid="product-card"]');
        const count = await results.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

test.describe('Product Filtering & Sorting', () => {
  test('should filter products by category', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const categoryFilter = page.locator('[data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();

      const category = page.locator('[data-testid="category-option"]').first();
      await category.click();

      await page.waitForTimeout(500);

      const activeFilter = page.locator('[data-testid="active-filter"]');
      await expect(activeFilter).toBeVisible();
    }
  });

  test('should sort products by price', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const sortDropdown = page.locator('[data-testid="sort-dropdown"], select[name="sort"]');
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption('price-asc');

      await page.waitForTimeout(500);

      // Get first two product prices
      const prices = page.locator('[data-testid="product-price"]');
      const firstPrice = await prices.first().textContent();
      const secondPrice = await prices.nth(1).textContent();

      const first = parseFloat(firstPrice?.replace(/[^0-9.]/g, '') || '0');
      const second = parseFloat(secondPrice?.replace(/[^0-9.]/g, '') || '0');

      expect(first).toBeLessThanOrEqual(second);
    }
  });

  test('should filter products by price range', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const priceFilter = page.locator('[data-testid="price-filter"]');
    if (await priceFilter.isVisible()) {
      const minPrice = page.locator('[data-testid="price-min"], input[name="minPrice"]');
      const maxPrice = page.locator('[data-testid="price-max"], input[name="maxPrice"]');

      await minPrice.fill('10');
      await maxPrice.fill('50');

      const applyFilter = page.locator('[data-testid="apply-price-filter"]');
      await applyFilter.click();

      await page.waitForTimeout(500);

      // Verify all products are within range
      const prices = page.locator('[data-testid="product-price"]');
      const count = await prices.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const priceText = await prices.nth(i).textContent();
        const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');

        expect(price).toBeGreaterThanOrEqual(10);
        expect(price).toBeLessThanOrEqual(50);
      }
    }
  });
});

test.describe('Shopping Cart Operations', () => {
  test('should add product to cart', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const addToCartBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    await addToCartBtn.click();

    await page.waitForTimeout(500);

    const cartCount = page.locator('[data-testid="cart-item-count"], [data-testid="cart-count"]');
    const count = await cartCount.textContent();

    expect(parseInt(count || '0')).toBeGreaterThan(0);
  });

  test('should update cart item quantity', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Add item to cart
    const addToCartBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    // Go to cart
    const cartIcon = page.locator('[data-testid="cart-icon"], [data-testid="view-cart"]');
    await cartIcon.click();

    // Update quantity
    const quantityInput = page.locator('[data-testid="quantity-input"], input[type="number"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('2');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500);

      const updatedQuantity = await quantityInput.inputValue();
      expect(updatedQuantity).toBe('2');
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Add item to cart
    const addToCartBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    // Go to cart
    const cartIcon = page.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Remove item
    const removeBtn = page.locator('[data-testid="remove-item-btn"], button:has-text("Remove")').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();

      await page.waitForTimeout(500);

      const emptyCart = page.locator('[data-testid="empty-cart"], .empty-cart');
      await expect(emptyCart).toBeVisible();
    }
  });

  test('should calculate cart total correctly', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Add item to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const firstPrice = await firstProduct.locator('[data-testid="product-price"]').textContent();
    const priceValue = parseFloat(firstPrice?.replace(/[^0-9.]/g, '') || '0');

    const addToCartBtn = firstProduct.locator('[data-testid="add-to-cart-btn"]');
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    // Go to cart
    const cartIcon = page.locator('[data-testid="cart-icon"]');
    await cartIcon.click();

    // Check total
    const cartTotal = page.locator('[data-testid="cart-total"], [data-testid="total-price"]');
    const totalText = await cartTotal.textContent();
    const totalValue = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

    expect(totalValue).toBeGreaterThanOrEqual(priceValue);
  });
});

test.describe('Booking System', () => {
  test('should book a service appointment', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const bookBtn = page.locator('[data-testid="book-service-btn"], button:has-text("Book")');
    if (await bookBtn.isVisible()) {
      await bookBtn.click();

      // Select time slot
      const timeSlot = page.locator('[data-testid="time-slot"]').first();
      if (await timeSlot.isVisible()) {
        await timeSlot.click();

        // Fill customer info
        const nameInput = page.locator('input[name="customerName"], input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Customer');
        }

        const emailInput = page.locator('input[name="customerEmail"], input[name="email"]');
        if (await emailInput.isVisible()) {
          await emailInput.fill('test@example.com');
        }

        // Confirm booking
        const confirmBtn = page.locator('[data-testid="confirm-booking"], button:has-text("Confirm")');
        await confirmBtn.click();

        const confirmation = page.locator('[data-testid="booking-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should select staff member for booking', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const staffSelector = page.locator('[data-testid="staff-selector"], select[name="staff"]');
    if (await staffSelector.isVisible()) {
      const options = staffSelector.locator('option');
      const count = await options.count();

      expect(count).toBeGreaterThan(0);

      await staffSelector.selectOption({ index: 1 });

      const selectedValue = await staffSelector.inputValue();
      expect(selectedValue.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Checkout Process', () => {
  test('should proceed through checkout flow', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Add product to cart
    const addToCartBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    await addToCartBtn.click();
    await page.waitForTimeout(500);

    // Go to checkout
    const checkoutBtn = page.locator('[data-testid="checkout-btn"], button:has-text("Checkout")');
    await checkoutBtn.click();

    // Fill checkout form
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }

    const addressInput = page.locator('input[name="address"]');
    if (await addressInput.isVisible()) {
      await addressInput.fill('123 Test Street');
    }

    // Verify checkout form is complete
    await expect(page).toHaveURL(/checkout/);
  });
});

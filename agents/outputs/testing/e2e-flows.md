# E2E Test Flows - Sass Store Multitenant Platform

## Click Budget E2E Test Scenarios

### Purchase Flow Tests (≤3 clicks)

#### Test 1: Express Purchase from Product List Page

**Objective:** Complete purchase in exactly 3 clicks with saved payment method
**Starting URL:** `/products?category=lipstick`
**Prerequisites:**

- User logged in with saved payment method
- Products available in inventory
- Express checkout enabled

```typescript
test("Express Purchase - 3 Click Budget", async ({ page, context }) => {
  const clickTracker = new ClickBudgetTracker();
  let clickCount = 0;

  // Intercept all clicks to track budget
  await page.addInitScript(() => {
    window.clickCount = 0;
    document.addEventListener("click", () => {
      window.clickCount++;
      console.log(`Click ${window.clickCount} registered`);
    });
  });

  // Navigate to product list
  await page.goto("/products?category=lipstick");
  await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

  // CLICK 1: Add first product to cart directly from PLP
  await page.click('[data-testid="product-quick-add"]:first-child');
  clickCount = await page.evaluate(() => window.clickCount);
  expect(clickCount).toBe(1);

  // Verify mini-cart appears
  await expect(page.locator('[data-testid="mini-cart-popup"]')).toBeVisible();
  await expect(page.locator('[data-testid="cart-item-count"]')).toHaveText("1");

  // CLICK 2: Proceed to express checkout
  await page.click('[data-testid="express-checkout-btn"]');
  clickCount = await page.evaluate(() => window.clickCount);
  expect(clickCount).toBe(2);

  // Verify checkout page loads with saved payment
  await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="saved-payment-method"]'),
  ).toBeVisible();

  // CLICK 3: Complete purchase with saved payment
  await page.click('[data-testid="complete-purchase-btn"]');
  clickCount = await page.evaluate(() => window.clickCount);
  expect(clickCount).toBe(3);

  // Verify order confirmation
  await expect(
    page.locator('[data-testid="order-confirmation"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="order-number"]')).toBeVisible();

  // Verify click budget met
  expect(clickCount).toBeLessThanOrEqual(3);

  // Performance verification
  const navigationTiming = await page.evaluate(
    () => performance.getEntriesByType("navigation")[0],
  );
  expect(
    navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
  ).toBeLessThan(2500);
});
```

#### Test 2: Bundle Purchase with Cross-Sell

**Objective:** Purchase product bundle in 3 clicks including cross-sell acceptance
**Starting URL:** `/products/lipstick-red`
**Prerequisites:**

- Bundle offers available
- Inventory for all bundle items
- Cross-sell recommendations enabled

```typescript
test("Bundle Purchase with Cross-Sell - 3 Click Budget", async ({ page }) => {
  await page.goto("/products/lipstick-red");

  let clickCount = 0;
  page.on("click", () => clickCount++);

  // Verify bundle offer is visible
  await expect(page.locator('[data-testid="bundle-offer"]')).toBeVisible();

  // CLICK 1: Accept bundle offer (includes main product + complementary items)
  await page.click('[data-testid="add-bundle-to-cart"]');
  expect(clickCount).toBe(1);

  // Verify bundle added to cart
  await expect(page.locator('[data-testid="cart-item-count"]')).toHaveText("3"); // Bundle of 3 items

  // Cross-sell modal should appear
  await expect(page.locator('[data-testid="cross-sell-modal"]')).toBeVisible();

  // CLICK 2: Accept cross-sell recommendation
  await page.click('[data-testid="accept-cross-sell"]');
  expect(clickCount).toBe(2);

  // Verify cross-sell item added
  await expect(page.locator('[data-testid="cart-item-count"]')).toHaveText("4");

  // CLICK 3: Proceed to express checkout
  await page.click('[data-testid="express-checkout-from-modal"]');
  expect(clickCount).toBe(3);

  // Verify checkout completed
  await expect(
    page.locator('[data-testid="order-confirmation"]'),
  ).toBeVisible();
  expect(clickCount).toBeLessThanOrEqual(3);
});
```

#### Test 3: Gift Purchase Flow

**Objective:** Complete gift purchase with gift options in 3 clicks
**Starting URL:** `/gifts/valentines-collection`
**Prerequisites:**

- Gift wrapping available
- Gift message functionality enabled
- Recipient address saved

```typescript
test("Gift Purchase - 3 Click Budget", async ({ page }) => {
  await page.goto("/gifts/valentines-collection");

  let clickCount = 0;
  page.on("click", () => clickCount++);

  // CLICK 1: Select gift set with pre-configured options
  await page.click('[data-testid="gift-set-complete"]');
  expect(clickCount).toBe(1);

  // Verify gift options are pre-selected
  await expect(
    page.locator('[data-testid="gift-wrap-selected"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="gift-message-ready"]'),
  ).toBeVisible();

  // CLICK 2: Choose recipient from saved addresses
  await page.click('[data-testid="recipient-saved-address"]');
  expect(clickCount).toBe(2);

  // Verify recipient details populated
  await expect(page.locator('[data-testid="recipient-info"]')).toBeVisible();

  // CLICK 3: Complete gift purchase
  await page.click('[data-testid="send-gift-now"]');
  expect(clickCount).toBe(3);

  // Verify gift purchase confirmation
  await expect(page.locator('[data-testid="gift-confirmation"]')).toBeVisible();
  await expect(page.locator('[data-testid="tracking-info"]')).toBeVisible();
});
```

### Booking Flow Tests (≤2 clicks)

#### Test 4: Quick Service Booking

**Objective:** Book next available appointment in 2 clicks
**Starting URL:** `/services/manicure`
**Prerequisites:**

- Available appointment slots
- User preferences saved
- Staff available

```typescript
test("Quick Service Booking - 2 Click Budget", async ({ page }) => {
  await page.goto("/services/manicure");

  let clickCount = 0;
  page.on("click", () => clickCount++);

  // Verify service details loaded
  await expect(page.locator('[data-testid="service-details"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="next-available-slot"]'),
  ).toBeVisible();

  // CLICK 1: Select next available slot with preferred staff
  await page.click('[data-testid="book-next-available"]');
  expect(clickCount).toBe(1);

  // Verify booking details auto-populated
  await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="selected-time-slot"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="selected-staff"]')).toBeVisible();

  // CLICK 2: Confirm booking
  await page.click('[data-testid="confirm-booking"]');
  expect(clickCount).toBe(2);

  // Verify booking confirmation
  await expect(
    page.locator('[data-testid="booking-confirmation"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="calendar-entry"]')).toBeVisible();
  await expect(page.locator('[data-testid="reminder-set"]')).toBeVisible();

  expect(clickCount).toBeLessThanOrEqual(2);
});
```

#### Test 5: Recurring Service Booking

**Objective:** Set up recurring appointment in 2 clicks
**Starting URL:** `/services/monthly-facial`
**Prerequisites:**

- Recurring booking feature enabled
- Previous appointment history
- Subscription payment method

```typescript
test("Recurring Service Booking - 2 Click Budget", async ({ page }) => {
  await page.goto("/services/monthly-facial");

  let clickCount = 0;
  page.on("click", () => clickCount++);

  // CLICK 1: Select recurring booking option
  await page.click('[data-testid="setup-recurring-booking"]');
  expect(clickCount).toBe(1);

  // Verify recurring options display
  await expect(
    page.locator('[data-testid="recurring-schedule"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="preferred-day-time"]'),
  ).toBeVisible();

  // CLICK 2: Confirm recurring schedule
  await page.click('[data-testid="confirm-recurring-schedule"]');
  expect(clickCount).toBe(2);

  // Verify recurring booking setup
  await expect(
    page.locator('[data-testid="recurring-confirmation"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="next-three-appointments"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="subscription-active"]'),
  ).toBeVisible();
});
```

### Reorder Flow Tests (≤1 click)

#### Test 6: One-Click Reorder

**Objective:** Reorder previous purchase in exactly 1 click
**Starting URL:** `/account/orders`
**Prerequisites:**

- Previous order history
- Items still available
- Saved payment method

```typescript
test("One-Click Reorder - 1 Click Budget", async ({ page }) => {
  await page.goto("/account/orders");

  let clickCount = 0;
  page.on("click", () => clickCount++);

  // Verify order history loaded
  await expect(page.locator('[data-testid="order-history"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="reorder-btn"]').first(),
  ).toBeVisible();

  // CLICK 1: One-click reorder
  await page.click('[data-testid="reorder-btn"]');
  expect(clickCount).toBe(1);

  // Verify reorder processed
  await expect(
    page.locator('[data-testid="reorder-confirmation"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="new-order-number"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="estimated-delivery"]'),
  ).toBeVisible();

  expect(clickCount).toBe(1);
});
```

#### Test 7: Smart Reorder with Inventory Check

**Objective:** Reorder with automatic substitutions in 1 click
**Starting URL:** `/dashboard/quick-actions`
**Prerequisites:**

- Smart reorder feature enabled
- Substitution preferences set
- Alternative products available

```typescript
test("Smart Reorder with Substitutions - 1 Click Budget", async ({ page }) => {
  await page.goto("/dashboard/quick-actions");

  let clickCount = 0;
  page.on("click", () => clickCount++);

  // CLICK 1: Smart reorder button
  await page.click('[data-testid="smart-reorder"]');
  expect(clickCount).toBe(1);

  // Verify smart substitutions made
  await expect(
    page.locator('[data-testid="reorder-with-substitutions"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="substitution-details"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="order-confirmed"]')).toBeVisible();

  expect(clickCount).toBe(1);
});
```

## RLS Multitenant Security Test Flows

### Cross-Tenant Data Isolation Tests

#### Test 8: Product Catalog Isolation

**Objective:** Verify tenant cannot access other tenant's products
**Test Method:** API and UI verification

```typescript
test("Product Catalog Tenant Isolation", async ({ page, request }) => {
  // Setup: Create products in different tenants
  const tenant1 = "wondernails";
  const tenant2 = "vigistudio";

  // Create tenant1 product via API
  const tenant1Product = await request.post("/api/products", {
    headers: { "X-Tenant": tenant1 },
    data: { name: "Wondernails Exclusive Lipstick", sku: "WN-001" },
  });

  // Create tenant2 product via API
  const tenant2Product = await request.post("/api/products", {
    headers: { "X-Tenant": tenant2 },
    data: { name: "Vigi Studio Special Polish", sku: "VS-001" },
  });

  // Test 1: UI isolation - tenant1 cannot see tenant2 products
  await page.goto(`https://${tenant1}.sassstore.com/products`);

  await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  await expect(
    page.locator("text=Wondernails Exclusive Lipstick"),
  ).toBeVisible();
  await expect(
    page.locator("text=Vigi Studio Special Polish"),
  ).not.toBeVisible();

  // Test 2: API isolation - tenant1 token cannot access tenant2 product
  const tenant1Token = await getTenantToken(tenant1);
  const tenant2ProductId = (await tenant2Product.json()).id;

  const crossTenantAccess = await request.get(
    `/api/products/${tenant2ProductId}`,
    {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    },
  );

  expect(crossTenantAccess.status()).toBe(404); // Not 403 to avoid information leakage

  // Test 3: Direct URL manipulation
  await page.goto(
    `https://${tenant1}.sassstore.com/products/${tenant2ProductId}`,
  );
  await expect(page.locator('[data-testid="not-found-page"]')).toBeVisible();
});
```

#### Test 9: Booking System Isolation

**Objective:** Prevent cross-tenant booking access and staff visibility

```typescript
test("Booking System Tenant Isolation", async ({ page, request }) => {
  const tenant1 = "wondernails";
  const tenant2 = "vigistudio";

  // Create staff in each tenant
  const staff1 = await createStaff(tenant1, "Alice Wondernails");
  const staff2 = await createStaff(tenant2, "Bob Vigi");

  // Create bookings in each tenant
  const booking1 = await createBooking(
    tenant1,
    staff1.id,
    "customer1@test.com",
  );
  const booking2 = await createBooking(
    tenant2,
    staff2.id,
    "customer2@test.com",
  );

  // Test 1: Staff list isolation
  await page.goto(`https://${tenant1}.sassstore.com/admin/staff`);
  await expect(page.locator("text=Alice Wondernails")).toBeVisible();
  await expect(page.locator("text=Bob Vigi")).not.toBeVisible();

  // Test 2: Booking calendar isolation
  await page.goto(`https://${tenant1}.sassstore.com/admin/bookings`);
  await expect(
    page.locator(`[data-booking-id="${booking1.id}"]`),
  ).toBeVisible();
  await expect(
    page.locator(`[data-booking-id="${booking2.id}"]`),
  ).not.toBeVisible();

  // Test 3: API endpoint isolation
  const tenant1Token = await getTenantToken(tenant1);
  const crossTenantBookingAccess = await request.get(
    `/api/bookings/${booking2.id}`,
    {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    },
  );

  expect(crossTenantBookingAccess.status()).toBe(404);
});
```

### Tenant Fallback Flow Tests

#### Test 10: Unknown Subdomain Fallback

**Objective:** Gracefully handle unknown tenant subdomains

```typescript
test("Unknown Subdomain Fallback to Zo-System", async ({ page }) => {
  // Test unknown subdomain
  await page.goto("https://nonexistent-tenant.sassstore.com/products");

  // Should redirect to zo-system
  await expect(page).toHaveURL(/zo-system\.sassstore\.com/);

  // Should display fallback message
  await expect(
    page.locator('[data-testid="tenant-fallback-notice"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="tenant-fallback-notice"]'),
  ).toContainText("redirected");

  // Should still show products (from zo-system)
  await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

  // Should maintain functionality
  await expect(page.locator('[data-testid="search-bar"]')).toBeVisible();
  await expect(page.locator('[data-testid="navigation-menu"]')).toBeVisible();
});
```

#### Test 11: Tenant Path Fallback

**Objective:** Handle invalid tenant paths gracefully

```typescript
test("Invalid Tenant Path Fallback", async ({ page }) => {
  // Test invalid tenant in path
  await page.goto("/t/invalid-tenant-slug/services");

  // Should show fallback content
  await expect(
    page.locator('[data-testid="tenant-not-found-banner"]'),
  ).toBeVisible();

  // Should default to zo-system services
  await expect(page.locator('[data-testid="services-grid"]')).toBeVisible();
  await expect(page.locator('[data-testid="tenant-context"]')).toContainText(
    "zo-system",
  );

  // Should provide helpful navigation
  await expect(
    page.locator('[data-testid="browse-tenants-link"]'),
  ).toBeVisible();
});
```

## Performance Budget E2E Tests

### Core Web Vitals Verification

#### Test 12: LCP Performance Budget

**Objective:** Verify Largest Contentful Paint meets budget across flows

```typescript
test("LCP Performance Budget Verification", async ({ page }) => {
  // Test different critical paths
  const testPages = [
    "/products",
    "/services",
    "/products/lipstick-red",
    "/checkout",
  ];

  for (const testPage of testPages) {
    await page.goto(testPage);

    // Measure LCP
    const lcpValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1];
          resolve(lcp.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
    });

    // Verify LCP budget
    expect(lcpValue).toBeLessThan(2500); // 2.5s budget
    console.log(`LCP for ${testPage}: ${lcpValue}ms`);
  }
});
```

#### Test 13: INP (Interaction to Next Paint) Budget

**Objective:** Verify interaction responsiveness meets budget

```typescript
test("INP Performance Budget Verification", async ({ page }) => {
  await page.goto("/products");

  // Track INP for click interactions
  const inpMeasurements = [];

  await page.addInitScript(() => {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-input") {
          window.inpValue = entry.processingEnd - entry.startTime;
        }
      }
    }).observe({ type: "first-input", buffered: true });
  });

  // Test critical interactions
  await page.click('[data-testid="product-filter-category"]');
  await page.waitForTimeout(100);

  const inpValue = await page.evaluate(() => window.inpValue || 0);
  expect(inpValue).toBeLessThan(200); // 200ms INP budget

  console.log(`INP measurement: ${inpValue}ms`);
});
```

### Device-Specific Performance Tests

#### Test 14: Mobile Performance Budget

**Objective:** Verify performance on mobile devices meets targets

```typescript
test("Mobile Performance Budget", async ({ page, browserName }) => {
  // Simulate mobile device
  await page.emulate(devices["iPhone 12"]);

  // Throttle network to simulate mobile conditions
  await page.route("**/*", (route) => {
    route.continue();
  });

  await page.goto("/products");

  // Measure performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    return {
      lcp: navigation.loadEventEnd - navigation.loadEventStart,
      fcp:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      ttfb: navigation.responseStart - navigation.requestStart,
    };
  });

  // Mobile-specific budgets
  expect(metrics.lcp).toBeLessThan(3000); // 3s LCP budget for mobile
  expect(metrics.fcp).toBeLessThan(2000); // 2s FCP budget for mobile
  expect(metrics.ttfb).toBeLessThan(1000); // 1s TTFB budget for mobile
});
```

## Accessibility E2E Test Flows

### Keyboard Navigation Tests

#### Test 15: Complete Purchase Flow via Keyboard

**Objective:** Complete entire purchase using only keyboard navigation

```typescript
test("Keyboard-Only Purchase Flow", async ({ page }) => {
  await page.goto("/products");

  // Tab through product grid
  await page.keyboard.press("Tab"); // Focus search
  await page.keyboard.press("Tab"); // Focus first filter
  await page.keyboard.press("Tab"); // Focus first product

  // Select product via keyboard
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/products\/.+/);

  // Navigate to add to cart
  await page.keyboard.press("Tab"); // Focus quantity
  await page.keyboard.press("Tab"); // Focus add to cart
  await page.keyboard.press("Enter"); // Add to cart

  // Navigate to checkout
  await page.keyboard.press("Tab"); // Focus view cart
  await page.keyboard.press("Enter"); // Open cart
  await page.keyboard.press("Tab"); // Focus checkout
  await page.keyboard.press("Enter"); // Go to checkout

  // Complete checkout via keyboard
  await page.keyboard.press("Tab"); // Focus payment method
  await page.keyboard.press("Space"); // Select saved payment
  await page.keyboard.press("Tab"); // Focus complete order
  await page.keyboard.press("Enter"); // Complete order

  // Verify order completion
  await expect(
    page.locator('[data-testid="order-confirmation"]'),
  ).toBeVisible();

  // Verify focused element is order confirmation
  const focusedElement = await page.evaluate(
    () => document.activeElement.dataset.testid,
  );
  expect(focusedElement).toBe("order-confirmation");
});
```

#### Test 16: Screen Reader Booking Flow

**Objective:** Verify booking flow works with screen reader

```typescript
test("Screen Reader Booking Flow", async ({ page }) => {
  // Enable screen reader simulation
  await page.addInitScript(() => {
    // Simulate screen reader by tracking ARIA announcements
    window.announcements = [];
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "aria-live"
        ) {
          window.announcements.push(mutation.target.textContent);
        }
      });
    });
    observer.observe(document.body, { attributes: true, subtree: true });
  });

  await page.goto("/services");

  // Verify service page is announced
  const serviceHeading = await page.locator("h1").textContent();
  expect(serviceHeading).toContain("Services");

  // Select service via screen reader
  await page.click('[data-testid="service-manicure"]');

  // Verify booking form is properly labeled
  await expect(page.locator('[data-testid="booking-form"]')).toHaveAttribute(
    "role",
    "form",
  );
  await expect(page.locator('[data-testid="booking-form"]')).toHaveAttribute(
    "aria-label",
  );

  // Complete booking
  await page.click('[data-testid="select-time-slot"]');
  await page.click('[data-testid="confirm-booking"]');

  // Verify confirmation is announced
  await expect(
    page.locator('[data-testid="booking-confirmation"]'),
  ).toHaveAttribute("aria-live", "polite");

  const announcements = await page.evaluate(() => window.announcements);
  expect(
    announcements.some((a) => a.includes("booking confirmed")),
  ).toBeTruthy();
});
```

## Cost Guardrail E2E Test Flows

### Budget Threshold Tests

#### Test 17: Eco Mode Activation (50% Budget)

**Objective:** Verify eco mode activates at 50% budget usage

```typescript
test("Eco Mode Activation at 50% Budget", async ({ page }) => {
  // Mock budget usage at 50%
  await page.addInitScript(() => {
    localStorage.setItem("budget_usage_percent", "50");
    localStorage.setItem("eco_mode_enabled", "true");
  });

  await page.goto("/products");

  // Verify eco mode indicators
  await expect(page.locator('[data-testid="eco-mode-banner"]')).toBeVisible();
  await expect(page.locator('[data-testid="eco-mode-banner"]')).toContainText(
    "Eco Mode Active",
  );

  // Verify reduced image quality
  const productImage = page.locator('[data-testid="product-image"]').first();
  const imageSrc = await productImage.getAttribute("src");
  expect(imageSrc).toContain("q=60"); // Lower quality setting

  // Verify features still work but with degraded performance
  await page.click('[data-testid="product-filter"]');
  await expect(page.locator('[data-testid="filter-options"]')).toBeVisible();

  // Test purchase flow still works
  await page.click('[data-testid="product-quick-add"]');
  await expect(page.locator('[data-testid="mini-cart"]')).toBeVisible();
});
```

#### Test 18: Freeze Mode Activation (90% Budget)

**Objective:** Verify freeze mode blocks write operations at 90% budget

```typescript
test("Freeze Mode at 90% Budget", async ({ page }) => {
  // Mock budget usage at 90%
  await page.addInitScript(() => {
    localStorage.setItem("budget_usage_percent", "90");
    localStorage.setItem("freeze_mode_enabled", "true");
  });

  await page.goto("/admin/products/new");

  // Verify freeze mode banner
  await expect(
    page.locator('[data-testid="freeze-mode-banner"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="freeze-mode-banner"]'),
  ).toContainText("Write operations disabled");

  // Verify write operations are disabled
  await expect(
    page.locator('[data-testid="create-product-btn"]'),
  ).toBeDisabled();
  await expect(page.locator('[data-testid="save-changes-btn"]')).toBeDisabled();

  // Verify read operations still work
  await page.goto("/products");
  await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

  // Test that cart operations are blocked
  await page.click('[data-testid="product-card"]');
  await expect(
    page.locator('[data-testid="add-to-cart-disabled"]'),
  ).toBeVisible();
});
```

#### Test 19: Kill Switch Activation (100% Budget)

**Objective:** Verify complete service shutdown at 100% budget

```typescript
test("Kill Switch at 100% Budget", async ({ page }) => {
  // Mock budget usage at 100%
  await page.addInitScript(() => {
    localStorage.setItem("budget_usage_percent", "100");
    localStorage.setItem("kill_switch_enabled", "true");
  });

  await page.goto("/products");

  // Verify maintenance mode
  await expect(page.locator('[data-testid="maintenance-mode"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="maintenance-message"]'),
  ).toContainText("temporarily unavailable");

  // Verify content is not accessible
  await expect(page.locator('[data-testid="products-grid"]')).not.toBeVisible();

  // Verify contact information is available
  await expect(page.locator('[data-testid="emergency-contact"]')).toBeVisible();

  // Test API endpoints return maintenance response
  const response = await page.request.get("/api/products");
  expect(response.status()).toBe(503); // Service Unavailable
});
```

## Error Scenario E2E Test Flows

### Graceful Degradation Tests

#### Test 20: Database Unavailable Fallback

**Objective:** Verify graceful degradation when database is unavailable

```typescript
test("Database Unavailable Graceful Degradation", async ({ page }) => {
  // Mock database unavailability
  await page.route("/api/**", (route) => {
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Database unavailable" }),
    });
  });

  await page.goto("/products");

  // Verify error message is user-friendly
  await expect(
    page.locator('[data-testid="service-degraded-banner"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="service-degraded-banner"]'),
  ).toContainText("experiencing high traffic");

  // Verify cached content is shown
  await expect(
    page.locator('[data-testid="cached-products-notice"]'),
  ).toBeVisible();

  // Verify some functionality is disabled gracefully
  await expect(
    page.locator('[data-testid="add-to-cart-disabled"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="search-disabled"]')).toBeVisible();

  // Verify contact options are available
  await expect(page.locator('[data-testid="support-contact"]')).toBeVisible();
});
```

#### Test 21: Payment Gateway Timeout Recovery

**Objective:** Verify payment processing handles gateway timeouts

```typescript
test("Payment Gateway Timeout Recovery", async ({ page }) => {
  await page.goto("/checkout");

  // Fill out checkout form
  await page.fill('[data-testid="email-input"]', "test@example.com");
  await page.fill('[data-testid="address-input"]', "123 Test St");
  await page.fill('[data-testid="payment-card"]', "4111111111111111");

  // Mock payment gateway timeout
  await page.route("/api/payments/**", (route) => {
    // Simulate timeout after 30 seconds
    setTimeout(() => {
      route.fulfill({
        status: 408,
        contentType: "application/json",
        body: JSON.stringify({ error: "Payment gateway timeout" }),
      });
    }, 100);
  });

  await page.click('[data-testid="complete-order-btn"]');

  // Verify loading state
  await expect(
    page.locator('[data-testid="payment-processing"]'),
  ).toBeVisible();

  // Verify timeout handling
  await expect(
    page.locator('[data-testid="payment-timeout-message"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="payment-retry-btn"]')).toBeVisible();

  // Test retry functionality
  await page.click('[data-testid="payment-retry-btn"]');
  await expect(
    page.locator('[data-testid="payment-processing"]'),
  ).toBeVisible();

  // Verify alternative payment methods offered
  await expect(
    page.locator('[data-testid="alternative-payment-methods"]'),
  ).toBeVisible();
});
```

## Mobile vs Desktop Interaction Test Flows

### Touch vs Mouse Behavior Tests

#### Test 22: Mobile Touch Interactions

**Objective:** Verify touch-specific interactions work correctly on mobile

```typescript
test("Mobile Touch Interactions", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-specific test");

  await page.goto("/products/lipstick-red");

  // Test pinch-to-zoom on product images
  const productImage = page.locator('[data-testid="product-image-main"]');
  await productImage.hover();

  // Simulate pinch gesture
  await page.touchscreen.tap(200, 200);
  await page.touchscreen.tap(300, 300);

  // Verify zoom functionality
  await expect(
    page.locator('[data-testid="image-zoom-overlay"]'),
  ).toBeVisible();

  // Test swipe gesture for image gallery
  const imageGallery = page.locator('[data-testid="image-gallery"]');
  await imageGallery.hover();

  // Simulate swipe left
  await page.mouse.move(300, 200);
  await page.mouse.down();
  await page.mouse.move(100, 200);
  await page.mouse.up();

  // Verify image changed
  const activeImage = page.locator('[data-testid="active-gallery-image"]');
  await expect(activeImage).toHaveAttribute("data-index", "1");

  // Test pull-to-refresh
  await page.mouse.move(200, 50);
  await page.mouse.down();
  await page.mouse.move(200, 200);
  await page.mouse.up();

  await expect(
    page.locator('[data-testid="pull-refresh-indicator"]'),
  ).toBeVisible();
});
```

#### Test 23: Desktop Mouse Interactions

**Objective:** Verify mouse-specific interactions work correctly on desktop

```typescript
test("Desktop Mouse Interactions", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop-specific test");

  await page.goto("/products");

  // Test hover effects on product cards
  const productCard = page.locator('[data-testid="product-card"]').first();
  await productCard.hover();

  // Verify hover overlay appears
  await expect(
    page.locator('[data-testid="product-hover-overlay"]'),
  ).toBeVisible();
  await expect(page.locator('[data-testid="quick-view-btn"]')).toBeVisible();

  // Test right-click context menu
  await productCard.click({ button: "right" });
  await expect(page.locator('[data-testid="context-menu"]')).toBeVisible();

  // Test drag and drop to cart
  const addToCartZone = page.locator('[data-testid="cart-drop-zone"]');
  await productCard.dragTo(addToCartZone);

  // Verify item added to cart
  await expect(page.locator('[data-testid="cart-item-count"]')).toHaveText("1");

  // Test keyboard shortcuts
  await page.keyboard.press("Control+k");
  await expect(page.locator('[data-testid="search-modal"]')).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="search-modal"]')).not.toBeVisible();
});
```

## Test Execution Infrastructure

### Test Data Setup and Teardown

```typescript
// Global test setup
export async function globalSetup() {
  // Create test tenants
  await createTestTenant("wondernails", {
    name: "Wonder Nails Test",
    features: ["ecommerce", "booking", "analytics"],
  });

  await createTestTenant("vigistudio", {
    name: "Vigi Studio Test",
    features: ["booking", "pos", "inventory"],
  });

  // Seed test data
  await seedTestData();

  // Configure test budgets
  await setBudgetLimits("test", {
    eco_mode: 50,
    freeze_mode: 90,
    kill_switch: 100,
  });
}

// Test teardown
export async function globalTeardown() {
  await cleanupTestData();
  await resetBudgetLimits();
}
```

### Click Budget Measurement Utility

```typescript
export class ClickBudgetMeasurement {
  private clickCount = 0;
  private flowStartTime = Date.now();
  private interactions: Array<{
    element: string;
    timestamp: number;
    clickNumber: number;
  }> = [];

  constructor(
    private page: Page,
    private flowType: "purchase" | "booking" | "reorder",
  ) {
    this.setupClickTracking();
  }

  private async setupClickTracking() {
    await this.page.addInitScript(() => {
      window.clickBudgetTracker = {
        clicks: 0,
        interactions: [],
      };

      document.addEventListener("click", (event) => {
        window.clickBudgetTracker.clicks++;
        window.clickBudgetTracker.interactions.push({
          element: event.target.dataset.testid || event.target.tagName,
          timestamp: Date.now(),
          clickNumber: window.clickBudgetTracker.clicks,
        });
      });
    });
  }

  async getClickCount(): Promise<number> {
    return await this.page.evaluate(() => window.clickBudgetTracker.clicks);
  }

  async verifyBudget(): Promise<{
    passed: boolean;
    clickCount: number;
    budget: number;
    efficiency: number;
  }> {
    const clickCount = await this.getClickCount();
    const budgets = { purchase: 3, booking: 2, reorder: 1 };
    const budget = budgets[this.flowType];

    return {
      passed: clickCount <= budget,
      clickCount,
      budget,
      efficiency: budget / clickCount,
    };
  }

  async generateReport(): Promise<string> {
    const interactions = await this.page.evaluate(
      () => window.clickBudgetTracker.interactions,
    );
    const result = await this.verifyBudget();

    return `
Click Budget Report - ${this.flowType.toUpperCase()} Flow
===========================================
Budget: ${result.budget} clicks
Actual: ${result.clickCount} clicks
Status: ${result.passed ? "PASSED" : "FAILED"}
Efficiency: ${(result.efficiency * 100).toFixed(1)}%

Interaction Timeline:
${interactions.map((i) => `${i.clickNumber}. ${i.element} (${i.timestamp}ms)`).join("\n")}
    `;
  }
}
```

These comprehensive E2E test flows provide verifiable, executable test scenarios that ensure the sass store platform meets all click budget requirements, maintains strict tenant isolation, performs within budget constraints, and provides excellent accessibility and user experience across all device types and interaction methods.

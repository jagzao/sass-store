# Testing Strategy - Sass Store Multitenant Platform

## Testing Matrix

### Test Types & Coverage Targets

| Test Type         | Scope              | Coverage Target | Purpose                         |
| ----------------- | ------------------ | --------------- | ------------------------------- |
| **Unit**          | Domain/Application | ≥80%            | Business logic, domain rules    |
| **Integration**   | API Endpoints      | ≥80%            | Service interactions, data flow |
| **E2E**           | User Journeys      | Key paths       | Click budgets, user experience  |
| **Contract**      | API Boundaries     | 100%            | API compliance, versioning      |
| **Performance**   | Core Web Vitals    | P75 targets     | Speed, responsiveness           |
| **Accessibility** | WCAG 2.1 AA        | ≥95% score      | Inclusive design                |
| **RLS**           | Data Security      | 100%            | Tenant isolation                |

## Performance Budgets

### Core Web Vitals (P75 Targets)

- **Largest Contentful Paint (LCP)**: <2.5s
- **Interaction to Next Paint (INP)**: <200ms
- **Cumulative Layout Shift (CLS)**: <0.1
- **First Input Delay (FID)**: <100ms
- **Time to First Byte (TTFB)**: <800ms

### Additional Performance Metrics

- **API Response Time**: <500ms (P95)
- **Database Query Time**: <100ms (P95)
- **Image Load Time**: <1s (P90)
- **Bundle Size**: <250KB gzipped (initial)
- **Lighthouse Score**: ≥90 (Performance)

## Click Budget E2E Tests

### Purchase Flow (≤3 clicks)

```typescript
describe("Purchase Flow - 3 Click Budget", () => {
  test("should complete purchase in exactly 3 clicks", async ({ page }) => {
    let clickCount = 0;
    page.on("click", () => clickCount++);

    // Start from Product List Page
    await page.goto("/products");

    // Click 1: Add to cart from PLP
    await page.click('[data-testid="product-add-btn"]');
    expect(clickCount).toBe(1);

    // Click 2: Proceed to checkout from mini-cart
    await page.click('[data-testid="mini-cart-checkout"]');
    expect(clickCount).toBe(2);

    // Click 3: Complete purchase (with saved payment)
    await page.click('[data-testid="complete-purchase"]');
    expect(clickCount).toBe(3);

    // Verify success
    await expect(
      page.locator('[data-testid="order-confirmation"]'),
    ).toBeVisible();
  });
});
```

### Booking Flow (≤2 clicks)

```typescript
describe("Booking Flow - 2 Click Budget", () => {
  test("should complete booking in exactly 2 clicks", async ({ page }) => {
    let clickCount = 0;
    page.on("click", () => clickCount++);

    await page.goto("/services");

    // Click 1: Select service and first available slot
    await page.click('[data-testid="service-book-first-available"]');
    expect(clickCount).toBe(1);

    // Click 2: Confirm booking (with saved customer data)
    await page.click('[data-testid="confirm-booking"]');
    expect(clickCount).toBe(2);

    await expect(
      page.locator('[data-testid="booking-confirmation"]'),
    ).toBeVisible();
  });
});
```

### Reorder Flow (≤1 click)

```typescript
describe("Reorder Flow - 1 Click Budget", () => {
  test("should reorder in exactly 1 click", async ({ page }) => {
    let clickCount = 0;
    page.on("click", () => clickCount++);

    await page.goto("/orders/history");

    // Click 1: One-click reorder
    await page.click('[data-testid="reorder-btn"]');
    expect(clickCount).toBe(1);

    await expect(
      page.locator('[data-testid="reorder-confirmation"]'),
    ).toBeVisible();
  });
});
```

## RLS Multitenant Testing

### Data Isolation Tests

```csharp
[TestFixture]
public class RowLevelSecurityTests
{
    [Test]
    public async Task Products_ShouldOnlyReturnTenantData()
    {
        // Arrange
        var tenant1 = await CreateTenantAsync("wondernails");
        var tenant2 = await CreateTenantAsync("vigistudio");

        var product1 = await CreateProductAsync(tenant1.Id, "lipstick-red");
        var product2 = await CreateProductAsync(tenant2.Id, "nail-polish-blue");

        // Act - Query as tenant1
        var context1 = CreateDbContext(tenant1.Id);
        var products1 = await context1.Products.ToListAsync();

        // Assert - Only tenant1 products returned
        Assert.That(products1.Count, Is.EqualTo(1));
        Assert.That(products1[0].Id, Is.EqualTo(product1.Id));
        Assert.That(products1.Any(p => p.Id == product2.Id), Is.False);
    }

    [Test]
    public async Task Bookings_ShouldPreventCrossTenantAccess()
    {
        // Arrange
        var tenant1 = await CreateTenantAsync("wondernails");
        var tenant2 = await CreateTenantAsync("vigistudio");

        var booking1 = await CreateBookingAsync(tenant1.Id, "customer1");
        var booking2 = await CreateBookingAsync(tenant2.Id, "customer2");

        // Act - Try to access tenant2 booking from tenant1 context
        var context1 = CreateDbContext(tenant1.Id);
        var booking = await context1.Bookings
            .FirstOrDefaultAsync(b => b.Id == booking2.Id);

        // Assert - Should not find booking from other tenant
        Assert.That(booking, Is.Null);
    }
}
```

### Cross-Tenant API Security

```csharp
[TestFixture]
public class TenantSecurityTests
{
    [Test]
    public async Task API_ShouldReject_CrossTenantResourceAccess()
    {
        // Arrange
        var tenant1Token = await GetTenantTokenAsync("wondernails");
        var tenant2Product = await CreateProductAsync("vigistudio", "hidden-product");

        // Act - Try to access tenant2 product with tenant1 token
        var response = await _client.GetAsync($"/api/products/{tenant2Product.Id}",
            headers: new { Authorization = $"Bearer {tenant1Token}" });

        // Assert - Should return 404 (not 403 to avoid information leakage)
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
```

## Fallback & Error Handling Tests

### Tenant Fallback Scenarios

```typescript
describe("Tenant Fallback Tests", () => {
  test("unknown subdomain should fallback to zo-system", async ({ page }) => {
    await page.goto("https://unknown-tenant.sassstore.com");

    // Should redirect to zo-system tenant
    await expect(page).toHaveURL(/zo-system/);
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText(
      "Zo System",
    );
  });

  test("invalid tenant path should fallback gracefully", async ({ page }) => {
    await page.goto("/t/nonexistent-tenant/products");

    // Should show zo-system products with fallback message
    await expect(page.locator('[data-testid="fallback-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();
  });
});
```

### Image Optimization Tests

```typescript
describe("Image Optimization Tests", () => {
  test("should serve AVIF to supported browsers", async ({ page }) => {
    await page.goto("/products/lipstick-red");

    const image = page.locator('[data-testid="product-image"]');
    const src = await image.getAttribute("src");

    expect(src).toMatch(/\.avif$/);
  });

  test("should fallback to WebP for unsupported browsers", async ({
    page,
    browserName,
  }) => {
    // Simulate older browser
    await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
        value: () => "data:image/jpeg;base64,fake",
      });
    });

    await page.goto("/products/lipstick-red");

    const image = page.locator('[data-testid="product-image"]');
    const src = await image.getAttribute("src");

    expect(src).toMatch(/\.webp$/);
  });

  test("should show blurhash placeholder while loading", async ({ page }) => {
    // Throttle network to simulate slow loading
    await page.route("**/*.avif", (route) =>
      route.fulfill({
        status: 200,
        body: "",
        headers: { "content-type": "image/avif" },
      }),
    );

    await page.goto("/products/lipstick-red");

    const placeholder = page.locator('[data-testid="image-placeholder"]');
    await expect(placeholder).toBeVisible();

    // Should have blurhash background
    const style = await placeholder.getAttribute("style");
    expect(style).toContain("background-image");
  });
});
```

## Cost & Quota Testing

### Resource Limit Tests

```typescript
describe("Cost Guardrails Tests", () => {
  test("should activate eco mode at 50% budget", async ({ page }) => {
    // Simulate 50% budget usage
    await page.evaluate(() => {
      window.localStorage.setItem("budget_usage", "50");
    });

    await page.goto("/products");

    // Should see eco mode indicators
    await expect(
      page.locator('[data-testid="eco-mode-indicator"]'),
    ).toBeVisible();

    // Images should be lower quality
    const image = page.locator('[data-testid="product-image"]');
    const src = await image.getAttribute("src");
    expect(src).toContain("q=60"); // Lower quality
  });

  test("should enter freeze mode at 90% budget", async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem("budget_usage", "90");
    });

    await page.goto("/admin/products/new");

    // Should block write operations
    await expect(
      page.locator('[data-testid="freeze-mode-banner"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="create-product-btn"]'),
    ).toBeDisabled();
  });

  test("should activate kill switch at 100% budget", async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem("budget_usage", "100");
    });

    await page.goto("/products");

    // Should show maintenance mode
    await expect(
      page.locator('[data-testid="maintenance-mode"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="products-grid"]'),
    ).not.toBeVisible();
  });
});
```

### Quota Enforcement Tests

```csharp
[TestFixture]
public class QuotaTests
{
    [Test]
    public async Task ImageUpload_ShouldRespectStorageQuota()
    {
        // Arrange
        var tenant = await CreateTenantWithQuotaAsync(maxStorage: 100_000_000); // 100MB
        var largeImage = GenerateImageBytes(150_000_000); // 150MB

        // Act
        var result = await _mediaService.UploadImageAsync(tenant.Id, largeImage);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorCode, Is.EqualTo(ErrorCode.QuotaExceeded));
    }

    [Test]
    public async Task API_ShouldRateLimitPerTenant()
    {
        // Arrange
        var tenant = await CreateTenantAsync("test-tenant");
        var requests = new List<Task<HttpResponseMessage>>();

        // Act - Make 100 requests rapidly
        for (int i = 0; i < 100; i++)
        {
            requests.Add(_client.GetAsync($"/api/products",
                headers: new { "X-Tenant": "test-tenant" }));
        }

        var responses = await Task.WhenAll(requests);

        // Assert - Some should be rate limited
        var rateLimited = responses.Count(r => r.StatusCode == HttpStatusCode.TooManyRequests);
        Assert.That(rateLimited, Is.GreaterThan(0));
    }
}
```

## Accessibility Testing

### Automated A11y Tests

```typescript
describe("Accessibility Tests", () => {
  test("should pass WCAG 2.1 AA compliance", async ({ page }) => {
    await page.goto("/products");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/products");

    // Tab through interactive elements
    await page.keyboard.press("Tab"); // Focus first product
    await expect(
      page.locator('[data-testid="product-card"]:first-child'),
    ).toBeFocused();

    await page.keyboard.press("Enter"); // Select product
    await expect(page).toHaveURL(/\/products\/.+/);

    await page.keyboard.press("Tab"); // Focus add to cart
    await page.keyboard.press("Tab"); // Focus quantity
    await page.keyboard.press("Enter"); // Add to cart

    await expect(page.locator('[data-testid="mini-cart"]')).toBeVisible();
  });

  test("should have proper color contrast", async ({ page }) => {
    await page.goto("/products");

    const results = await new AxeBuilder({ page })
      .withTags(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

## Contract Testing

### API Contract Tests

```typescript
describe("API Contract Tests", () => {
  test("should match OpenAPI specification", async () => {
    const spec = await loadOpenAPISpec("./api/openapi.yaml");
    const validator = new OpenAPIValidator(spec);

    // Test all endpoints
    for (const endpoint of getEndpoints(spec)) {
      const response = await makeRequest(endpoint);
      const isValid = validator.validateResponse(endpoint, response);

      expect(isValid.errors).toEqual([]);
    }
  });

  test("should maintain backward compatibility", async () => {
    const v1Response = await fetch("/api/v1/products/123");
    const v2Response = await fetch("/api/v2/products/123");

    // v1 should still work
    expect(v1Response.status).toBe(200);

    // v2 should be superset of v1
    const v1Data = await v1Response.json();
    const v2Data = await v2Response.json();

    expect(v2Data).toMatchObject(v1Data);
  });
});
```

## Test Data Management

### Seed Data for Testing

```csharp
public class TestDataSeeder
{
    public async Task SeedTestDataAsync()
    {
        var tenants = new[]
        {
            new Tenant { Slug = "test-wondernails", Name = "Wonder Nails Test" },
            new Tenant { Slug = "test-vigistudio", Name = "Vigi Studio Test" },
            new Tenant { Slug = "zo-system", Name = "Zo System Default" }
        };

        foreach (var tenant in tenants)
        {
            await _context.Tenants.AddAsync(tenant);
            await SeedTenantDataAsync(tenant);
        }

        await _context.SaveChangesAsync();
    }

    private async Task SeedTenantDataAsync(Tenant tenant)
    {
        var products = GenerateProducts(tenant.Id, count: 10);
        var services = GenerateServices(tenant.Id, count: 5);
        var staff = GenerateStaff(tenant.Id, count: 3);

        await _context.Products.AddRangeAsync(products);
        await _context.Services.AddRangeAsync(services);
        await _context.Staff.AddRangeAsync(staff);
    }
}
```

## Test Environment Configuration

### Test Database Setup

```yaml
# docker-compose.test.yml
version: "3.8"
services:
  test-db:
    image: postgres:15
    environment:
      - POSTGRES_DB=sassstore_test
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data # In-memory for faster tests

  test-redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    tmpfs:
      - /data
```

### CI/CD Pipeline Tests

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: dotnet test --collect:"XPlat Code Coverage"
      - run: |
          coverage=$(grep -oP 'Line coverage: \K[\d.]+' coverage.xml)
          if (( $(echo "$coverage < 80" | bc -l) )); then
            echo "Coverage $coverage% below 80% threshold"
            exit 1
          fi

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx playwright test
      - name: Check click budgets
        run: |
          grep -r "clickCount" test-results/ | while read line; do
            if [[ $line =~ "clickCount: ([0-9]+)" ]]; then
              count=${BASH_REMATCH[1]}
              if [[ $count -gt 3 ]]; then
                echo "Click budget exceeded: $count clicks"
                exit 1
              fi
            fi
          done

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: lighthouse --chrome-flags="--headless" http://localhost:3000
      - name: Check performance budget
        run: |
          lcp=$(jq '.audits["largest-contentful-paint"].numericValue' lighthouse.json)
          if (( $(echo "$lcp > 2500" | bc -l) )); then
            echo "LCP $lcp ms exceeds 2.5s budget"
            exit 1
          fi
```

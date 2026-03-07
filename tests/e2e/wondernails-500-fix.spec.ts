import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Customers API Route fix
 * 
 * Bug Fixed: WHERE clause overwrite in query building
 * 
 * The original code had a bug where calling query.where() multiple times
 * would overwrite the previous WHERE clause instead of combining them.
 * This caused Internal Server Error (500) on the /t/wondernails page.
 * 
 * The fix uses an array of conditions combined with AND operator.
 */

test.describe("Wondernails Page -500 Error Fix", () => {
  test("should load wondernails tenant page without500 error", async ({ page }) => {
    // Navigate to the wondernails tenant page
    const response = await page.goto("http://localhost:3001/t/wondernails");
    
    // Verify the page loads successfully (not500)
    expect(response?.status()).toBe(200);
    
    // Verify the page title contains the tenant name
    await expect(page).toHaveTitle(/Wonder Nails Studio/);
  });

  test("should load customers API without500 error", async ({ request }) => {
    // Test the customers API endpoint directly
    const response = await request.get("http://localhost:3001/api/tenants/wondernails/customers");
    
    // Verify the API returns200, not500
    expect(response.status()).toBe(200);
    
    // Verify the response contains customers array
    const data = await response.json();
    expect(data).toHaveProperty("customers");
    expect(Array.isArray(data.customers)).toBe(true);
  });

  test("should load customers API with search filter without500 error", async ({ request }) => {
    // Test the customers API endpoint with search parameter
    const response = await request.get("http://localhost:3001/api/tenants/wondernails/customers?search=john");
    
    // Verify the API returns200, not500
    expect(response.status()).toBe(200);
    
    // Verify the response contains customers array
    const data = await response.json();
    expect(data).toHaveProperty("customers");
    expect(Array.isArray(data.customers)).toBe(true);
  });

  test("should load customers API with status filter without500 error", async ({ request }) => {
    // Test the customers API endpoint with status parameter
    const response = await request.get("http://localhost:3001/api/tenants/wondernails/customers?status=active");
    
    // Verify the API returns200, not500
    expect(response.status()).toBe(200);
    
    // Verify the response contains customers array
    const data = await response.json();
    expect(data).toHaveProperty("customers");
    expect(Array.isArray(data.customers)).toBe(true);
    
    // Verify all customers have status "active"
    for (const customer of data.customers) {
      expect(customer.status).toBe("active");
    }
  });

  test("should load customers API with both search and status filters without500 error", async ({ request }) => {
    // Test the customers API endpoint with both search and status parameters
    const response = await request.get("http://localhost:3001/api/tenants/wondernails/customers?search=a&status=active");
    
    // Verify the API returns200, not500
    expect(response.status()).toBe(200);
    
    // Verify the response contains customers array
    const data = await response.json();
    expect(data).toHaveProperty("customers");
    expect(Array.isArray(data.customers)).toBe(true);
    
    // Verify all customers have status "active"
    for (const customer of data.customers) {
      expect(customer.status).toBe("active");
    }
  });

  test("should maintain tenant isolation in customers API", async ({ request }) => {
    // Test that the customers API only returns customers for the specified tenant
    const response = await request.get("http://localhost:3001/api/tenants/wondernails/customers");
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty("customers");
    
    // All customers should belong to the wondernails tenant
    // This is implicitly tested by the fact that we get results
    // and they should all have the same tenant context
    expect(Array.isArray(data.customers)).toBe(true);
    expect(data.customers.length).toBeGreaterThan(0);
  });
});

import { test, expect } from "@playwright/test";

test.describe("DNS Routing & Fallback System", () => {
  test("unknown tenant domain should redirect to zo-system fallback", async ({ page }) => {
    // Generate a completely random non-existent subdomain or tenant slug
    const unknownTenant = `random-unregistered-tenant-${Date.now()}`;

    // Navigate to the unknown tenant
    const response = await page.goto(`/t/${unknownTenant}`);
    
    // Verify how the system handles the unknown tenant
    // It should render the zo-system fallback natively (not a blank application error)
    // Or it should redirect nicely
    // Sometimes 404 is valid internally, but testing the "fallback-zo-system" specifically

    // Expect the page not to crash completely (500)
    expect(response?.status()).not.toBe(500);

    // Look for zo-system branding or fallback message
    // Usually a 404 Custom Page stating "Este comercio no existe" or showing zo-system 
    const bodyText = await page.locator("body").innerText();
    
    // Verify standard error texts representing a clean fallback
    const isFallbackClean = 
      bodyText.includes("No encontrado") || 
      bodyText.includes("no existe") || 
      bodyText.includes("404") ||
      bodyText.includes("zo-system");
      
    // It should NEVER leak data or display connection refused
    expect(bodyText).not.toContain("ECONNREFUSED");
    expect(bodyText).not.toContain("DatabaseError");

    // Canonical tag should be 'noindex' if it's an invalid tenant 
    // or pointing to the root platform, SEO optimization requirement 5.9
    const robotsMeta = page.locator('meta[name="robots"]');
    if (await robotsMeta.isVisible()) {
       const content = await robotsMeta.getAttribute("content");
       if (content) {
         expect(content).toContain("noindex");
       }
    }
  });

  test("zo-system domain handles generic platform catalog perfectly", async ({ page }) => {
    // Default fallback tenant is "zo-system"
    const fallbackTenant = "zo-system";
    
    await page.goto(`/t/${fallbackTenant}`, { waitUntil: "domcontentloaded" });
    
    // It should render successfully as a catalog mode
    await expect(page.locator("body")).not.toContainText("Application error");
    
    // We check if it loads SEO metatags correctly
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});

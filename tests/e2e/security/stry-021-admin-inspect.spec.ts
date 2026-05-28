/**
 * STRY-021 — Inspección detallada del admin panel
 * Verifica que el panel admin está realmente accesible y muestra contenido correcto
 */
import { test, expect } from "@playwright/test";

test.use({
  launchOptions: { slowMo: 500 },
  viewport: { width: 1400, height: 900 },
});

const BASE = "http://localhost:3003";

test("Admin panel — inspección detallada", async ({ page }) => {
  // Ir directo al admin
  await page.goto(`${BASE}/t/wondernails/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const url = page.url();
  console.log(`URL final: ${url}`);

  // Screenshot completo
  await page.screenshot({
    path: "test-results/admin-full-inspect.png",
    fullPage: true,
  });

  // Buscar elementos específicos del admin panel
  const adminElements = await page.evaluate(() => {
    // Buscar todos los links del sidebar/nav de admin
    const allLinks = Array.from(document.querySelectorAll("a")).map((a) => ({
      text: a.textContent?.trim().substring(0, 50) ?? "",
      href: a.getAttribute("href") ?? "",
    }));

    const adminLinks = allLinks.filter(
      (l) =>
        l.href.includes("/admin") ||
        l.href.includes("/finance") ||
        l.href.includes("/inventory") ||
        l.href.includes("/social"),
    );

    // Detectar sidebar
    const sidebar = document.querySelector(
      "aside, [class*='sidebar'], [class*='Sidebar'], nav[class*='admin']",
    );

    // Detectar contenido del dashboard
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((h) => h.textContent?.trim() ?? "")
      .filter((t) => t.length > 0)
      .slice(0, 10);

    return {
      adminLinks: adminLinks.slice(0, 15),
      hasSidebar: !!sidebar,
      sidebarClass: sidebar?.className ?? "none",
      headings,
      bodyText: document.body.textContent?.substring(0, 300) ?? "",
    };
  });

  console.log("\n=== ADMIN PANEL CONTENTS ===");
  console.log("Headings:", adminElements.headings);
  console.log(
    "Admin links:",
    JSON.stringify(adminElements.adminLinks, null, 2),
  );
  console.log("Has sidebar:", adminElements.hasSidebar);
  console.log("Sidebar class:", adminElements.sidebarClass);
  console.log("Body preview:", adminElements.bodyText.substring(0, 200));

  // Navegar por las secciones del admin
  const sections = [
    { path: "/t/wondernails/admin/bookings", label: "Reservas/Bookings" },
    { path: "/t/wondernails/admin/customers", label: "Clientes" },
    { path: "/t/wondernails/finance", label: "Finanzas" },
    { path: "/t/wondernails/inventory", label: "Inventario" },
  ];

  for (const section of sections) {
    await page.goto(`${BASE}${section.path}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);
    const sUrl = page.url();
    const isOk = !sUrl.includes("500") && !sUrl.includes("error");
    console.log(`\n  ${section.label}: ${sUrl} → ${isOk ? "✓ OK" : "✗ ERROR"}`);
    await page.screenshot({
      path: `test-results/admin-${section.label.toLowerCase().replace(/[^a-z]/g, "-")}.png`,
      fullPage: false,
    });
    expect(sUrl).not.toContain("500");
  }
});

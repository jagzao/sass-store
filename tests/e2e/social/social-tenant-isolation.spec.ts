import { test, expect } from "@playwright/test";

test("SC-02: Generar contenido real desde centro-tenistico", async ({
  page,
}) => {
  await page.goto("http://localhost:3003/t/centro-tenistico/social", {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  await page
    .getByRole("button", { name: /^🤖$|Generar/i })
    .first()
    .click();
  await page.waitForTimeout(1500);

  await expect(page.getByText("Generar Contenido con IA")).toBeVisible({
    timeout: 10000,
  });

  // Config: 1 post, rango 7 días
  await page.getByRole("spinbutton", { name: /Posts por semana/i }).fill("1");
  await page.getByRole("spinbutton", { name: /Reels por semana/i }).fill("0");
  await page.getByRole("spinbutton", { name: /Stories por semana/i }).fill("0");

  const weekLater = new Date(Date.now() + 7 * 86400000);
  await page
    .getByRole("textbox", { name: "Hasta" })
    .fill(weekLater.toISOString().split("T")[0]);

  await page
    .getByPlaceholder(/Describe tu negocio/i)
    .fill("Centro deportivo y canchas de tenis.");

  const btn = page
    .getByRole("button", { name: /Generar \d+ publicaciones/i })
    .first();
  await btn.click();

  await expect(page.getByText(/Vista previa/i)).toBeVisible({
    timeout: 180000,
  });

  const postCards = await page.locator(".border.rounded-lg.p-4").count();
  expect(postCards).toBeGreaterThan(0);

  const firstContent = await page
    .locator(".border.rounded-lg.p-4")
    .first()
    .locator("p")
    .last()
    .innerText();
  expect(firstContent.length).toBeGreaterThan(10);

  console.log("centro-tenistico posts:", postCards);
  console.log("Primer post:", firstContent.substring(0, 120));
});

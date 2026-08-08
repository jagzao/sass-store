import { test, expect } from "@playwright/test";

test.describe("Feature: Wonder — asistente IA de WonderNails", () => {
  test("SC-01 — Wonder es la unica presencia flotante en wondernails", async ({
    page,
  }) => {
    await page.goto("/t/wondernails");

    await expect(page.getByTestId("wonder-assistant-trigger")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Abrir feedback" }),
    ).toHaveCount(0);
  });

  test("SC-02 — otros tenants conservan el boton de feedback y no ven a Wonder", async ({
    page,
  }) => {
    await page.goto("/t/manada-juma");

    await expect(
      page.getByRole("button", { name: "Abrir feedback" }),
    ).toBeVisible();
    await expect(page.getByTestId("wonder-assistant-trigger")).toHaveCount(0);
  });

  test("SC-03 — click en Wonder abre el chat, no el formulario de feedback", async ({
    page,
  }) => {
    await page.goto("/t/wondernails");

    await page.getByTestId("wonder-assistant-trigger").click();

    await expect(page.getByTestId("wonder-chat-panel")).toBeVisible();
    await expect(page.getByTestId("wonder-chat-messages")).toBeVisible();
    await expect(page.getByText("Enviar feedback")).toHaveCount(0);
  });

  test("SC-04 — enviar un mensaje muestra la respuesta de Wonder", async ({
    page,
  }) => {
    await page.route("**/api/ai-chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { reply: "¡Claro! Tenemos manicure desde $250 MXN 💅" },
        }),
      });
    });

    await page.goto("/t/wondernails");
    await page.getByTestId("wonder-assistant-trigger").click();
    await page
      .getByPlaceholder("Escríbele a Wonder...")
      .fill("¿Tienen manicure?");
    await page.getByLabel("Enviar mensaje").click();

    await expect(page.getByText("¿Tienen manicure?")).toBeVisible();
    await expect(
      page.getByText("¡Claro! Tenemos manicure desde $250 MXN 💅"),
    ).toBeVisible();
  });

  test("SC-05 — fallback amigable si el backend de IA falla", async ({
    page,
  }) => {
    await page.route("**/api/ai-chat", async (route) => {
      await route.fulfill({ status: 500, body: "{}" });
    });

    await page.goto("/t/wondernails");
    await page.getByTestId("wonder-assistant-trigger").click();
    await page.getByPlaceholder("Escríbele a Wonder...").fill("hola");
    await page.getByLabel("Enviar mensaje").click();

    await expect(
      page.getByText("Wonder no puede responder en este momento 🐾"),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Escríbele a Wonder...")).toBeEnabled();
  });

  test("SC-06 — feedback embebido dentro del chat reutiliza POST /api/feedback", async ({
    page,
  }) => {
    await page.route("**/api/feedback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            feedbackId: "test-id",
            status: "sent",
            message: "Gracias por tu feedback",
          },
        }),
      });
    });

    await page.goto("/t/wondernails");
    await page.getByTestId("wonder-assistant-trigger").click();
    await page.getByText("Enviar comentario").click();

    await expect(page.getByText("Enviar feedback")).toBeVisible();
    await page
      .getByPlaceholder("Cuéntanos qué piensas o qué problema encontraste...")
      .fill("Wonder me ayudó mucho a elegir un servicio");
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByText("Gracias por tu feedback")).toBeVisible();
  });

  test("SC-07 — accesibilidad: cerrar el chat tiene aria-label", async ({
    page,
  }) => {
    await page.goto("/t/wondernails");
    await page.getByTestId("wonder-assistant-trigger").click();

    const closeBtn = page.getByRole("button", {
      name: "Cerrar chat de Wonder",
    });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(page.getByTestId("wonder-assistant-trigger")).toBeVisible();
  });
});

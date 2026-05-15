import { test, expect } from "@playwright/test";

test.describe("Auth error tenant redirect", () => {
  test("redirects /auth/error to tenant login preserving error code", async ({
    page,
  }) => {
    const base = (process.env.BASE_URL || "http://127.0.0.1:3002").replace(
      /\/$/,
      "",
    );
    const callbackUrl = encodeURIComponent(`${base}/t/wondernails`);
    await page.goto(
      `/auth/error?error=Configuration&callbackUrl=${callbackUrl}`,
    );

    await page.waitForURL("**/t/wondernails/login?error=Configuration", {
      timeout: 120_000,
    });

    await expect(page).toHaveURL(
      /\/t\/wondernails\/login\?error=Configuration/,
    );
    await expect(page.getByTestId("auth-error").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("redirects using auth_tenant_slug cookie when callbackUrl is missing", async ({
    page,
    context,
  }) => {
    const base = (process.env.BASE_URL || "http://127.0.0.1:3002").replace(
      /\/$/,
      "",
    );
    await context.addCookies([
      {
        name: "auth_tenant_slug",
        value: "wondernails",
        url: base,
      },
    ]);

    await page.goto("/auth/error?error=Configuration");

    await page.waitForURL("**/t/wondernails/login?error=Configuration", {
      timeout: 120_000,
    });

    await expect(page).toHaveURL(
      /\/t\/wondernails\/login\?error=Configuration/,
    );
  });
});

import { test, expect, Page, ConsoleMessage } from "@playwright/test";
import { loginAs, signOut } from "../helpers/test-helpers";
import * as fs from "fs";
import * as path from "path";

const TENANTS = ["wondernails", "centro-tenistico", "zo-system"];

const ROUTES_PUBLIC = [
  { name: "home", path: "" },
  { name: "products", path: "/products" },
  { name: "services", path: "/services" },
  { name: "book", path: "/book" },
  { name: "contact", path: "/contact" },
];

const ROUTES_AUTH = [
  { name: "admin", path: "/admin" },
  { name: "admin-calendar", path: "/admin/calendar" },
  { name: "admin-products", path: "/admin/products" },
  { name: "social", path: "/social" },
  { name: "finance", path: "/finance" },
  { name: "finance-budgets", path: "/finance/budgets" },
  { name: "finance-movements", path: "/finance/movements" },
  { name: "inventory", path: "/inventory" },
  { name: "inventory-supplies", path: "/inventory/supplies" },
  { name: "clientes", path: "/clientes" },
  { name: "pos", path: "/pos" },
  { name: "orders", path: "/orders" },
  { name: "profile", path: "/profile" },
  { name: "favorites", path: "/favorites" },
  { name: "reports", path: "/reports" },
];

interface IssueRecord {
  tenant: string;
  route: string;
  type: "error" | "warning" | "layout" | "ux";
  message: string;
  screenshot?: string;
}

const issues: IssueRecord[] = [];
const SCREENSHOT_DIR = "test-results/mobile-audit";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function captureRoute(
  page: Page,
  tenant: string,
  routeName: string,
  routePath: string,
) {
  const url = `http://localhost:3003/t/${tenant}${routePath}`;
  const consoleMsgs: string[] = [];
  const pageErrors: string[] = [];

  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleMsgs.push(`[console.error] ${msg.text()}`);
    }
  };
  const errorHandler = (err: Error) => {
    pageErrors.push(`[pageerror] ${err.message}`);
  };

  page.on("console", consoleHandler);
  page.on("pageerror", errorHandler);

  try {
    const resp = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page.waitForTimeout(2000);

    const status = resp?.status() ?? 0;
    const screenshotName = `${tenant}-${routeName}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
    ensureDir(SCREENSHOT_DIR);
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });

    // Check for visible error states
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    const hasErrorText =
      bodyText.includes("500") ||
      bodyText.includes("Internal Server Error") ||
      bodyText.includes("Application error") ||
      bodyText.includes("Something went wrong");

    // Check layout issues
    const overflowRight = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      return docWidth > winWidth + 5;
    });

    const hasHorizontalScroll = overflowRight;

    // Check for empty states that shouldn't be empty
    const hasContent = bodyText.trim().length > 50;

    // Record issues
    if (status >= 400) {
      issues.push({
        tenant,
        route: routeName,
        type: "error",
        message: `HTTP ${status} on ${routePath}`,
        screenshot: screenshotName,
      });
    }

    if (pageErrors.length > 0) {
      for (const err of pageErrors.slice(0, 3)) {
        issues.push({
          tenant,
          route: routeName,
          type: "error",
          message: err.substring(0, 200),
        });
      }
    }

    if (consoleMsgs.length > 0) {
      for (const msg of consoleMsgs.slice(0, 3)) {
        issues.push({
          tenant,
          route: routeName,
          type: "warning",
          message: msg.substring(0, 200),
        });
      }
    }

    if (hasErrorText) {
      issues.push({
        tenant,
        route: routeName,
        type: "error",
        message: "Visible error text on page",
        screenshot: screenshotName,
      });
    }

    if (hasHorizontalScroll) {
      issues.push({
        tenant,
        route: routeName,
        type: "layout",
        message: "Horizontal scroll detected (content wider than viewport)",
        screenshot: screenshotName,
      });
    }

    if (!hasContent && status === 200) {
      issues.push({
        tenant,
        route: routeName,
        type: "ux",
        message: "Page appears empty (less than 50 chars of text)",
        screenshot: screenshotName,
      });
    }

    console.log(
      `  ${tenant}/${routeName}: ${status} | content:${hasContent ? "Y" : "N"} | hscroll:${hasHorizontalScroll ? "Y" : "N"} | errors:${pageErrors.length} | console:${consoleMsgs.length}`,
    );
  } catch (e) {
    issues.push({
      tenant,
      route: routeName,
      type: "error",
      message: `Navigation failed: ${e instanceof Error ? e.message.substring(0, 200) : "unknown"}`,
    });
    console.log(`  ${tenant}/${routeName}: FAILED`);
  } finally {
    page.off("console", consoleHandler);
    page.off("pageerror", errorHandler);
  }
}

test.use({
  viewport: { width: 375, height: 812 },
  video: "on",
  screenshot: "on",
});

test.describe.configure({ mode: "serial" });

for (const tenant of TENANTS) {
  test.describe(`Mobile audit — ${tenant}`, () => {
    test(`Public routes — ${tenant}`, async ({ page }) => {
      for (const route of ROUTES_PUBLIC) {
        await captureRoute(page, tenant, route.name, route.path);
      }
    });

    test(`Auth routes — ${tenant}`, async ({ page }) => {
      // Login first
      try {
        await loginAs(page, tenant, "jagzao@gmail.com", "admin");
      } catch {
        console.log(`  Login failed for ${tenant}, skipping auth routes`);
        issues.push({
          tenant,
          route: "login",
          type: "error",
          message: "Login failed",
        });
        return;
      }

      for (const route of ROUTES_AUTH) {
        await captureRoute(page, tenant, route.name, route.path);
      }

      await signOut(page);
    });
  });
}

test.afterAll(() => {
  ensureDir(SCREENSHOT_DIR);
  const reportPath = path.join(SCREENSHOT_DIR, "issues.json");
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));

  // Summary
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const layout = issues.filter((i) => i.type === "layout");
  const ux = issues.filter((i) => i.type === "ux");

  console.log("\n=== MOBILE AUDIT REPORT ===");
  console.log(`Errors:   ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Layout:   ${layout.length}`);
  console.log(`UX:       ${ux.length}`);
  console.log(`Total:    ${issues.length}`);
  console.log(`Report:   ${reportPath}`);
});

import { expect, test } from "@playwright/test";
import { crawlTenantBounded } from "./crawl-helpers";

/**
 * Bounded BFS over same-tenant internal links (plan robusto).
 * Grep: `plan-robusto` | `link-crawl` | `internal-link-smoke`
 * @see docs/TESTING_MASTER_PLAN.md §13
 * @see AGENTS.md — Plan robusto de testing
 */

const DEFAULT_TENANTS = [
  "zo-system",
  "wondernails",
  "nom-nom",
  "centro-tenistico",
] as const;

function tenantsFromEnv(): string[] {
  const raw = process.env.CRAWL_TENANTS?.trim();
  if (!raw) return [...DEFAULT_TENANTS];
  return raw.split(/[,;\s]+/).filter(Boolean);
}

function maxPages(): number {
  const n = Number.parseInt(process.env.CRAWL_MAX_PAGES ?? "40", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 120) : 40;
}

test.describe("@plan-robusto internal link crawl", () => {
  test.describe.configure({ timeout: 180_000 });

  test("meta: baseURL resolves", async ({ baseURL }) => {
    expect(baseURL).toBeTruthy();
  });

  for (const tenantSlug of tenantsFromEnv()) {
    test(`link-crawl storefront — ${tenantSlug}`, async ({ page, baseURL }) => {
      const origin = new URL(baseURL!).origin;
      const seeds =
        process.env.CRAWL_SEED_MODE === "full"
          ? [
              `/t/${tenantSlug}`,
              `/t/${tenantSlug}/login`,
              `/t/${tenantSlug}/book`,
              `/t/${tenantSlug}/services`,
              `/t/${tenantSlug}/products`,
              `/t/${tenantSlug}/contact`,
            ]
          : [`/t/${tenantSlug}`];

      const { visited, failures } = await crawlTenantBounded({
        page,
        origin,
        tenantSlug,
        seedPaths: seeds,
        maxPages: maxPages(),
      });

      expect(
        visited.length,
        `expected at least home for ${tenantSlug}`,
      ).toBeGreaterThan(0);

      if (failures.length > 0) {
        const detail = failures.map((f) => `${f.path}: ${f.reason}`).join("\n");
        expect(
          failures,
          `crawl failures for ${tenantSlug}:\n${detail}`,
        ).toEqual([]);
      }
    });
  }
});

import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";

/** Production tenants always included when DB is available. */
export const DEFAULT_BUILD_TENANT_SLUGS = [
  "wondernails",
  "centro-tenistico",
  "zo-system",
] as const;

/** E2E / smoke tenants that must not be pre-rendered at build time. */
const EPHEMERAL_TENANT_SLUG_PATTERN = /^branded-tenant-|^(e2e|test)-|^-test-/i;

export function isEphemeralTestTenantSlug(slug: string): boolean {
  return EPHEMERAL_TENANT_SLUG_PATTERN.test(slug);
}

function parseBuildTenantSlugsFromEnv(): string[] | null {
  const raw = process.env.BUILD_TENANT_SLUGS?.trim();
  if (!raw) return null;
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isEphemeralTestTenantSlug(s));
  return slugs.length > 0 ? slugs : null;
}

function buildMaxTenants(): number {
  const parsed = Number(process.env.BUILD_TENANT_MAX ?? "25");
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 50) : 25;
}

function mergeWithDefaults(slugs: string[], max: number): string[] {
  const merged = new Set<string>([...DEFAULT_BUILD_TENANT_SLUGS, ...slugs]);
  return [...merged].slice(0, max);
}

/**
 * Tenant slugs for `generateStaticParams` on `/t/[tenant]/*`.
 * Resilient to pooler drops during `next build` and excludes ephemeral E2E tenants.
 */
export async function getTenantStaticParams(): Promise<{ tenant: string }[]> {
  const fromEnv = parseBuildTenantSlugsFromEnv();
  if (fromEnv) {
    return fromEnv.map((tenant) => ({ tenant }));
  }

  const max = buildMaxTenants();

  try {
    const all = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .limit(200);

    const slugs = all
      .map((t) => t.slug)
      .filter(
        (slug): slug is string =>
          typeof slug === "string" &&
          slug.length > 0 &&
          !isEphemeralTestTenantSlug(slug),
      );

    const merged = mergeWithDefaults(slugs, max);
    return merged.map((tenant) => ({ tenant }));
  } catch (error) {
    console.warn(
      "[getTenantStaticParams] DB unavailable at build; using default slugs:",
      error instanceof Error ? error.message : error,
    );
    return DEFAULT_BUILD_TENANT_SLUGS.map((tenant) => ({ tenant }));
  }
}

/**
 * Helpers for bounded internal link crawls (plan robusto / TESTING_MASTER_PLAN §13).
 */

const ASSET_EXT =
  /\.(png|jpe?g|gif|webp|avif|ico|svg|woff2?|ttf|eot|mp4|webm|pdf|zip|gz)(\?|$)/i;

const SKIP_PREFIXES = [
  "/api/",
  "/_next/",
  "/__nextjs",
  "/favicon",
  "/ingest",
  "/monitoring",
];

/** Paths that are not app routes but appear in legacy/marketing links (crawl skips enqueue). */
const DEFAULT_SKIP_PATH_REGEXES: RegExp[] = [
  /\/bookings(\/|$)/,
  /\/projects$/,
  /** No dedicated route yet; some landings still link here — skip until route exists */
  /\/menu$/,
  /\/booking(\/|$)/,
];

const SKIP_PATH_REGEXES: RegExp[] = process.env.CRAWL_SKIP_PATH_REGEX
  ? process.env.CRAWL_SKIP_PATH_REGEX.split("|").map((s) => new RegExp(s, "i"))
  : DEFAULT_SKIP_PATH_REGEXES;

export function normalizeInternalPath(
  href: string,
  origin: string,
  currentUrl: string,
  tenantPathPrefix: string,
): string | null {
  const trimmed = href.trim();
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:")
  ) {
    return null;
  }

  let u: URL;
  try {
    u = new URL(trimmed, currentUrl);
  } catch {
    return null;
  }

  if (u.origin !== origin) return null;

  let path = u.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  if (ASSET_EXT.test(path)) return null;
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return null;
  if (!path.startsWith(tenantPathPrefix)) return null;
  if (SKIP_PATH_REGEXES.some((r) => r.test(path))) return null;

  return path;
}

const LENIENT_FETCH =
  process.env.CRAWL_STRICT_CONSOLE !== "1" &&
  process.env.CRAWL_IGNORE_FAILED_FETCH !== "0";

export const DEFAULT_CONSOLE_ALLOWLIST: RegExp[] = [
  /ResizeObserver loop/i,
  /Failed to load resource.*favicon/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
  /Content Security Policy/i,
  /Failed to load resource: the server responded with a status of 404/i,
  /Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR/i,
  ...(LENIENT_FETCH
    ? [
        /TypeError: Failed to fetch/i,
        /Error fetching tenant:.*Failed to fetch/i,
        /Error loading featured content for carousel.*Failed to fetch/i,
      ]
    : []),
];

export type CrawlFailure = { path: string; reason: string };

function mergeFailures(failures: CrawlFailure[]): CrawlFailure[] {
  const byPath = new Map<string, CrawlFailure>();
  for (const f of failures) {
    const prev = byPath.get(f.path);
    if (!prev) {
      byPath.set(f.path, f);
      continue;
    }
    const prevScore = prev.reason.startsWith("HTTP 5")
      ? 3
      : prev.reason.startsWith("HTTP 404")
        ? 2
        : 1;
    const nextScore = f.reason.startsWith("HTTP 5")
      ? 3
      : f.reason.startsWith("HTTP 404")
        ? 2
        : 1;
    if (nextScore >= prevScore) byPath.set(f.path, f);
  }
  return [...byPath.values()];
}

export async function crawlTenantBounded(args: {
  page: import("@playwright/test").Page;
  origin: string;
  tenantSlug: string;
  seedPaths: string[];
  maxPages: number;
  consoleAllowlist?: RegExp[];
}): Promise<{ visited: string[]; failures: CrawlFailure[] }> {
  const {
    page,
    origin,
    tenantSlug,
    seedPaths,
    maxPages,
    consoleAllowlist = DEFAULT_CONSOLE_ALLOWLIST,
  } = args;

  const prefix = `/t/${tenantSlug}`;
  const queue: string[] = [];
  const enqueued = new Set<string>();
  const visitedList: string[] = [];
  const visited = new Set<string>();
  const failures: CrawlFailure[] = [];

  const enqueue = (path: string) => {
    if (!path.startsWith(prefix)) return;
    if (SKIP_PATH_REGEXES.some((r) => r.test(path))) return;
    if (enqueued.has(path) || visited.has(path)) return;
    enqueued.add(path);
    queue.push(path);
  };

  for (const p of seedPaths) {
    let path = p;
    try {
      path = new URL(p, origin).pathname;
    } catch {
      /* keep raw */
    }
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    enqueue(path);
  }

  while (queue.length > 0 && visitedList.length < maxPages) {
    const path = queue.shift()!;
    if (visited.has(path)) continue;
    visited.add(path);
    visitedList.push(path);

    const consoleErrors: string[] = [];
    const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (consoleAllowlist.some((r) => r.test(text))) return;
      consoleErrors.push(text);
    };
    page.on("console", onConsole);

    let response: import("@playwright/test").Response | null = null;
    try {
      response = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
    } catch (e) {
      failures.push({
        path,
        reason: `navigation: ${e instanceof Error ? e.message : String(e)}`,
      });
      page.off("console", onConsole);
      continue;
    }

    const status = response?.status() ?? 0;
    if (status === 404) {
      failures.push({ path, reason: `HTTP ${status}` });
    } else if (status >= 500) {
      failures.push({ path, reason: `HTTP ${status}` });
    }

    await page.waitForTimeout(1200);
    page.off("console", onConsole);

    if (consoleErrors.length > 0) {
      failures.push({
        path,
        reason: `console: ${consoleErrors.slice(0, 3).join(" | ")}`,
      });
    }

    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    if (
      bodyText.includes("Application error") ||
      bodyText.includes("Unhandled Runtime Error")
    ) {
      failures.push({
        path,
        reason: "error boundary / runtime error copy in body",
      });
    }

    const hrefs = await page
      .$$eval("a[href]", (as) =>
        as.map((a) => a.getAttribute("href")).filter((h): h is string => !!h),
      )
      .catch(() => [] as string[]);

    const current = page.url();
    for (const href of hrefs) {
      const next = normalizeInternalPath(href, origin, current, prefix);
      if (!next) continue;
      if (visitedList.length + queue.length >= maxPages * 3) break;
      enqueue(next);
    }
  }

  return { visited: visitedList, failures: mergeFailures(failures) };
}

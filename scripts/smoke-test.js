#!/usr/bin/env node

/**
 * Basic smoke checks for deployed or local environments.
 *
 * Usage:
 *   npm run test:smoke -- --baseURL=https://example.com
 *   npm run test:smoke -- --baseURL=http://localhost:3001
 */

function parseBaseUrl(args) {
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (current.startsWith('--baseURL=')) {
      return current.slice('--baseURL='.length);
    }

    if (current === '--baseURL' && args[i + 1]) {
      return args[i + 1];
    }
  }

  return process.env.BASE_URL || 'http://localhost:3001';
}

async function checkEndpoint(baseUrl, path) {
  const url = new URL(path, baseUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    return {
      ok: response.ok,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const baseUrl = parseBaseUrl(process.argv.slice(2));
  const requiredChecks = ['/'];
  const optionalChecks = ['/api/health'];

  console.log(`[smoke] Base URL: ${baseUrl}`);
  let failed = 0;

  for (const path of requiredChecks) {
    const result = await checkEndpoint(baseUrl, path);
    if (result.ok) {
      console.log(`[smoke] PASS ${result.url} (${result.status})`);
      continue;
    }

    failed += 1;
    if (result.error) {
      console.error(`[smoke] FAIL ${result.url} (${result.error})`);
    } else {
      console.error(`[smoke] FAIL ${result.url} (status ${result.status})`);
    }
  }

  for (const path of optionalChecks) {
    const result = await checkEndpoint(baseUrl, path);
    if (result.ok) {
      console.log(`[smoke] PASS ${result.url} (${result.status})`);
    } else if (result.error) {
      console.warn(`[smoke] WARN ${result.url} (${result.error})`);
    } else {
      console.warn(`[smoke] WARN ${result.url} (status ${result.status})`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log('[smoke] All checks passed');
}

main().catch((error) => {
  console.error('[smoke] Unexpected error:', error);
  process.exit(1);
});

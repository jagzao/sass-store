#!/usr/bin/env node

/**
 * Playwright subset runner that survives `npm run` on Windows.
 *
 * Prefer:
 *   npm run test:e2e:subset -- smoke
 *   npm run test:e2e:subset -- "STRY-020|release"
 *
 * Avoid passing raw `--grep` through `npm run` (npm may strip it). If you need
 * full Playwright flags, call Playwright directly:
 *   npx playwright test --grep "smoke"
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");

function buildPlaywrightArgs(argv) {
  const out = [];
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (arg === "--grep") {
      const pattern = argv[i + 1];
      if (!pattern) {
        console.error("[e2e-subset] --grep requires a pattern");
        process.exit(1);
      }
      out.push("--grep", pattern);
      i += 2;
      continue;
    }

    if (arg.startsWith("-")) {
      out.push(arg);
      i += 1;
      continue;
    }

    const patternParts = [];
    while (i < argv.length && !argv[i].startsWith("-")) {
      patternParts.push(argv[i]);
      i += 1;
    }

    out.push("--grep", patternParts.join(" "));
  }

  return out;
}

const playwrightArgs = buildPlaywrightArgs(rawArgs);

// npm inyecta --grep/--headed como npm_config_* env vars al hijo del script.
// El webServer de Playwright (turbo/npm run build) las interpreta como flags
// desconocidos y falla. Limpiarlas antes de spawn.
const cleanedEnv = { ...process.env };
for (const key of Object.keys(cleanedEnv)) {
  if (key.startsWith("npm_config_")) {
    delete cleanedEnv[key];
  }
}

const repoRoot = path.resolve(__dirname, "..");
const playwrightCli = path.join(
  repoRoot,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);

if (!fs.existsSync(playwrightCli)) {
  console.error(
    "[e2e-subset] Missing Playwright CLI. Install deps from repo root (npm ci).",
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [playwrightCli, "test", ...playwrightArgs],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: cleanedEnv,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);

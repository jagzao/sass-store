// @ts-nocheck
/**
 * Script de arranque de servidor E2E con detección de build previo.
 * Uso: node scripts/start-e2e-server.js
 *
 * Detecta si apps/web/.next/ existe. Si sí, solo ejecuta `next start`.
 * Si no, ejecuta `npm run build` primero.
 */

const { existsSync } = require("fs");
const { spawn } = require("child_process");
const path = require("path");

// Load .env.local from apps/web/ so Next.js server gets DATABASE_URL, NEXTAUTH_SECRET, etc.
const { config } = require("dotenv");
config({ path: path.resolve(__dirname, "..", "apps", "web", ".env.local") });
config({ path: path.resolve(__dirname, "..", ".env.test") });

// OVERRIDE: El servidor E2E corre en 3002. Los .env locales apuntan a 3003
// (dev server), pero cuando Playwright levanta este proceso, todas las
// URLs internas (NextAuth, auth callbacks, fetchWithCache) deben usar 3002.
// Si no, useSession() del cliente hace fetch a 3003 y queda en loading eterno.
process.env.PORT = "3002";
process.env.NEXTAUTH_URL = "http://localhost:3002";
process.env.AUTH_URL = "http://localhost:3002";
// Always enable E2E seed endpoint when running the test server
process.env.E2E_SEED_ENABLED = "1";

const buildDir = path.resolve(__dirname, "..", "apps", "web", ".next");
const hasBuild = existsSync(buildDir);
const skipBuild = process.env.E2E_SKIP_BUILD === "1";

// Default: always rebuild before `next start` so Playwright never runs against a stale `.next`
// after local code changes (a frequent source of flaky E2E). Opt out with E2E_SKIP_BUILD=1.
const shouldBuild = !skipBuild;

if (!hasBuild) {
  console.log("[E2E Server] Build no detectado. Compilando primero...");
} else if (shouldBuild) {
  console.log(
    "[E2E Server] Recompilando @sass-store/web antes de iniciar (E2E_SKIP_BUILD=1 para saltar).",
  );
} else {
  console.log("[E2E Server] E2E_SKIP_BUILD=1: usando build existente en .next");
}

const command = shouldBuild
  ? `npx turbo run build --filter=@sass-store/web && cd apps/web && npx next start -p 3002`
  : `cd apps/web && npx next start -p 3002`;

const child = spawn(command, { shell: true, stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

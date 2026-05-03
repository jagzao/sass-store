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

const buildDir = path.resolve(__dirname, "..", "apps", "web", ".next");
const hasBuild = existsSync(buildDir);

if (hasBuild) {
  console.log("[E2E Server] Build detectado. Usando servidor pre-compilado.");
} else {
  console.log("[E2E Server] Build no detectado. Compilando primero...");
}

const command = hasBuild
  ? `cd apps/web && npx next start -p 3002`
  : `npm run build --filter=@sass-store/web && cd apps/web && npx next start -p 3002`;

const child = spawn(command, { shell: true, stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

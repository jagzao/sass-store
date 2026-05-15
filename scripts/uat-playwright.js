#!/usr/bin/env node
// @ts-nocheck
/**
 * uat-playwright.js
 * Ejecuta Playwright en modo "humano": headed, lento, screenshot en cada paso.
 * Uso: node scripts/uat-playwright.js [feature-name]
 * Ejemplo: node scripts/uat-playwright.js pos-checkout
 */

const { execSync } = require("child_process");
const fs = require("fs");

const FEATURE = process.argv[2] || "all";
const TEST_DIR = `tests/e2e/${FEATURE}`;
const RESULTS_DIR = `test-results/uat/${FEATURE}`;

if (!fs.existsSync(TEST_DIR)) {
  console.error(`❌ No se encontró directorio de tests: ${TEST_DIR}`);
  console.log(`Buscando tests generales de UAT...`);
}

// Crear directorio de resultados UAT
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const cmd = [
  "npx playwright test",
  fs.existsSync(TEST_DIR) ? TEST_DIR : "tests/e2e/",
  "--headed",
  "--slow-mo=500",
  "--screenshot=on",
  "--reporter=list",
  `--output=${RESULTS_DIR}`,
  `--project=chromium`,
].join(" ");

console.log(`🎭 Modo UAT — Playwright como humano`);
console.log(`Feature: ${FEATURE}`);
console.log(`Comando: ${cmd}\n`);

try {
  execSync(cmd, { stdio: "inherit", cwd: "C:\\Dev\\Zo\\sass-store" });
  console.log(`\n✅ UAT completado. Screenshots en: ${RESULTS_DIR}`);
} catch (error) {
  console.error(`\n❌ UAT falló. Revisar screenshots en: ${RESULTS_DIR}`);
  console.error(`Documentar errores en .agents/history/debug_logs.md`);
  process.exit(1);
}

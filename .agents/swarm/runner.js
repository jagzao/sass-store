#!/usr/bin/env node
/**
 * Swarm Runner — Orquestador mecánico
 * Lee .agents/SWARM_ORCHESTRATOR.md y ejecuta fases secuenciales
 * Uso: node .agents/swarm/runner.js "Implementa checkout con tarjeta"
 */

const { execSync } = require("child_process");
const fs = require("fs");

const FEATURE_NAME = process.argv.slice(2).join(" ") || "unknown-feature";
const TIMESTAMP = new Date().toISOString();

const PHASES = [
  { name: "Planificación", cmd: null, manual: true },
  {
    name: "Build",
    cmd: "npm run agent:build",
    required: true,
    retries: 5,
  },
  {
    name: "Tests Unitarios",
    cmd: "npx vitest run --reporter=basic",
    required: true,
    retries: 3,
  },
  {
    name: "Tests E2E",
    cmd: "npm run agent:e2e",
    required: true,
    retries: 3,
  },
  {
    name: "Pipeline Completo",
    cmd: "npm run validate",
    required: true,
    retries: 2,
  },
];

function runCommand(cmd, retries) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      console.log(`  → Ejecutando (intento ${attempt + 1}/${retries + 1})...`);
      execSync(cmd, { stdio: "inherit", cwd: "C:\\Dev\\Zo\\sass-store" });
      return { success: true };
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        return { success: false, error: error.message };
      }
      console.log(`  ⚠️ Falló. Reintentando...`);
    }
  }
}

function logPhaseResult(phaseName, result, durationMs) {
  const logPath = ".agents/session/active_context.json";
  let context = {};
  try {
    context = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch { /* no previous context */ }

  if (!context.phases) context.phases = [];
  context.phases.push({
    name: phaseName,
    startedAt: new Date(Date.now() - durationMs).toISOString(),
    endedAt: new Date().toISOString(),
    durationMs,
    result: result.success ? "pass" : "fail",
    error: result.error || null,
  });

  fs.writeFileSync(logPath, JSON.stringify(context, null, 2));
}

async function main() {
  console.log(`\n🚀 Swarm Runner iniciado: ${FEATURE_NAME}`);
  console.log(`⏰ ${TIMESTAMP}\n`);

  for (const phase of PHASES) {
    if (phase.manual) {
      console.log(`📋 Fase: ${phase.name} (manual - agente LLM responde)`);
      continue;
    }

    console.log(`\n🔧 Fase: ${phase.name}`);
    const start = Date.now();
    const result = runCommand(phase.cmd, phase.retries || 0);
    const duration = Date.now() - start;

    logPhaseResult(phase.name, result, duration);

    if (result.success) {
      console.log(`  ✅ ${phase.name} completada en ${(duration / 1000).toFixed(1)}s`);
    } else {
      console.log(`  ❌ ${phase.name} falló tras ${phase.retries + 1} intentos`);
      if (phase.required) {
        console.error(`\n🛑 Gate cerrado. Feature NO está lista.`);
        process.exit(1);
      }
    }
  }

  console.log(`\n✅ Swarm Runner completado: ${FEATURE_NAME}`);
  console.log(`📝 Métricas guardadas en .agents/session/active_context.json`);
}

main().catch((error) => {
  console.error("Error crítico:", error.message);
  process.exit(1);
});

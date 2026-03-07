#!/usr/bin/env node
/**
 * Swarm Start CLI
 * Start a new swarm development session
 */

import { swarmManager } from "../swarm-manager";
import { SwarmUI } from "./ui";
import { ArchitectAgent } from "../agents/architect-agent";
import { DeveloperAgent } from "../agents/developer-agent";
import { QAAgent } from "../agents/qa-agent";
import { CodeQualityAgent } from "../agents/code-quality-agent";
import { SecurityAgent } from "../agents/security-agent";
import { TesterAgent } from "../agents/tester-agent";
import { ReviewerAgent } from "../agents/reviewer-agent";
import { DeployerAgent } from "../agents/deployer-agent";

async function main() {
  const featureName = process.argv[2];

  if (!featureName) {
    console.error("❌ Error: Debes proporcionar un nombre de feature");
    console.log('\nUso: npm run swarm:start "Nombre de la feature"');
    console.log('Ejemplo: npm run swarm:start "Carrito de Compras"');
    process.exit(1);
  }

  try {
    console.log(`\n🚀 Iniciando Swarm para: ${featureName}\n`);

    // Create session
    const session = swarmManager.createSession(featureName);
    console.log(`✓ Sesión creada: ${session.id}\n`);

    // Show initial status
    console.log(SwarmUI.renderCompact(session));

    console.log("\n⚡ Ejecutando agentes...\n");

    // Execute agents sequentially
    const tasks = session.tasks;

    // 1. Architect
    const architectTask = tasks.find((t) => t.agent === "ARCHITECT");
    if (architectTask) {
      const agent = new ArchitectAgent(
        "ARCHITECT",
        session.id,
        architectTask.id,
      );
      await agent.run();
    }

    // 2. Developer
    const devTask = tasks.find((t) => t.agent === "DEVELOPER");
    if (devTask) {
      const agent = new DeveloperAgent("DEVELOPER", session.id, devTask.id);
      await agent.run();
    }

    // 3. QA Agent - Create/Update Tests
    const qaTask = tasks.find((t) => t.agent === "QA");
    if (qaTask) {
      const agent = new QAAgent("QA", session.id, qaTask.id);
      await agent.run();
    }

    // 4. Code Quality Agent - Validate Standards
    const qualityTask = tasks.find((t) => t.agent === "CODE_QUALITY");
    if (qualityTask) {
      const agent = new CodeQualityAgent(
        "CODE_QUALITY",
        session.id,
        qualityTask.id,
      );
      await agent.run();
    }

    // 5. Security Agent - Security Scan
    const securityTask = tasks.find((t) => t.agent === "SECURITY");
    if (securityTask) {
      const agent = new SecurityAgent("SECURITY", session.id, securityTask.id);
      await agent.run();
    }

    // 6. Tester - Final Validation
    const testerTask = tasks.find((t) => t.agent === "TESTER");
    if (testerTask) {
      const agent = new TesterAgent("TESTER", session.id, testerTask.id);
      await agent.run();
    }

    // 7. Reviewer - Automated Review Gates
    const reviewerTask = tasks.find((t) => t.agent === "REVIEWER");
    if (reviewerTask) {
      const agent = new ReviewerAgent("REVIEWER", session.id, reviewerTask.id);
      await agent.run();
    }

    // 8. Deployer - Build and Smoke Validation
    const deployerTask = tasks.find((t) => t.agent === "DEPLOYER");
    if (deployerTask) {
      const agent = new DeployerAgent("DEPLOYER", session.id, deployerTask.id);
      await agent.run();
    }

    // Show final status
    const finalSession = swarmManager.loadSession(session.id);
    if (finalSession) {
      console.log("\n");
      console.log(SwarmUI.renderSession(finalSession));
    }

    console.log("✅ Swarm completado exitosamente!\n");
  } catch (error) {
    console.error(
      SwarmUI.renderError(
        error instanceof Error ? error.message : String(error),
      ),
    );
    process.exit(1);
  }
}

main();

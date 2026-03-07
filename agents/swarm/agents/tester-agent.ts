/**
 * Tester Agent
 * Runs tests and validates quality
 */

import { spawn } from "child_process";
import { BaseAgent } from "./base-agent";

export class TesterAgent extends BaseAgent {
  async execute(): Promise<void> {
    this.log("🧪 Iniciando suite de tests...");
    this.updateProgress(10);

    await this.runUnitTests();
    this.updateProgress(40);

    await this.runIntegrationTests();
    this.updateProgress(70);

    await this.runE2ETests();
    this.updateProgress(90);

    this.log("✓ Validación de tests completada");
    this.complete(["test-report.json", "coverage-report.html"]);
  }

  private async runUnitTests(): Promise<void> {
    this.log("🔬 Ejecutando tests unitarios (real)...");
    await this.runCommand("npm", ["run", "test:unit"]);
  }

  private async runIntegrationTests(): Promise<void> {
    this.log("🔗 Ejecutando tests de integración (real)...");
    await this.runCommand("npm", ["run", "test:integration"]);
  }

  private async runE2ETests(): Promise<void> {
    if (process.env.SWARM_SKIP_E2E === "1") {
      this.log("⏭️ Saltando E2E por SWARM_SKIP_E2E=1");
      return;
    }

    this.log("🎭 Ejecutando tests E2E smoke (real)...");
    await this.runCommand("npm", [
      "run",
      "test:e2e",
      "--",
      "--grep",
      "@smoke",
      "--pass-with-no-tests",
    ]);
  }

  private runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        shell: true,
        env: process.env,
      });

      child.stdout.on("data", (chunk: Buffer | string) => {
        const output = chunk.toString().trim();
        if (output) {
          this.log(output);
        }
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        const output = chunk.toString().trim();
        if (output) {
          this.log(output);
        }
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `Command failed (${command} ${args.join(" ")}), exit code: ${String(code)}`,
          ),
        );
      });
    });
  }
}

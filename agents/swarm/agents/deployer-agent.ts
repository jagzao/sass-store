/**
 * Deployer Agent
 * Validates build output and optional smoke checks
 */

import { spawn } from "child_process";
import { BaseAgent } from "./base-agent";

export class DeployerAgent extends BaseAgent {
  async execute(): Promise<void> {
    this.log("🚀 Iniciando validación pre-deploy...");
    this.updateProgress(20);

    await this.runCommand("npm", ["run", "build"]);
    this.updateProgress(70);

    const smokeBaseUrl = process.env.SWARM_SMOKE_BASE_URL;
    if (smokeBaseUrl) {
      this.log(`🌐 Ejecutando smoke tests contra ${smokeBaseUrl}`);
      await this.runCommand("npm", [
        "run",
        "test:smoke",
        "--",
        `--baseURL=${smokeBaseUrl}`,
      ]);
    } else {
      this.log("ℹ️ SWARM_SMOKE_BASE_URL no definido, smoke remoto omitido");
    }

    this.updateProgress(95);
    this.log("✓ Validación pre-deploy completada");
    this.complete(["deploy-preflight-report.md"]);
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

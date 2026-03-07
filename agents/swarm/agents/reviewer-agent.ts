/**
 * Reviewer Agent
 * Runs automated review gates before deploy preparation
 */

import { spawn } from "child_process";
import { BaseAgent } from "./base-agent";

export class ReviewerAgent extends BaseAgent {
  async execute(): Promise<void> {
    this.log("👀 Iniciando revisión automatizada...");
    this.updateProgress(15);

    await this.runCommand("npm", ["run", "lint"]);
    this.updateProgress(55);

    await this.runCommand("npm", ["run", "typecheck"]);
    this.updateProgress(90);

    this.log("✓ Revisión automatizada completada");
    this.complete(["review-report.md"]);
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

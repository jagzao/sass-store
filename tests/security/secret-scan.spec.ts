import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";

// Patrón de conexión Supabase con password hardcodeada (project.jedryjmljffuvegggjmw:PASSWORD@).
// Detecta CUALQUIER password commiteado para ese proyecto, sin hardcodear el valor literal
// (que además será rotado por el dueño).
const LEAKED_CONN_PATTERN = /postgres\.jedryjmljffuvegggjmw:[^"'\s)]+@/;

// SC-12 = "sin credenciales COMMITEADAS" -> solo escanea archivos trackeados por git.
function trackedFiles(): string[] {
  try {
    const out = execSync("git ls-files", { encoding: "utf8", maxBuffer: 1e8 });
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

describe("Feature: sin credenciales commiteadas (STRY-026 SC-12)", () => {
  it("SC-12 — SUPABASE_CREDENTIALS_GUIDE.md fue eliminado", () => {
    const guide = resolve(__dirname, "../../SUPABASE_CREDENTIALS_GUIDE.md");
    expect(existsSync(guide)).toBe(false);
  });

  it("SC-12 — la password filtrada no aparece en archivos trackeados", () => {
    const root = resolve(__dirname, "../..");
    const files = trackedFiles().filter((f) =>
      /\.(ts|tsx|js|mjs|json|md|sql)$/.test(f),
    );

    const offenders: string[] = [];
    for (const rel of files) {
      const full = join(root, rel);
      if (!existsSync(full)) continue;
      const src = readFileSync(full, "utf8");
      if (LEAKED_CONN_PATTERN.test(src)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });
});

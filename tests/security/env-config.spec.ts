import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

describe("Feature: sin fallback silencioso a localhost (STRY-026 SC-05)", () => {
  const connectionSrc = readFileSync(
    resolve(__dirname, "../../packages/database/connection.ts"),
    "utf8",
  );

  it("SC-05 — connection.ts ya no contiene el fallback silencioso a localhost/dummy", () => {
    expect(connectionSrc).not.toContain(
      "postgresql://user:password@localhost:5432/dummy",
    );
  });

  it("connection.ts conserva el host no-resoluble para fallar fuerte", () => {
    expect(connectionSrc).toContain(
      "DATABASE_URL_NOT_CONFIGURED@invalid.invalid",
    );
  });

  it("connection.ts emite log FATAL cuando falta DATABASE_URL", () => {
    expect(connectionSrc).toContain("FATAL");
  });

  it("check-services-schema.js no contiene la credencial hardcoded", () => {
    // ponytail: archivo fue removido en chore/reorganize (33a2c2f2).
    // Si el archivo no existe, no puede contener credencial hardcodeada.
    const debugPath = resolve(__dirname, "../../check-services-schema.js");
    if (!existsSync(debugPath)) {
      expect(true).toBe(true);
      return;
    }
    const debugSrc = readFileSync(debugPath, "utf8");
    expect(/postgres\.jedryjmljffuvegggjmw:[^"'\s)]+@/.test(debugSrc)).toBe(
      false,
    );
    expect(debugSrc).toContain("process.env.DATABASE_URL");
  });
});

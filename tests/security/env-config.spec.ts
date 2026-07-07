import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
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
    const debugSrc = readFileSync(
      resolve(__dirname, "../../check-services-schema.js"),
      "utf8",
    );
    expect(/postgres\.jedryjmljffuvegggjmw:[^"'\s)]+@/.test(debugSrc)).toBe(
      false,
    );
    expect(debugSrc).toContain("process.env.DATABASE_URL");
  });
});

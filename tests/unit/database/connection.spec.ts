import { describe, it, expect } from "vitest";
import { _isPlaceholderForTest as isPlaceholder } from "@sass-store/database/connection";

describe("Feature: sin fallback silencioso de DATABASE_URL (STRY-026 SC-05/SC-06)", () => {
  // SC-05: la DB activa nunca es localhost/placeholder
  it("SC-05 — detecta cadena vacía y placeholders como inválidas", () => {
    expect(isPlaceholder("")).toBe(true);
    expect(isPlaceholder("your-database-url-here")).toBe(true);
    expect(isPlaceholder("your_database_url_here")).toBe(true);
  });

  it("acepta una cadena de conexión real como válida", () => {
    expect(
      isPlaceholder(
        "postgresql://user:pass@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
      ),
    ).toBe(false);
  });

  it("SC-06 — una URL localhost válida NO se considera placeholder (es falla de config, no de detección)", () => {
    // isPlaceholder solo filtra placeholders; la lógica de "no localhost en prod"
    // vive en el chequeo de env (tests/security/env-config.spec.ts).
    expect(
      isPlaceholder("postgresql://postgres:postgres@localhost:5432/db"),
    ).toBe(false);
  });
});

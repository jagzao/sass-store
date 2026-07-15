import { describe, it, expect } from "vitest";
import { buildTenantManifest } from "@/lib/pwa/manifest-service";

describe("Feature: PWA manifest dinámico por tenant (STRY-026)", () => {
  const baseTenant = {
    id: "t-1",
    slug: "wondernails",
    name: "Wonder Nails Studio",
    description: "Nail art and manicure",
    branding: {
      primaryColor: "#ff00ff",
      secondaryColor: "#00ff00",
      logo: "https://cdn.example.com/logo.png",
      logoUrl: null,
    },
  };

  // SC-01: identidad del tenant en el manifest (nombre, theme color, start_url)
  it("SC-01 — usa nombre, theme color y start_url del tenant", () => {
    const m = buildTenantManifest(baseTenant);
    expect(m.name).toBe("Wonder Nails Studio");
    expect(m.theme_color).toBe("#ff00ff");
    expect(m.start_url).toBe("/t/wondernails");
    expect(m.scope).toBe("/t/wondernails/");
    expect(m.display).toBe("standalone");
  });

  // SC-02: el manifest se sirve con la estructura válida (iconos 192/512 + maskable)
  it("SC-02 — incluye íconos 192 y 512 (any + maskable)", () => {
    const m = buildTenantManifest(baseTenant);
    const sizes = m.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(m.icons.some((i) => i.purpose === "maskable")).toBe(true);
    expect(m.icons.every((i) => i.src.length > 0)).toBe(true);
  });

  it("usa el logo del branding cuando está presente", () => {
    const m = buildTenantManifest(baseTenant);
    expect(m.icons[0].src).toBe("https://cdn.example.com/logo.png");
  });

  it("cae al logo por defecto del tenant cuando no hay logo", () => {
    const m = buildTenantManifest({
      ...baseTenant,
      branding: { primaryColor: "#111111" },
    });
    expect(m.icons[0].src).toBe("/tenants/wondernails/logo/icon-192.png");
    expect(m.icons[0].type).toBe("image/png");
  });

  it("short_name se trunca a 12 caracteres si el nombre es largo", () => {
    const m = buildTenantManifest({
      ...baseTenant,
      name: "Vainilla Vargas Beauty Boutique",
    });
    expect(m.short_name.length).toBe(12);
  });

  it("usa theme color por defecto si el del tenant no es hex válido", () => {
    const m = buildTenantManifest({
      ...baseTenant,
      branding: { primaryColor: "not-a-color" },
    });
    expect(m.theme_color).toBe("#6366f1");
  });

  it("usa una descripción derivada si el tenant no tiene description", () => {
    const m = buildTenantManifest({
      ...baseTenant,
      description: null,
    });
    expect(m.description).toContain("Wonder Nails Studio");
  });
});

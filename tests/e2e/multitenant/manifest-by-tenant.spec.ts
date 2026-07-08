import { test, expect } from "@playwright/test";

// STRY-026 SC-02 — el manifest se sirve por tenant con su identidad.
// Slugs reales presentes en la DB (verificados). delirios eliminado (ya no es cliente).
const TENANTS = ["wondernails", "centro-tenistico", "manada-juma"];

for (const slug of TENANTS) {
  test.describe(`PWA manifest por tenant — ${slug}`, () => {
    test(`SC-02 — GET /t/${slug}/manifest.webmanifest devuelve manifest válido`, async ({
      request,
    }) => {
      const res = await request.get(`/t/${slug}/manifest.webmanifest`);
      expect(res.status(), `manifest de ${slug} debe ser 200`).toBe(200);
      expect(res.headers()["content-type"]).toContain("manifest+json");

      const manifest = await res.json();
      expect(manifest.display).toBe("standalone");
      expect(manifest.start_url).toBe(`/t/${slug}`);
      expect(manifest.scope).toBe(`/t/${slug}/`);
      expect(Array.isArray(manifest.icons)).toBe(true);
      const sizes = (manifest.icons as { sizes: string }[]).map((i) => i.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");
      // theme_color debe ser un hex válido
      expect(manifest.theme_color).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    });
  });
}

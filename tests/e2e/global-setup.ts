import { FullConfig } from "@playwright/test";

/**
 * Global Setup para E2E.
 * Se ejecuta UNA VEZ antes de que comience cualquier test de Playwright.
 * Ideal para:
 * 1. Sembrar datos de prueba en la DB
 * 2. Asegurar que el dev server ya está compilado
 * 3. Preparar estado compartido (auth tokens, etc.)
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects?.[0]?.use?.baseURL || "http://localhost:3002";

  console.log("[Global Setup] Preparando entorno de E2E...");
  console.log(`[Global Setup] Base URL: ${baseURL}`);

  // 1. Verificar que el servidor responde (implica que build terminó)
  const healthCheck = async (retries = 20): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`${baseURL}/api/health`);
        if (res.status === 200) {
          console.log("[Global Setup] Servidor listo ✅");
          return true;
        }
      } catch {
        /* ignore */
      }
      console.log(
        `[Global Setup] Esperando servidor... intento ${i + 1}/${retries}`,
      );
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error("[Global Setup] Servidor no respondió a tiempo");
  };

  await healthCheck();

  // 2. Seed opcional: si existe endpoint de seed
  const TENANTS_TO_SEED = ["wondernails", "centro-tenistico"];

  for (const slug of TENANTS_TO_SEED) {
    try {
      const seedRes = await fetch(`${baseURL}/api/debug/seed-e2e`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: slug }),
      });
      if (seedRes.ok) {
        console.log(
          `[Global Setup] Seed de datos E2E para ${slug} completado ✅`,
        );
      } else {
        console.warn(
          `[Global Setup] Seed para ${slug} no disponible (status ${seedRes.status})`,
        );
      }
    } catch {
      console.warn(
        `[Global Setup] Seed no configurado para ${slug}, tests usarán datos existentes`,
      );
    }

    // Finance seed
    try {
      const financeRes = await fetch(`${baseURL}/api/finance/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: slug }),
      });
      if (financeRes.ok) {
        console.log(`[Global Setup] Finance seed para ${slug} ✅`);
      } else {
        console.warn(
          `[Global Setup] Finance seed para ${slug} no disponible (status ${financeRes.status})`,
        );
      }
    } catch {
      console.warn(`[Global Setup] Finance seed no configurado para ${slug}`);
    }
  }
}

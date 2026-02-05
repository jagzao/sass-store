import { Stagehand } from "@browserbasehq/stagehand";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_KEY = process.env.ZAI_API_KEY;
const MODEL_NAME = "glm-4.5";
const BASE_URL_OPENAI = "https://open.bigmodel.cn/api/paas/v4";

const TENANTS = ["zo-system", "wondernails"];

const assertIncludes = (haystack, needle, label = needle) => {
  if (!haystack.includes(needle)) {
    throw new Error(`Missing text: ${label}`);
  }
};

const assertNotIncludes = (haystack, needle, label = needle) => {
  if (haystack.includes(needle)) {
    throw new Error(`Unexpected text: ${label}`);
  }
};

const getSnapshotText = async (page) => {
  const snapshot = await page.snapshot();
  return snapshot.formattedTree;
};

const run = async () => {
  if (!API_KEY) {
    throw new Error("ZAI_API_KEY is required to run Stagehand.");
  }

  const stagehand = new Stagehand({
    env: "LOCAL",
    model: {
      provider: "openai",
      modelName: MODEL_NAME,
      apiKey: API_KEY,
      baseURL: BASE_URL_OPENAI,
    },
    localBrowserLaunchOptions: {
      headless: true,
    },
  });

  await stagehand.init();

  const page = await stagehand.context.newPage();

  try {
    for (const tenant of TENANTS) {
      console.log(`\n[Stagehand] Validating social module for ${tenant}`);

      await page.goto(`${BASE_URL}/t/${tenant}/social`);
      await page.waitForLoadState("networkidle", 30000);

      let tree = await getSnapshotText(page);
      assertIncludes(tree, "Calendario", `${tenant} nav Calendario`);
      assertIncludes(tree, "Cola", `${tenant} nav Cola`);
      assertIncludes(tree, "Generar", `${tenant} nav Generar`);
      assertIncludes(tree, "Biblioteca", `${tenant} nav Biblioteca`);
      assertIncludes(tree, "Analytics", `${tenant} nav Analytics`);
      assertIncludes(tree, "Crear", `${tenant} action Crear`);

      await stagehand.act("Haz clic en la pestaña Cola", { page });
      tree = await getSnapshotText(page);
      assertIncludes(tree, "Cola de Publicaciones", `${tenant} view Cola`);

      await stagehand.act("Haz clic en la pestaña Generar", { page });
      tree = await getSnapshotText(page);
      assertIncludes(tree, "Generar Contenido con IA", `${tenant} view Generar`);

      await stagehand.act("Haz clic en la pestaña Biblioteca", { page });
      tree = await getSnapshotText(page);
      assertIncludes(tree, "Biblioteca de Contenido", `${tenant} view Biblioteca`);

      await stagehand.act("Haz clic en la pestaña Analytics", { page });
      tree = await getSnapshotText(page);
      assertIncludes(tree, "Analytics", `${tenant} view Analytics`);

      await stagehand.act("Haz clic en la pestaña Calendario", { page });
      tree = await getSnapshotText(page);
      assertIncludes(tree, "Mes", `${tenant} calendar Mes`);
      assertIncludes(tree, "Semana", `${tenant} calendar Semana`);
      assertIncludes(tree, "Lista", `${tenant} calendar Lista`);
      assertIncludes(tree, "Hoy", `${tenant} calendar Hoy`);

      await stagehand.act("Haz clic en el botón Crear", { page });
      tree = await getSnapshotText(page);
      assertIncludes(tree, "Nueva Publicación", `${tenant} editor open`);

      await stagehand.act("Haz clic en Cancelar", { page });
      tree = await getSnapshotText(page);
      assertNotIncludes(tree, "Nueva Publicación", `${tenant} editor closed`);

      console.log(`[Stagehand] ${tenant} social module validated`);
    }
  } finally {
    await stagehand.close({ force: true });
  }
};

run().catch((error) => {
  console.error("[Stagehand] Social module validation failed:", error);
  process.exitCode = 1;
});

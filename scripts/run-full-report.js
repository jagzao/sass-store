const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = process.cwd();
const SERVER_LOG = path.join(REPO, "e2e-server-run.log");
const SERVER_ERR = path.join(REPO, "e2e-server-run.err");
const REPORT_LOG = path.join(REPO, "report-test-run3.log");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function checkServerReady() {
  try {
    const out = execSync(
      `node -e "fetch('http://127.0.0.1:3002').then(r=>console.log(r.status)).catch(e=>console.log('ERR'))"`,
      { encoding: "utf8", timeout: 5000 },
    );
    return out.trim().includes("200");
  } catch {
    return false;
  }
}

async function seedTenant(tenant) {
  try {
    const out = execSync(
      `node -e "fetch('http://127.0.0.1:3002/api/debug/seed-e2e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantSlug:'${tenant}'})}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(e=>console.log('ERR '+e.message))"`,
      { encoding: "utf8", timeout: 15000 },
    );
    console.log("  seed", tenant, out.trim());
  } catch (e) {
    console.log("  seed", tenant, "ERR", e.message.slice(0, 200));
  }
}

async function main() {
  // 1. Kill stale server
  console.log("[1/7] Killing stale servers...");
  try {
    execSync(
      `Get-Process | Where-Object {$_.ProcessName -match 'node' -and $_.CommandLine -match 'next start|start-e2e-server'} | ForEach-Object { Stop-Process -Id $_.Id -Force }`,
      { shell: "powershell", encoding: "utf8", timeout: 10000 },
    );
  } catch {}
  await sleep(2000);

  // 2. Start server
  console.log("[2/7] Starting E2E server...");
  const env = { ...process.env, E2E_SKIP_BUILD: "1" };
  const server = spawn("node", ["scripts/start-e2e-server.js"], {
    cwd: REPO,
    env,
    detached: false,
    stdio: ["ignore", fs.openSync(SERVER_LOG, "w"), fs.openSync(SERVER_ERR, "w")],
  });

  // 3. Wait for ready
  console.log("[3/7] Waiting for server ready...");
  let ready = false;
  for (let i = 0; i < 40; i++) {
    await sleep(2000);
    if (checkServerReady()) {
      ready = true;
      break;
    }
  }
  if (!ready) {
    console.error("Server did not become ready. Logs:");
    try {
      console.error(fs.readFileSync(SERVER_LOG, "utf8").slice(-500));
    } catch {}
    server.kill("SIGTERM");
    process.exit(1);
  }
  console.log("[4/7] Server ready on port 3002");

  // 4. Seed E2E data
  console.log("[5/7] Seeding E2E data...");
  for (const t of ["wondernails", "centro-tenistico", "zo-system"]) {
    await seedTenant(t);
    await sleep(500);
  }

  // 5. Run Playwright
  console.log("[6/7] Running Playwright report spec...");
  let result;
  try {
    result = execSync(
      `npx playwright test tests/e2e/reporte-general-web.spec.ts --project=chromium --reporter=list --timeout=120000 2>&1`,
      { encoding: "utf8", cwd: REPO, timeout: 300000 },
    );
    fs.writeFileSync(REPORT_LOG, result, "utf8");
  } catch (err) {
    result = String(err.stdout || "") + "\n" + String(err.stderr || err.message);
    fs.writeFileSync(REPORT_LOG, result, "utf8");
    console.error("Playwright exited with error (see report-test-run3.log)");
  }

  // Summary from result string
  const passLine = result.split("\n").find((l) => l.includes("passed"));
  const failLine = result.split("\n").find((l) => l.includes("failed"));
  console.log("[7/7] Result:", passLine || "", failLine || "");

  // 6. Stop server
  server.kill("SIGTERM");
  await sleep(1000);
  console.log("Done. Report at tests/reporte-general-web.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

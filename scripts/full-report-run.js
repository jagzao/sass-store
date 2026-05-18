const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Helper para levantar servidor en background y seedear
async function startServerAndRun() {
  const serverLog = path.join(process.cwd(), "e2e-server-run.log");
  const reportLog = path.join(process.cwd(), "report-test-run2.log");

  // Kill stale
  try { execSync('Get-Process | Where-Object {$_.ProcessName -match "node" -and $_.CommandLine -match "next start"} | ForEach-Object { Stop-Process -Id $_.Id -Force }', { shell: "powershell" }); } catch {}

  // Start server in background (PowerShell Start-Process detached)
  const startCmd = `
    $proc = Start-Process -FilePath "node" -ArgumentList "scripts/start-e2e-server.js" -PassThru -RedirectStandardOutput "${serverLog}" -RedirectStandardError "${serverLog.replace('.log','.err')}" -WorkingDirectory "${process.cwd()}";
    Start-Sleep -Seconds 20;
    Write-Output $proc.Id;
  `;
  console.log("[1/5] Starting E2E server...");
  let pid;
  try {
    pid = execSync(startCmd, { shell: "powershell", encoding: "utf8", timeout: 30000 }).trim();
  } catch (e) {
    console.error("Failed to start server:", e.message);
    process.exit(1);
  }
  console.log("[2/5] Server PID:", pid);

  // Seed E2E data for all tenants
  console.log("[3/5] Seeding E2E data...");
  const tenants = ["wondernails", "centro-tenistico", "zo-system"];
  for (const t of tenants) {
    try {
      const r = execSync(`node -e "fetch('http://127.0.0.1:3002/api/debug/seed-e2e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tenantSlug:'${t}'})}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(e=>console.error(e.message))"`, { encoding: "utf8", timeout: 15000 });
      console.log("  seed", t, r.trim());
    } catch (e) {
      console.log("  seed", t, "ERR", e.message.slice(0,200));
    }
  }

  // Run Playwright test
  console.log("[4/5] Running Playwright report spec...");
  let output = "";
  try {
    output = execSync(
      `npx playwright test tests/e2e/reporte-general-web.spec.ts --project=chromium --reporter=list --timeout=120000 2>&1`,
      { encoding: "utf8", timeout: 300000 }
    );
    fs.writeFileSync(reportLog, output, "utf8");
    console.log("[5/5] PASS — Report generated");
  } catch (err) {
    output = String(err.stdout || err.message) + "\n" + String(err.stderr || "");
    fs.writeFileSync(reportLog, output, "utf8");
    console.log("[5/5] FAIL — See", reportLog);
  }

  // Stop server
  try { execSync(`Stop-Process -Id ${pid} -Force`, { shell: "powershell" }); } catch {}
  console.log("Done.");
}

startServerAndRun().catch(console.error);

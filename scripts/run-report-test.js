const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const outFile = path.join(process.cwd(), "report-test-run.log");

function run() {
  try {
    const stdout = execSync(
      "npx playwright test tests/e2e/reporte-general-web.spec.ts --project=chromium --reporter=list --timeout=120000",
      {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["inherit", "pipe", "pipe"],
        timeout: 300000,
      },
    );
    fs.writeFileSync(outFile, stdout, "utf8");
    console.log("PASS");
  } catch (err) {
    fs.writeFileSync(outFile, String(err.stdout || err.message) + "\n" + String(err.stderr || ""), "utf8");
    console.log("FAIL");
  }
}

run();

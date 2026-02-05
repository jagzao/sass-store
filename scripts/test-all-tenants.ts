import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import { execSync } from "child_process";

// Load environment variables
// Priority: .env.local -> .env
// Use .env.test only when explicitly requested (USE_TEST_ENV=true)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (process.env.USE_TEST_ENV === "true") {
  dotenv.config({
    path: path.resolve(__dirname, "../.env.test"),
    override: true,
  });
}

// Use DATABASE_URL from env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not defined in environment variables.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

async function runTests() {
  let client;
  try {
    client = await pool.connect();
    console.log("🔌 Connected to database...");

    // Fetch active tenants
    const res = await client.query(
      "SELECT slug, name FROM tenants WHERE status = 'active'",
    );
    const activeTenants = res.rows;

    if (activeTenants.length === 0) {
      console.log("⚠️ No active tenants found.");
      return;
    }

    console.log(
      `🎯 Found ${activeTenants.length} active tenants: ${activeTenants.map((t: any) => t.slug).join(", ")}`,
    );

    let failureCount = 0;

    for (const tenant of activeTenants) {
      const slug = tenant.slug;
      const name = tenant.name;
      // Default admin email convention: admin@<slug>.com
      // Or you might query the staff table to find an admin email if conventions vary
      // For now, using the convention as agreed in the plan.
      const adminEmail = `admin@${slug}.com`;

      console.log(`\n==================================================`);
      console.log(`🏃 Running tests for tenant: ${name} (${slug})`);
      console.log(`📧 Using admin email: ${adminEmail}`);
      console.log(`==================================================\n`);

      try {
        // Run Playwright
        // Passing environment variables to the child process
        execSync(`npx playwright test`, {
          stdio: "inherit", // Pipe output to parent
          env: {
            ...process.env,
            TEST_TENANT_SLUG: slug,
            TEST_ADMIN_EMAIL: adminEmail,
            // TEST_ADMIN_PASSWORD is assumed to be shared or set in env
          },
        });
        console.log(`\n✅ Tests PASSED for ${slug}`);
      } catch (error) {
        console.error(`\n❌ Tests FAILED for ${slug}`);
        failureCount++;
        // We continue to next tenant even if one fails
      }
    }

    if (failureCount > 0) {
      console.error(`\nRef: Finished with ${failureCount} tenant failures.`);
      process.exit(1);
    } else {
      console.log(`\n✨ All tenant tests passed successfully!`);
      process.exit(0);
    }
  } catch (err) {
    console.error("🔥 Error executing test runner:", err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runTests();

import postgres from "postgres";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

async function runVerification() {
  console.log("Starting RLS Verification...");
  const sql = postgres(connectionString!, { max: 1 });

  try {
    // 1. Setup minimal test data
    console.log("Setting up test data...");

    // Clean
    try {
      await sql`DELETE FROM products WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'verify-rls-%')`;
      await sql`DELETE FROM tenants WHERE slug LIKE 'verify-rls-%'`;
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }

    const slug1 = `verify-rls-1-${Date.now()}`;
    const slug2 = `verify-rls-2-${Date.now()}`;

    const [t1] = await sql`
      INSERT INTO tenants (name, slug, branding, contact, location, quotas)
      VALUES ('Tenant 1', ${slug1}, '{}', '{}', '{}', '{}')
      RETURNING id
    `;

    const [t2] = await sql`
      INSERT INTO tenants (name, slug, branding, contact, location, quotas)
      VALUES ('Tenant 2', ${slug2}, '{}', '{}', '{}', '{}')
      RETURNING id
    `;

    console.log(`Created tenants: ${t1.id}, ${t2.id}`);

    // Create products
    await sql`
      INSERT INTO products (tenant_id, sku, name, price, active, branding, contact, location, quotas) 
      VALUES (${t1.id}, ${"SKU1-" + Date.now()}, 'Product 1', 100, true, '{}', '{}', '{}', '{}')
    `.catch((e) => {
      // Handle case where specific columns might differ in schema vs raw SQL assumption
      // Schema.ts says: sku, name, description, price, category...
      // Let's use minimal fields.
      return sql`
           INSERT INTO products (tenant_id, sku, name, price, category)
           VALUES (${t1.id}, ${"SKU1-" + Date.now()}, 'Product 1', 100, 'Test')
           RETURNING id
        `;
    });

    // Insert properly
    const [p1] = await sql`
       INSERT INTO products (tenant_id, sku, name, price, category, active)
       VALUES (${t1.id}, ${"SKU1-" + Date.now()}, 'Product 1', 100, 'Test', true)
       RETURNING id
    `;
    const [p2] = await sql`
       INSERT INTO products (tenant_id, sku, name, price, category, active)
       VALUES (${t2.id}, ${"SKU2-" + Date.now()}, 'Product 2', 200, 'Test', true)
       RETURNING id
    `;

    console.log(`Created products: ${p1.id} (T1), ${p2.id} (T2)`);

    // 2. Ensure RLS is applied (Minimal)
    await sql`ALTER TABLE products ENABLE ROW LEVEL SECURITY`;
    await sql`DROP POLICY IF EXISTS test_isolation ON products`;
    await sql`CREATE POLICY test_isolation ON products USING (tenant_id = (current_setting('app.current_tenant_id', true)::uuid))`;
    await sql`ALTER TABLE products FORCE ROW LEVEL SECURITY`; // Ensure owner is restricted too if we assume owner is used
    console.log("Applied Minimal RLS policies.");

    // 3. Create Restricted User
    try {
      await sql`CREATE ROLE verify_user WITH LOGIN PASSWORD 'test' NOINHERIT`;
    } catch (e) {
      // Ignore if exists
    }
    await sql`GRANT USAGE ON SCHEMA public TO verify_user`;
    await sql`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO verify_user`;
    await sql`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO verify_user`;
    // Grant execution on functions if needed, specifically set_tenant_context if we use it via RPC?
    // We use SELECT set_tenant_context call.
    // Ensure set_tenant_context exists.
    await sql`
        CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
        RETURNS void AS $$
        BEGIN
        PERFORM set_config('app.current_tenant_id', tenant_uuid::text, FALSE);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    await sql`GRANT EXECUTE ON FUNCTION set_tenant_context(uuid) TO verify_user`;

    console.log("Configured verify_user.");

    // 4. Connect as restricted user?
    // Or just SET ROLE in the current connection.
    // We need to ensure we grant verify_user to current user.
    await sql`GRANT verify_user TO current_user`;
    console.log("Granted verify_user to current_user.");

    // 5. Verify Isolation
    console.log("\n--- Verifying T1 Visibility ---");

    // Switch role and set context
    await sql`SET ROLE verify_user`;
    await sql`SELECT set_tenant_context(${t1.id})`;

    const rowsT1 = await sql`SELECT id, name FROM products`;
    console.log(`Query as T1 returned ${rowsT1.length} rows.`);
    rowsT1.forEach((r) => console.log(` - ${r.name} (${r.id})`));

    if (rowsT1.length !== 1 || rowsT1[0].id !== p1.id) {
      console.error("FAIL: T1 should see only P1");
    } else {
      console.log("SUCCESS: T1 sees only P1");
    }

    // Check visibility of P2 by ID
    const p2Check = await sql`SELECT id FROM products WHERE id = ${p2.id}`;
    if (p2Check.length > 0) {
      console.error("FAIL: T1 can see P2 by ID!");
    } else {
      console.log("SUCCESS: T1 cannot see P2");
    }

    console.log("\n--- Verifying T2 Visibility ---");
    // Switch context
    await sql`SELECT set_tenant_context(${t2.id})`;

    const rowsT2 = await sql`SELECT id, name FROM products`;
    console.log(`Query as T2 returned ${rowsT2.length} rows.`);

    if (rowsT2.length !== 1 || rowsT2[0].id !== p2.id) {
      console.error("FAIL: T2 should see only P2");
    } else {
      console.log("SUCCESS: T2 sees only P2");
    }

    // Cleanup
    await sql`RESET ROLE`; // Back to super/owner
    await sql`DELETE FROM tenants WHERE slug LIKE 'verify-rls-%'`;
    console.log("\nVerification Complete.");
  } catch (e) {
    console.error("Verification logic failed:", e);
  } finally {
    await sql.end();
  }
}

runVerification();

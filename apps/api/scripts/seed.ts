import postgres from "postgres";
import fs from "fs";
import path from "path";

async function seed() {
  const connectionString = process.env.DATABASE_URL!;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, {
    prepare: false,
    ssl: "require",
  });

  try {
    console.log("Seeding database...");

    // Read seed SQL file
    const seedPath = path.resolve(
      __dirname,
      "../../../packages/database/seed.sql"
    );
    const seedSQL = fs.readFileSync(seedPath, "utf-8");

    // Execute the seed SQL
    await client.unsafe(seedSQL);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seed();

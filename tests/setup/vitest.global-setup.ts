import { setupTestDatabase, teardownTestDatabase } from "./test-database";

export default async function globalSetup() {
  console.log("🔧 Initializing test database...");
  await setupTestDatabase();

  return async () => {
    await teardownTestDatabase();
  };
}

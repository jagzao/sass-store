const postgres = require("postgres");

async function test() {
  try {
    const client = postgres("postgresql://postgres:postgres@localhost:5432/sass_store_test", {
      prepare: false,
      ssl: false,
      max: 1,
      idle_timeout: 10,
      connect_timeout: 5,
    });
    const result = await client`SELECT NOW()`;
    console.log("Direct postgres OK:", result);
    await client.end();
  } catch (e) {
    console.error("Direct postgres FAIL:", e.message);
  }
}

test();

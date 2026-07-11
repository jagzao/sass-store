const fs = require("fs");
const path = require("path");

const API_KEY = process.argv[2];
const N8N = "http://localhost:5678";
const headers = {
  "X-N8N-API-KEY": API_KEY,
  "Content-Type": "application/json",
};

async function main() {
  // Read workflow JSON
  const wfFile = path.join(
    __dirname,
    "..",
    "n8n",
    "workflows",
    "STRY-028-social-content-generator.json",
  );
  const wf = JSON.parse(fs.readFileSync(wfFile, "utf8"));

  // Force Code node typeVersion to 1 (legacy wrapping, supports return)
  wf.nodes = wf.nodes.map((n) => {
    if (n.type === "n8n-nodes-base.code") {
      return { ...n, typeVersion: 1 };
    }
    return n;
  });

  const body = JSON.stringify({
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings,
  });

  // Create
  const createResp = await fetch(`${N8N}/api/v1/workflows`, {
    method: "POST",
    headers,
    body,
  });
  const created = await createResp.json();
  if (!createResp.ok) {
    console.error("CREATE FAILED:", JSON.stringify(created));
    process.exit(1);
  }
  console.log("Created:", created.id);

  // Activate
  const actResp = await fetch(
    `${N8N}/api/v1/workflows/${created.id}/activate`,
    { method: "POST", headers },
  );
  const activated = await actResp.json();
  console.log("Active:", activated.active);

  // Test
  console.log("\nTesting webhook...");
  const testBody = JSON.stringify({
    tenant: "wondernails",
    objective: "brand",
    vibe: "professional",
    platforms: ["facebook", "instagram"],
    startDate: "2026-08-01",
    endDate: "2026-08-07",
    frequency: { postsPerWeek: 1, reelsPerWeek: 0, storiesPerWeek: 0 },
    contentMix: { promotions: 100, before_after: 0, trends: 0, tips: 0 },
    businessContext: "Salon de unas en Merida Yucatan",
    platformLimits: { facebook: 63206, instagram: 2200 },
    platformGuidance: {
      facebook: "Usa emojis moderadamente",
      instagram: "3-5 hashtags, emojis",
    },
  });

  const testResp = await fetch(`${N8N}/webhook/social-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: testBody,
    signal: AbortSignal.timeout(240000),
  });
  const text = await testResp.text();
  console.log("Status:", testResp.status);
  console.log("Response length:", text.length);
  if (text.length > 0) {
    try {
      const parsed = JSON.parse(text);
      console.log(
        "Parsed OK:",
        parsed.success !== undefined ? `success=${parsed.success}` : "unknown",
      );
      if (parsed.data?.generatedPosts) {
        console.log("Posts generated:", parsed.data.generatedPosts.length);
        console.log("First post:", parsed.data.generatedPosts[0]?.title);
      }
      if (parsed.error) console.log("Error:", parsed.error);
    } catch {
      console.log("Raw:", text.substring(0, 500));
    }
  } else {
    console.log("Empty response - checking execution...");
    const execResp = await fetch(
      `${N8N}/api/v1/executions?workflowId=${created.id}&limit=1`,
      { headers },
    );
    const execs = await execResp.json();
    if (execs.data[0]) {
      const e = execs.data[0];
      const dur = e.stoppedAt
        ? new Date(e.stoppedAt) - new Date(e.startedAt) + "ms"
        : "?";
      console.log(
        "Last exec:",
        e.id,
        "| Status:",
        e.status,
        "| Duration:",
        dur,
      );
    }
  }
}

main().catch(console.error);

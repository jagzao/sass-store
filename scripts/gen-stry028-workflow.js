const fs = require("fs");
const path = require("path");

const buildPromptCode = `const data = $input.first().json.body || $input.first().json;
const { tenant, objective, vibe, platforms, startDate, endDate, frequency, contentMix, businessContext, platformLimits, platformGuidance } = data;
const objLabels = { sales: 'Ventas', brand: 'Marca', educational: 'Educativo', engagement: 'Engagement' };
const vibeLabels = { professional: 'Profesional', casual: 'Casual', funny: 'Divertido', inspiring: 'Inspirador' };
const start = new Date(startDate);
const end = new Date(endDate);
const daysDiff = Math.ceil((end - start) / 86400000);
const weeks = daysDiff / 7;
const tp = Math.floor(weeks * (frequency?.postsPerWeek || 3));
const tr = Math.floor(weeks * (frequency?.reelsPerWeek || 1));
const ts = Math.floor(weeks * (frequency?.storiesPerWeek || 2));
const tc = tp + tr + ts;
const pList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
const guide = (platforms || []).map(function(p) { return '- ' + p + ': max ' + (platformLimits?.[p] || 2200) + '. ' + (platformGuidance?.[p] || ''); }).join('\\n');
const sys = 'Eres un experto en marketing de redes sociales. Genera contenido atractivo y listo para publicar. Responde SOLO con un JSON array valido, sin markdown, sin explicacion.';
const usr = 'Negocio: ' + tenant + '\\nObjetivo: ' + (objLabels[objective] || objective) + '\\nTono: ' + (vibeLabels[vibe] || vibe) + '\\nPlataformas: ' + pList + '\\nContexto: ' + (businessContext || 'Negocio local') + '\\n\\nDistribucion: Promocional ' + (contentMix?.promotions || 40) + '%, Antes/Despues ' + (contentMix?.before_after || 30) + '%, Tendencias ' + (contentMix?.trends || 20) + '%, Tips ' + (contentMix?.tips || 10) + '%\\n\\nGenera ' + tc + ' piezas (' + tp + ' posts, ' + tr + ' reels, ' + ts + ' stories).\\n\\nDevuelve SOLO un array JSON:\\n[{"title":"max 60 chars","content":"texto","platforms":["facebook"],"format":"post","suggestedTime":"morning","contentType":"promotional"}]\\n\\nReglas:\\n' + guide + '\\n- Emojis moderados\\n- CTA cuando aplique\\n- No repitas';
return [{ json: { systemPrompt: sys, userPrompt: usr, originalData: data, totalContent: tc } }];`;

const parseResponseCode = `const llmResp = $input.first().json;
const buildData = $('BuildPrompt').first().json;
const od = buildData.originalData;
const tc = buildData.totalContent;
var generatedContent = [];
var parseOk = true;
var parseErrMsg = '';
try {
  var rawContent = (llmResp.choices && llmResp.choices[0] && llmResp.choices[0].message && llmResp.choices[0].message.content) || '';
  var cleaned = rawContent.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
  var jsonMatch = cleaned.match(/\\[[\\s\\S]*\\]/);
  generatedContent = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
} catch (e) {
  parseOk = false;
  parseErrMsg = e.message;
}
if (!parseOk) {
  return [{ json: { success: false, error: 'No se pudo generar contenido. Intenta de nuevo.', details: parseErrMsg } }];
}
var start = new Date(od.startDate);
var end = new Date(od.endDate);
var daysDiff = Math.ceil((end - start) / 86400000);
var timeMap = { morning: 9, afternoon: 14, evening: 19 };
var tcount = tc || generatedContent.length;
var posts = generatedContent.map(function(item, index) {
  var dayOffset = Math.floor((index / Math.max(tcount, 1)) * daysDiff);
  var postDate = new Date(start);
  postDate.setDate(postDate.getDate() + dayOffset);
  postDate.setHours(timeMap[item.suggestedTime] || 12, 0, 0, 0);
  var vp = (item.platforms || []).filter(function(p) { return (od.platforms || []).indexOf(p) >= 0; });
  var fp = vp.length > 0 ? vp : (od.platforms || []);
  var fmt = ['post', 'reel', 'story'].indexOf(item.format) >= 0 ? item.format : 'post';
  var ct = ['promotional', 'before_after', 'trending', 'tip'].indexOf(item.contentType) >= 0 ? item.contentType : 'promotional';
  return { id: 'ai-' + index, title: (item.title || 'Post ' + (index + 1)).slice(0, 60), content: item.content || '', platforms: fp, format: fmt, scheduledAt: postDate.toISOString(), status: 'draft', contentType: ct };
});
posts.sort(function(a, b) { return new Date(a.scheduledAt) - new Date(b.scheduledAt); });
var result = {
  success: true,
  data: {
    generatedPosts: posts,
    summary: {
      totalPosts: posts.length,
      postsByFormat: {
        post: posts.filter(function(p) { return p.format === 'post'; }).length,
        reel: posts.filter(function(p) { return p.format === 'reel'; }).length,
        story: posts.filter(function(p) { return p.format === 'story'; }).length
      },
      postsByType: {
        promotional: posts.filter(function(p) { return p.contentType === 'promotional'; }).length,
        before_after: posts.filter(function(p) { return p.contentType === 'before_after'; }).length,
        trending: posts.filter(function(p) { return p.contentType === 'trending'; }).length,
        tip: posts.filter(function(p) { return p.contentType === 'tip'; }).length
      },
      dateRange: { start: od.startDate, end: od.endDate }
    }
  }
};
return [{ json: result }];`;

// Validate both compile
try {
  new Function(buildPromptCode);
  console.log("BuildPrompt: compiles OK");
} catch (e) {
  console.log("BuildPrompt ERROR:", e.message);
}
try {
  new Function(parseResponseCode);
  console.log("ParseResponse: compiles OK");
} catch (e) {
  console.log("ParseResponse ERROR:", e.message);
}

const wf = {
  name: "STRY-028: Social Content Generator (GLM)",
  settings: { executionOrder: "v1" },
  nodes: [
    {
      id: "wh",
      name: "Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [160, 300],
      parameters: {
        httpMethod: "POST",
        path: "social-generate",
        responseMode: "responseNode",
        options: {},
      },
      webhookId: "social-generate-stry028-v3",
    },
    {
      id: "bp",
      name: "BuildPrompt",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [400, 300],
      parameters: { jsCode: buildPromptCode },
    },
    {
      id: "llm",
      name: "CallGLM",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [640, 300],
      parameters: {
        method: "POST",
        url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: "Bearer 860729174f864d9b9e279d6b5f5355d1.lHGvOopsK8mcsZnm",
            },
            { name: "Content-Type", value: "application/json" },
          ],
        },
        sendBody: true,
        contentType: "raw",
        rawContentType: "application/json",
        body: "={{ JSON.stringify({ model: 'glm-4.5-flash', messages: [{ role: 'system', content: $json.systemPrompt }, { role: 'user', content: $json.userPrompt }], max_tokens: 4000, temperature: 0.8, stream: false }) }}",
        options: { timeout: 180000 },
      },
      onError: "continueRegularOutput",
    },
    {
      id: "pr",
      name: "ParseResponse",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [880, 300],
      parameters: { jsCode: parseResponseCode },
    },
    {
      id: "rw",
      name: "Respond",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1.1,
      position: [1120, 300],
      parameters: {
        respondWith: "json",
        responseBody: "={{ JSON.stringify($json) }}",
        options: {
          responseCode: 200,
          responseHeaders: {
            entries: [{ name: "Content-Type", value: "application/json" }],
          },
        },
      },
    },
  ],
  connections: {
    Webhook: { main: [[{ node: "BuildPrompt", type: "main", index: 0 }]] },
    BuildPrompt: { main: [[{ node: "CallGLM", type: "main", index: 0 }]] },
    CallGLM: { main: [[{ node: "ParseResponse", type: "main", index: 0 }]] },
    ParseResponse: { main: [[{ node: "Respond", type: "main", index: 0 }]] },
  },
  pinData: {},
  meta: { templateCredsSetupCompleted: false },
};

const outPath = path.join(
  __dirname,
  "..",
  "n8n",
  "workflows",
  "STRY-028-social-content-generator.json",
);
fs.writeFileSync(outPath, JSON.stringify(wf, null, 2));
console.log("Workflow JSON saved to:", outPath);

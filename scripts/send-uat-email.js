// @ts-nocheck
#!/usr/bin/env node
/**
 * send-uat-email.js
 * Envía el documento UAT al correo configurado (.env UAT_EMAIL_RECIPIENT).
 * Uso: node scripts/send-uat-email.js docs/UAT/pos-checkout-uat-2026-04-28.md
 */

const fs = require("fs");
const path = require("path");

const UAT_FILE = process.argv[2];
const RECIPIENT = process.env.UAT_EMAIL_RECIPIENT || "contacto@zostudio.com.mx";

if (!UAT_FILE || !fs.existsSync(UAT_FILE)) {
  console.error("❌ Uso: node scripts/send-uat-email.js <ruta-del-uat.md>");
  process.exit(1);
}

const content = fs.readFileSync(UAT_FILE, "utf8");
const featureName = path.basename(UAT_FILE, ".md");

// Log de envío (en producción, integrar con Resend/AWS SES)
console.log(`\n📧 UAT Email simulado:`);
console.log(`Para: ${RECIPIENT}`);
console.log(`Asunto: UAT Pendiente: ${featureName} — Favor validar`);
console.log(`\n--- CONTENIDO ---\n${content.substring(0, 500)}...\n---\n`);
console.log(`✅ UAT enviado (simulado). En producción usar Resend o AWS SES.`);

// Guardar log de envío
const logDir = "docs/UAT/logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
fs.writeFileSync(
  path.join(logDir, `${featureName}-sent.log`),
  `Enviado a: ${RECIPIENT}\nFecha: ${new Date().toISOString()}\nArchivo: ${UAT_FILE}\n`
);

#!/usr/bin/env node
/**
 * Script: demo-recorder.ts
 * Propósito: Grabar videos de demostración de features automáticamente
 * Uso: npx ts-node tools/demo-recorder.ts [feature-name]
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuración
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3001',
  tenantSlug: process.env.TENANT_SLUG || 'test-tenant',
  outputDir: 'test-results/demos',
  authState: 'tests/e2e/.auth/admin.json',
  videoSize: { width: 1280, height: 720 },
};

interface DemoStep {
  action: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'screenshot' | 'pause';
  selector?: string;
  value?: string;
  description: string;
  pauseMs?: number;
}

interface DemoConfig {
  featureName: string;
  description: string;
  steps: DemoStep[];
}

// Parser de argumentos
function parseArgs(): string {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('❌ Uso: npx ts-node tools/demo-recorder.ts [feature-name]');
    console.error('   Ejemplo: npx ts-node tools/demo-recorder.ts bookings');
    process.exit(1);
  }
  return args[0];
}

// Cargar configuración de demo desde archivo
function loadDemoConfig(featureName: string): DemoConfig | null {
  const configPath = path.join('tests/e2e/demos', `${featureName}-demo.config.json`);
  
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  
  // Configuración por defecto
  return {
    featureName,
    description: `Demo de ${featureName}`,
    steps: [
      { action: 'navigate', value: `/t/${CONFIG.tenantSlug}/dashboard`, description: 'Navegar al dashboard' },
      { action: 'pause', pauseMs: 1000, description: 'Pausa para carga' },
      { action: 'screenshot', description: 'Screenshot inicial' },
    ],
  };
}

// Crear directorio de salida
function ensureOutputDir(): void {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// Verificar que el servidor está corriendo
async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(CONFIG.baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

// Grabar demo
async function recordDemo(config: DemoConfig): Promise<string> {
  console.log(`\n🎬 Iniciando grabación de demo: ${config.featureName}`);
  console.log(`📝 Descripción: ${config.description}\n`);

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    // Lanzar navegador
    browser = await chromium.launch({
      headless: false, // Mostrar navegador para demo
      slowMo: 100, // Ralentizar para mejor visualización
    });

    // Crear contexto con video
    context = await browser.newContext({
      viewport: CONFIG.videoSize,
      recordVideo: {
        dir: CONFIG.outputDir,
        size: CONFIG.videoSize,
      },
      storageState: fs.existsSync(CONFIG.authState) ? CONFIG.authState : undefined,
    });

    page = await context.newPage();

    // Ejecutar pasos del demo
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];
      console.log(`  [${i + 1}/${config.steps.length}] ${step.description}`);

      switch (step.action) {
        case 'navigate':
          await page.goto(`${CONFIG.baseUrl}${step.value}`);
          await page.waitForLoadState('networkidle');
          break;

        case 'click':
          if (step.selector) {
            await page.click(step.selector);
          }
          break;

        case 'fill':
          if (step.selector && step.value) {
            await page.fill(step.selector, step.value);
          }
          break;

        case 'select':
          if (step.selector && step.value) {
            await page.selectOption(step.selector, step.value);
          }
          break;

        case 'wait':
          if (step.selector) {
            await page.waitForSelector(step.selector, { timeout: 10000 });
          } else {
            await page.waitForTimeout(step.pauseMs || 1000);
          }
          break;

        case 'screenshot':
          const screenshotPath = path.join(
            CONFIG.outputDir,
            `${config.featureName}-step-${i + 1}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: false });
          console.log(`    📷 Screenshot: ${screenshotPath}`);
          break;

        case 'pause':
          if (step.pauseMs) {
            await page.waitForTimeout(step.pauseMs);
          }
          break;
      }

      // Pausa entre pasos
      await page.waitForTimeout(500);
    }

    // Obtener path del video
    const videoPath = await page.video()?.path();
    
    console.log('\n✅ Demo grabado exitosamente');
    
    return videoPath || '';

  } catch (error) {
    console.error('\n❌ Error grabando demo:', error);
    throw error;
  } finally {
    // Cerrar navegador
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

// Generar reporte HTML
function generateReport(config: DemoConfig, videoPath: string): string {
  const reportPath = path.join(CONFIG.outputDir, `${config.featureName}-report.html`);
  
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo: ${config.featureName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .video-container { margin: 20px 0; }
    video { max-width: 100%; border: 1px solid #ddd; border-radius: 8px; }
    .steps { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .step { padding: 10px; border-bottom: 1px solid #ddd; }
    .step:last-child { border-bottom: none; }
    .timestamp { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>🎬 Demo: ${config.featureName}</h1>
  <p>${config.description}</p>
  
  <div class="video-container">
    <video controls autoplay>
      <source src="${path.basename(videoPath)}" type="video/webm">
      Tu navegador no soporta el elemento video.
    </video>
  </div>
  
  <div class="steps">
    <h2>Pasos del Demo</h2>
    ${config.steps.map((step, i) => `
      <div class="step">
        <strong>Paso ${i + 1}:</strong> ${step.description}
        <span class="timestamp">[${step.action}]</span>
      </div>
    `).join('')}
  </div>
  
  <p class="timestamp">Generado: ${new Date().toLocaleString()}</p>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, html);
  console.log(`📄 Reporte generado: ${reportPath}`);
  
  return reportPath;
}

// Main
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           🎬 DEMO RECORDER - sass-store                   ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const featureName = parseArgs();
  
  // Verificar servidor
  console.log('🔍 Verificando servidor...');
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ El servidor no está corriendo. Ejecuta: npm run dev');
    process.exit(1);
  }
  console.log('✅ Servidor corriendo\n');

  // Cargar configuración
  const demoConfig = loadDemoConfig(featureName);
  if (!demoConfig) {
    console.error(`❌ No se encontró configuración para: ${featureName}`);
    process.exit(1);
  }

  // Crear directorio de salida
  ensureOutputDir();

  // Grabar demo
  const videoPath = await recordDemo(demoConfig);

  // Generar reporte
  if (videoPath) {
    generateReport(demoConfig, videoPath);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Demo completado exitosamente');
  console.log(`📁 Videos en: ${CONFIG.outputDir}`);
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);

# 🚀 Guía de Replicación del AI Swarm System

## 📋 Índice

1. [Replicación Básica](#replicación-básica)
2. [Configuración y Ajustes](#configuración-y-ajustes)
3. [Personalización Avanzada](#personalización-avanzada)
4. [Potenciación del Sistema](#potenciación-del-sistema)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 1. Replicación Básica

### Paso 1: Copiar Archivos Esenciales

```bash
# En tu nuevo proyecto, crea la estructura
mkdir -p agents/swarm/{agents,cli,sessions}
mkdir -p docs

# Copia los archivos del sistema swarm
cp -r /ruta/sass-store/agents/swarm/* ./agents/swarm/
cp /ruta/sass-store/AGENTS.md ./AGENTS.md
cp /ruta/sass-store/package.json ./package.json  # Solo los scripts relevantes
```

### Archivos Mínimos Necesarios:

```
tu-proyecto/
├── agents/
│   └── swarm/
│       ├── agents/
│       │   ├── base-agent.ts           # ✅ Base para todos los agentes
│       │   ├── architect-agent.ts      # ✅ Validación de arquitectura
│       │   ├── developer-agent.ts      # ✅ Implementación
│       │   ├── qa-agent.ts             # ✅ Tests automáticos
│       │   ├── code-quality-agent.ts   # ✅ Estándares de código
│       │   ├── security-agent.ts       # ✅ Seguridad
│       │   ├── tester-agent.ts         # ✅ Validación final
│       │   └── pm-agent.ts             # ⚪ Opcional
│       ├── cli/
│       │   ├── start.ts                # ✅ Comando principal
│       │   ├── status.ts               # ✅ Ver estado
│       │   ├── resume.ts               # ✅ Reanudar
│       │   ├── continue.ts             # ✅ Continuar
│       │   └── ui.ts                   # ✅ Interfaz visual
│       ├── agents-config.ts            # ✅ Configuración de agentes
│       ├── swarm-manager.ts            # ✅ Gestor de sesiones
│       └── types.ts                    # ✅ TypeScript types
├── AGENTS.md                            # ✅ Lineamientos
└── package.json                         # ✅ Scripts npm
```

### Paso 2: Instalar Dependencias

```bash
npm install --save-dev \
  typescript \
  ts-node \
  @types/node
```

### Paso 3: Agregar Scripts a package.json

```json
{
  "scripts": {
    "swarm:start": "ts-node --transpile-only ./agents/swarm/cli/start.ts",
    "swarm:status": "ts-node --transpile-only ./agents/swarm/cli/status.ts",
    "swarm:resume": "ts-node --transpile-only ./agents/swarm/cli/resume.ts",
    "swarm:continue": "ts-node --transpile-only ./agents/swarm/cli/continue.ts"
  }
}
```

---

## 2. Auto-Reanudación Automática (IMPORTANTE)

### Opción 1: Daemon Continuo (RECOMENDADO)

El daemon revisa cada 30 minutos y reanuda automáticamente cualquier sesión pausada después de 5 horas:

```bash
# Iniciar daemon (mantener terminal abierta)
npm run autoresume:start

# O ejecutar en background (Linux/Mac)
nohup npm run autoresume:daemon > autoresume.log 2>&1 &

# O con PM2 (recomendado para producción)
npm install -g pm2
pm2 start "npm run autoresume:daemon" --name autoresume
pm2 save
pm2 startup
```

### Opción 2: Cron Job (Alternativa)

**Linux/Mac:**

```bash
crontab -e

# Ejecutar cada 30 minutos
*/30 * * * * cd /path/to/sass-store && npm run autoresume >> /tmp/autoresume.log 2>&1
```

**Windows (Task Scheduler):**

```powershell
schtasks /create /tn "Swarm AutoResume" /tr "npm run autoresume" /sc minute /mo 30
```

### Configuración de Ventanas

Edita `config/autoresume.json`:

```json
{
  "timezone": "America/Mexico_City",
  "windows": ["00:00", "05:00", "10:00", "15:00", "20:00"],
  "maxRetries": 3,
  "enabled": true,
  "checkIntervalMinutes": 30
}
```

**Comportamiento:**

- ✅ Reanuda automáticamente **después de 5 horas** (sin importar ventanas)
- ✅ Si hay ventanas programadas y no han pasado 5h, espera a la ventana
- ✅ Chequea cada 30 minutos (configurable con `checkIntervalMinutes`)
- ✅ Máximo 3 reintentos automáticos

---

## 3. Configuración y Ajustes

### Usar Claude Code CLI para Ajustar al Proyecto

**Prompt sugerido:**

```
Acabo de copiar el sistema AI Swarm de otro proyecto.
Necesito que ajustes los siguientes archivos para que funcionen con mi proyecto actual:

1. Revisa la estructura del proyecto en [describe tu estructura]
2. Ajusta agents-config.ts con las rutas correctas
3. Modifica architect-agent.ts para validar MI arquitectura específica
4. Actualiza developer-agent.ts para usar MIS convenciones de carpetas
5. Personaliza AGENTS.md con MIS estándares de código

Mi proyecto usa:
- Framework: [Next.js/React/Vue/etc]
- Estructura: [Monorepo/Single repo]
- Testing: [Jest/Vitest/Playwright]
- Linting: [ESLint config específico]
```

### Archivos Clave a Personalizar:

#### **agents-config.ts** - Adapta los agentes

```typescript
export const AGENT_CONFIGS: AgentConfig[] = [
  {
    role: "ARCHITECT",
    name: "Architect",
    emoji: "🏗️",
    description: "Valida arquitectura ESPECÍFICA de tu proyecto",
    capabilities: [
      "Validar estructura de [TU FRAMEWORK]",
      "Verificar [TUS PATRONES]",
      // ... personaliza aquí
    ],
    dependencies: ["ORCHESTRATOR"],
  },
  // ... más agentes
];
```

#### **AGENTS.md** - Tus Estándares

```markdown
## Project-Specific Standards

### Tu Stack

- Framework: [Tu stack]
- Testing: [Tu approach]
- Deployment: [Tu proceso]

### Tus Convenciones

- Naming: [Tus reglas]
- File structure: [Tu estructura]
- Git workflow: [Tu proceso]
```

---

## 3. Personalización Avanzada

### A. Crear Agentes Personalizados

**Ejemplo: Agent de UI/UX**

```typescript
// agents/swarm/agents/ux-agent.ts
import { BaseAgent } from "./base-agent";

export class UXAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    this.updateProgress(10, "Validating UX guidelines...");

    // Validar click budget
    const clickBudget = await this.validateClickBudget();

    // Validar accesibilidad
    const a11y = await this.validateAccessibility();

    // Validar responsive
    const responsive = await this.validateResponsive();

    this.updateTask("COMPLETED", {
      clickBudget,
      a11y,
      responsive,
    });
  }

  private async validateClickBudget(): Promise<any> {
    // Tu lógica específica
  }
}
```

**Agregar a agents-config.ts:**

```typescript
{
  role: 'UX',
  name: 'UX Validator',
  emoji: '🎨',
  description: 'Valida UX guidelines y accesibilidad',
  capabilities: [
    'Click budget validation',
    'A11y compliance (WCAG 2.1)',
    'Responsive design check',
    'Design system adherence'
  ],
  dependencies: ['DEVELOPER']
}
```

### B. Integración con CI/CD

**GitHub Actions:**

```yaml
# .github/workflows/swarm-validation.yml
name: Swarm Validation

on:
  pull_request:
    branches: [main, develop]

jobs:
  swarm-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install Dependencies
        run: npm ci

      - name: Run Swarm Validation
        run: npm run swarm:validate -- "${{ github.event.pull_request.title }}"

      - name: Upload Swarm Report
        uses: actions/upload-artifact@v3
        with:
          name: swarm-report
          path: agents/swarm/sessions/
```

### C. Webhooks y Notificaciones

**Slack Integration:**

```typescript
// agents/swarm/integrations/slack.ts
export async function notifySlack(session: SwarmSession) {
  const webhook = process.env.SLACK_WEBHOOK_URL;

  await fetch(webhook, {
    method: "POST",
    body: JSON.stringify({
      text: `🚀 Swarm Session Completed: ${session.featureName}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Feature:* ${session.featureName}\n*Status:* ${session.status}\n*Progress:* ${session.progress}%`,
          },
        },
      ],
    }),
  });
}
```

---

## 4. Potenciación del Sistema

### 🔥 Nivel 1: Mejoras Inmediatas

#### **1. Auto-fix Inteligente**

```typescript
// agents/swarm/agents/auto-fixer-agent.ts
export class AutoFixerAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Auto-fix común de errores
    await this.fixEslintErrors();
    await this.fixImports();
    await this.formatCode();
    await this.updateDependencies();
  }

  private async fixEslintErrors(): Promise<void> {
    execSync("npx eslint --fix .");
  }

  private async fixImports(): Promise<void> {
    // Organizar imports automáticamente
    execSync("npx organize-imports-cli");
  }
}
```

#### **2. Documentación Automática**

```typescript
// agents/swarm/agents/docs-agent.ts
export class DocsAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Generar README automático
    await this.generateReadme();

    // Generar API docs
    await this.generateApiDocs();

    // Generar changelog
    await this.generateChangelog();
  }
}
```

#### **3. Visual Regression Testing**

```typescript
// agents/swarm/agents/visual-regression-agent.ts
export class VisualRegressionAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Capturar screenshots antes/después
    const before = await this.captureScreenshots();

    // Ejecutar cambios
    // ...

    const after = await this.captureScreenshots();

    // Comparar y reportar diferencias
    const diff = await this.compareScreenshots(before, after);
  }
}
```

### 🚀 Nivel 2: Integraciones Avanzadas

#### **1. AI-Powered Code Review**

```typescript
// Integración con Claude API
import Anthropic from "@anthropic-ai/sdk";

export class AIReviewerAgent extends BaseAgent {
  private claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  protected async execute(): Promise<void> {
    const files = await this.getModifiedFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");

      const review = await this.claude.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Review this code for:
          - Security issues
          - Performance problems
          - Best practices
          - Potential bugs

          Code:
          ${content}`,
          },
        ],
      });

      this.log(`AI Review: ${review.content[0].text}`);
    }
  }
}
```

#### **2. Dependency Health Check**

```typescript
export class DependencyHealthAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Check outdated packages
    const outdated = await this.checkOutdated();

    // Check security vulnerabilities
    const vulns = await this.checkVulnerabilities();

    // Check license compatibility
    const licenses = await this.checkLicenses();

    // Suggest updates
    await this.suggestUpdates(outdated, vulns);
  }
}
```

#### **3. Performance Monitoring**

```typescript
export class PerformanceAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Run Lighthouse
    const lighthouse = await this.runLighthouse();

    // Check bundle size
    const bundleSize = await this.checkBundleSize();

    // Analyze Core Web Vitals
    const webVitals = await this.analyzeWebVitals();

    // Fail if performance regression
    if (lighthouse.performance < 90) {
      throw new Error("Performance regression detected!");
    }
  }
}
```

### ⚡ Nivel 3: Automatización Total

#### **1. Auto-Deploy con Swarm**

```typescript
// agents/swarm/agents/deployer-agent.ts
export class DeployerAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Pre-deployment checks
    await this.runPreDeploymentChecks();

    // Build
    await this.build();

    // Deploy to staging
    await this.deployToStaging();

    // Run smoke tests
    await this.runSmokeTests();

    // Deploy to production (if approved)
    if (this.isApproved()) {
      await this.deployToProduction();
    }
  }
}
```

#### **2. Self-Healing System**

```typescript
export class SelfHealingAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Detectar errores comunes
    const errors = await this.detectErrors();

    for (const error of errors) {
      // Intentar auto-fix
      const fixed = await this.attemptFix(error);

      if (!fixed) {
        // Crear issue automático
        await this.createIssue(error);

        // Notificar equipo
        await this.notifyTeam(error);
      }
    }
  }
}
```

#### **3. Continuous Learning**

```typescript
export class LearningAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    // Analizar patrones de errores
    const patterns = await this.analyzeErrorPatterns();

    // Actualizar reglas automáticamente
    await this.updateRules(patterns);

    // Mejorar sugerencias
    await this.improveSuggestions();

    // Guardar aprendizajes
    await this.saveInsights();
  }
}
```

---

## 5. Mejores Prácticas

### ✅ DO's (Hacer)

1. **Versionado del Swarm**

   ```bash
   git tag swarm-v1.0.0
   ```

2. **Backup de Sesiones**

   ```typescript
   // Guardar sesiones en base de datos
   await db.swarmSessions.create({
     sessionId: session.id,
     data: session,
   });
   ```

3. **Logs Estructurados**

   ```typescript
   this.log(
     JSON.stringify({
       level: "info",
       agent: this.role,
       action: "validation",
       result: "passed",
     }),
   );
   ```

4. **Métricas y Analytics**

   ```typescript
   // Track performance
   analytics.track("swarm_execution", {
     featureName: session.featureName,
     duration: endTime - startTime,
     agentsExecuted: session.tasks.length,
     success: session.status === "completed",
   });
   ```

5. **Testing del Swarm**
   ```typescript
   // tests/swarm/swarm.test.ts
   describe("Swarm System", () => {
     it("should complete basic feature", async () => {
       const session = await swarmManager.createSession("Test Feature");
       // ... test logic
     });
   });
   ```

### ❌ DON'Ts (Evitar)

1. ❌ No hardcodear rutas absolutas
2. ❌ No ejecutar operaciones destructivas sin confirmación
3. ❌ No ignorar errores críticos de seguridad
4. ❌ No hacer commits automáticos sin revisión
5. ❌ No exponer secrets en logs

---

## 6. Configuración por Entorno

### Development

```typescript
// config/swarm.dev.ts
export const swarmConfig = {
  autoFix: true,
  strictMode: false,
  notifications: false,
  dryRun: false,
};
```

### Staging

```typescript
// config/swarm.staging.ts
export const swarmConfig = {
  autoFix: true,
  strictMode: true,
  notifications: true,
  dryRun: false,
};
```

### Production

```typescript
// config/swarm.prod.ts
export const swarmConfig = {
  autoFix: false,
  strictMode: true,
  notifications: true,
  dryRun: true, // Requiere aprobación manual
  requireApproval: true,
};
```

---

## 7. Plantillas de Agentes

### Plantilla Base para Crear Nuevos Agentes

```typescript
// agents/swarm/agents/template-agent.ts
import { BaseAgent } from "./base-agent";
import { swarmManager } from "../swarm-manager";

export class TemplateAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    const session = swarmManager.loadSession(this.sessionId);
    if (!session) throw new Error("Session not found");

    // Paso 1: Inicialización
    this.updateProgress(10, "Starting...");

    // Paso 2: Ejecución principal
    this.updateProgress(50, "Processing...");
    const result = await this.doWork();

    // Paso 3: Validación
    this.updateProgress(80, "Validating...");
    await this.validate(result);

    // Paso 4: Finalización
    this.updateProgress(100, "Completed");
    this.updateTask("COMPLETED", { result });
  }

  private async doWork(): Promise<any> {
    // Tu lógica aquí
    return {};
  }

  private async validate(result: any): Promise<void> {
    // Validación
    if (!result) {
      throw new Error("Validation failed");
    }
  }
}
```

---

## 8. Recursos Adicionales

### Scripts Útiles

```bash
# Limpar sesiones antiguas
npm run swarm:cleanup

# Exportar sesión a PDF
npm run swarm:export <session-id>

# Ver estadísticas
npm run swarm:stats

# Replay de sesión
npm run swarm:replay <session-id>
```

### Documentación Recomendada

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 📞 Soporte

Si tienes problemas replicando el sistema:

1. Revisa los logs en `agents/swarm/sessions/`
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que los scripts en package.json sean correctos
4. Consulta AGENTS.md para lineamientos específicos

---

**¡Éxito replicando tu AI Swarm System! 🚀**

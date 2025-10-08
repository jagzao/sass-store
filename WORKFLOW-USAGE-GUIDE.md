# Guía de Uso del Workflow de Automatización

## Descripción General

El sistema de workflow de Sass Store implementa automatización completa para el desarrollo de software, incluyendo subagentes especializados, alertas visuales, recuperación automática y solución de errores automatizada.

## Características Principales

### 1. **Subagentes Especializados**

- **failure-triager**: Analiza fallos y determina el tipo de error
- **patcher-frontend**: Soluciona errores de frontend (React, Next.js, CSS)
- **patcher-backend**: Corrige problemas de backend (API, base de datos, lógica de servidor)
- **patcher-infra**: Maneja errores de infraestructura (Docker, networking, deployment)

### 2. **Sistema de Alertas y Colorización**

- **Colores ANSI por rol**:
  - UI (Frontend): Magenta
  - API (Backend): Verde
  - QA (Testing): Amarillo
  - SEO (Marketing): Azul
- **Alertas rojas con beeps** para errores críticos
- **Archivos de instrucción** generados automáticamente

### 3. **Auto-resumición Programada**

- **Ventanas de tiempo**: 02:00, 07:00, 13:00, 19:00
- **Manejo de límites de tokens** con pausa automática
- **Estado de bundles** persistente entre ejecuciones

### 4. **Auto-solución de Errores**

- **Detección automática** de tipos de error
- **Aplicación de parches** según el tipo detectado
- **Reintentos inteligentes** con límites configurables

## Cómo Usar el Workflow

### Iniciar un Workflow

```bash
# Desde el directorio raíz del proyecto
npm run workflow:start

# O usando el script directo
./scripts/workflow.sh
```

### Comandos Principales

```bash
# Ver estado de todos los bundles
npm run bundles:status

# Limpiar bundles antiguos
npm run bundles:cleanup

# Forzar resumición de bundles en espera
npm run bundles:resume

# Ver logs del workflow
npm run workflow:logs
```

### Estructura de Archivos

```
├── tools/
│   ├── autoresume.ts      # Sistema de auto-resumición
│   ├── alerts.ts          # Manejo de alertas visuales
│   ├── logger.ts          # Logger con colores ANSI
│   └── bundles.ts         # Gestión de estado de bundles
├── agents/
│   ├── failure-triager/   # Agente de análisis de fallos
│   ├── patcher-frontend/  # Agente de parches frontend
│   ├── patcher-backend/   # Agente de parches backend
│   └── patcher-infra/     # Agente de parches infraestructura
└── manifest.json          # Estado global del workflow
```

## Estados de Bundle

### Estados Posibles

- **running**: Ejecutándose actualmente
- **waiting_for_tokens**: Pausado por límite de tokens
- **completed**: Completado exitosamente
- **failed**: Falló después de agotar reintentos
- **paused**: Pausado manualmente

### Campos Importantes

```typescript
interface BundleState {
  id: string; // ID único del bundle
  session: string; // ID de sesión
  agent: string; // Agente asignado
  task: string; // Descripción de la tarea
  status: string; // Estado actual
  resume_at?: string; // Cuándo resumir (ISO date)
  next_cmd?: string; // Próximo comando a ejecutar
  retries: number; // Intentos realizados
  max_retries: number; // Máximo de intentos
  artifacts: string[]; // Archivos generados
}
```

## Configuración Avanzada

### Configuración Global

```typescript
{
  "timezone": "America/Mexico_City",
  "max_retries": 2,
  "auto_resume": true
}
```

### Ventanas de Auto-resumición

```typescript
const RESUME_WINDOWS = ["02:00", "07:00", "13:00", "19:00"];
```

### Tipos de Alerta

```typescript
enum AlertType {
  CRITICAL = "critical", // Rojo con beep
  WARNING = "warning", // Amarillo
  INFO = "info", // Azul
  SUCCESS = "success", // Verde
}
```

## Ejemplos de Uso

### 1. Workflow Básico

```bash
# Iniciar desarrollo con workflow automático
npm run dev

# El workflow detectará errores automáticamente
# y aplicará parches según el tipo de error
```

### 2. Manejo Manual de Bundles

```bash
# Ver bundles actuales
npm run bundles:list

# Pausar un bundle específico
npm run bundles:pause [bundle-id]

# Resumir bundle pausado
npm run bundles:resume [bundle-id]

# Marcar bundle como fallido
npm run bundles:fail [bundle-id] "Razón del fallo"
```

### 3. Debugging del Workflow

```bash
# Ver logs con colores
npm run workflow:logs --color

# Ver estado detallado
npm run workflow:status --verbose

# Limpiar estado corrupto
npm run workflow:reset
```

## Integración con Desarrollo

### Durante el Desarrollo

1. **Detección automática** de errores en compilación
2. **Asignación de agente** según tipo de error detectado
3. **Aplicación de parches** automática
4. **Notificación visual** del progreso

### En CI/CD

1. **Ejecución en contenedores** Docker
2. **Reportes de estado** en tiempo real
3. **Artifacts de debug** generados automáticamente
4. **Integración con herramientas** de monitoreo

## Monitoreo y Alertas

### Métricas Importantes

- **Tasa de éxito** de auto-resolución
- **Tiempo promedio** de resolución
- **Tipos de error** más frecuentes
- **Carga de trabajo** por agente

### Archivos de Log

```
├── logs/
│   ├── workflow.log           # Log principal del workflow
│   ├── agents/               # Logs por agente
│   │   ├── failure-triager.log
│   │   ├── patcher-frontend.log
│   │   ├── patcher-backend.log
│   │   └── patcher-infra.log
│   └── alerts/               # Archivos de alerta
│       ├── critical-YYYYMMDD.log
│       └── instructions-YYYYMMDD.md
```

## Solución de Problemas

### Errores Comunes

1. **Bundle bloqueado**

   ```bash
   npm run bundles:unlock [bundle-id]
   ```

2. **Límite de tokens alcanzado**

   ```bash
   # Se maneja automáticamente, esperar próxima ventana
   # o configurar manualmente:
   npm run workflow:set-resume [bundle-id] [timestamp]
   ```

3. **Agente no responde**

   ```bash
   npm run agents:restart [agent-name]
   ```

4. **Estado corrupto**
   ```bash
   npm run workflow:reset --force
   ```

### Comandos de Diagnóstico

```bash
# Verificar integridad del sistema
npm run workflow:health-check

# Ver estadísticas de rendimiento
npm run workflow:stats

# Exportar estado para soporte
npm run workflow:export-state
```

## Mejores Prácticas

### Para Desarrolladores

1. **Revisar logs** regularmente para entender patrones de error
2. **Configurar alertas** personalizadas para proyectos específicos
3. **Usar bundles descriptivos** para mejor trazabilidad
4. **Mantener limpio** el directorio de artifacts

### Para DevOps

1. **Monitorear métricas** de auto-resolución
2. **Configurar backup** de estado de bundles
3. **Ajustar ventanas** de resumición según carga de trabajo
4. **Implementar cleanup** automático de logs antiguos

### Para QA

1. **Validar parches** aplicados automáticamente
2. **Reportar falsos positivos** para mejorar detección
3. **Documentar casos edge** no cubiertos
4. **Mantener casos de prueba** actualizados

## API de Extensión

### Crear Agente Personalizado

```typescript
import { Agent } from "./tools/agent-base";

class CustomAgent extends Agent {
  async process(task: string): Promise<string> {
    // Implementar lógica personalizada
    return "resultado";
  }
}
```

### Registrar Tipo de Error Personalizado

```typescript
import { ErrorDetector } from "./tools/error-detector";

ErrorDetector.registerPattern({
  name: "custom-error",
  pattern: /Custom Error: (.+)/,
  agent: "custom-agent",
  priority: 10,
});
```

## Recursos Adicionales

- **Documentación de API**: `./docs/api/`
- **Ejemplos de configuración**: `./examples/`
- **Tests de integración**: `./tests/workflow/`
- **Métricas en tiempo real**: `http://localhost:3001/workflow/dashboard`

---

Para soporte técnico o reportar bugs, crear un issue en el repositorio del proyecto.

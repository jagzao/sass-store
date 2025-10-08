# 🐝 Swarm Development System

Sistema de desarrollo colaborativo multi-agente para automatizar el ciclo completo de features.

## 🎯 ¿Qué es Swarm?

Swarm es un sistema orquestado de agentes especializados que trabajan juntos para:

- Validar arquitectura
- Generar código
- Ejecutar tests
- Revisar calidad
- Preparar deployment

## 🚀 Inicio Rápido

### Iniciar una nueva feature

```bash
npm run swarm:start "Nombre de la Feature"
```

Ejemplo:

```bash
npm run swarm:start "Carrito de Compras"
```

### Ver estado actual

```bash
npm run swarm:status
```

### Reanudar sesión pausada

```bash
npm run swarm:resume <session-id>
```

## 👥 Agentes Disponibles

### 🎯 Orchestrator

Coordina el flujo de trabajo entre todos los agentes.

### 🏗️ Architect

- Valida estructura de carpetas
- Analiza dependencias
- Verifica patrones de código
- Sugiere mejoras arquitectónicas

### 💻 Developer

- Genera código
- Crea componentes
- Implementa servicios
- Configura rutas

### 🧪 Tester

- Tests unitarios
- Tests de integración
- Tests E2E
- Reportes de cobertura

### 🔍 QA

- Auditoría de accesibilidad
- Análisis de performance
- Validación de UX
- Scanning de seguridad

### 👀 Reviewer

- Code review automático
- Verificación de documentación
- Compliance con estándares
- Sugerencias de refactoring

### 🚀 Deployer

- Verificación de build
- Optimización de bundles
- Preparación de deployment
- Estrategia de rollback

## 📊 Workflow

```
┌─────────────┐
│ ORCHESTRATOR│ ← Coordina todo
└──────┬──────┘
       │
       ├─► 🏗️ ARCHITECT  ─► Valida estructura
       │
       ├─► 💻 DEVELOPER  ─► Implementa código
       │
       ├─► 🧪 TESTER     ─► Ejecuta tests
       │   🔍 QA         ─► Valida calidad (en paralelo)
       │
       ├─► 👀 REVIEWER   ─► Revisa código
       │
       └─► 🚀 DEPLOYER   ─► Prepara deploy
```

## 🔄 Integración con Orquestador

Si el swarm se queda sin tokens:

1. Automáticamente pausa la sesión
2. Crea un bundle en el sistema de workflow
3. Programa la reanudación
4. Cuando haya tokens disponibles, continúa automáticamente

Ver estado del orquestador:

```bash
npm run workflow:status
```

## 📁 Estructura de Archivos

```
agents/swarm/
├── types.ts                    # Tipos TypeScript
├── agents-config.ts            # Configuración de agentes
├── swarm-manager.ts            # Gestor de sesiones
├── swarm-orchestrator.ts       # Integración con bundles
├── agents/
│   ├── base-agent.ts          # Clase base
│   ├── architect-agent.ts     # Agente arquitecto
│   ├── developer-agent.ts     # Agente developer
│   └── tester-agent.ts        # Agente tester
├── cli/
│   ├── ui.ts                  # Componentes UI
│   ├── status.ts              # Comando status
│   ├── start.ts               # Comando start
│   └── resume.ts              # Comando resume
└── sessions/                   # Sesiones guardadas
    └── swarm_*.json
```

## 🎨 Ejemplo de Output

```
┌──────────────────────────────────────────────────────────┐
│            NUEVA FEATURE: Carrito de Compras             │
└──────────────────────────────────────────────────────────┘

🎯 [ORCHESTRATOR] ████████████░░░░░░░░ 60%

🏗️  [ARCHITECT] Validando arquitectura...
   ✓ Estructura de carpetas correcta
   ✓ Sin violaciones críticas
   ℹ️  2 sugerencias de mejora
✓ Completado

💻 [DEVELOPER] Implementando feature...
   📁 Creando apps/web/features/cart/
   📁 Creando packages/core/cart-service/
   ✓ 12 archivos creados
✓ Completado

🧪 [TESTER] Ejecutando tests...
   ✓ 24/24 tests unitarios pasando
   ✓ 8/8 tests E2E pasando
   ✓ Cobertura: 87%
████████████████░░░░ 80%

────────────────────────────────────────────────────────────
📊 Progreso: 3/5 tareas completadas
⏱️  Iniciado: 2025-10-01 10:30:00
🔄 Actualizado: 2025-10-01 10:35:22
```

## 🔧 Configuración

Edita `agents/swarm/agents-config.ts` para:

- Modificar workflow
- Agregar/quitar agentes
- Configurar paralelización
- Ajustar capabilities

## 🆘 Troubleshooting

### No muestra ninguna sesión

```bash
# Verifica que no haya sesión activa
npm run swarm:status

# Inicia una nueva
npm run swarm:start "Test Feature"
```

### Sesión pausada por rate limit

```bash
# Ver estado del orquestador
npm run workflow:status

# El sistema reanudará automáticamente en la próxima ventana
# O puedes forzar la reanudación (si hay tokens):
npm run swarm:resume <session-id>
```

### Error de TypeScript

```bash
# Recompila con transpile-only
npm run swarm:status
```

## 🚧 Próximas Mejoras

- [ ] Agentes de QA, Reviewer y Deployer funcionales
- [ ] Ejecución paralela real de agentes
- [ ] Integración con Claude Code API
- [ ] Dashboard web para visualización
- [ ] Notificaciones por Discord/Slack
- [ ] Métricas y analytics
- [ ] Templates de features comunes

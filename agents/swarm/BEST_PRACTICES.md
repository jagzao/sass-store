# 🎯 Mejores Prácticas para Usar Swarm

## 🚀 Inicio Rápido (Sin Comillas)

### Opción 1: Nombres sin espacios (más rápido)

```bash
npm run swarm:start cart
npm run swarm:start auth-system
npm run swarm:start user-profile
```

### Opción 2: Con espacios (más legible)

```bash
npm run swarm:start "Carrito de Compras"
npm run swarm:start "Sistema de Autenticación"
```

## 🔄 Workflows Recomendados

### Workflow 1: Feature Completa (Recomendado)

```bash
# 1. Inicia en cualquier terminal
npm run swarm:start "Mi Feature"

# 2. El swarm te da instrucciones
# 3. Abres Claude Code y ejecutas lo que pide
# 4. Cuando termines, vuelves a terminal:
npm run swarm:continue <session-id> <task-id>

# 5. Repites hasta completar
```

### Workflow 2: Solo Validación Rápida

```bash
# Solo ejecutar Architect
npm run swarm:start "Quick Check"
# Solo completa la primera tarea y cancela
```

### Workflow 3: Desarrollo Manual con Tracking

```bash
# Inicia swarm pero tú decides qué hacer
npm run swarm:start "Custom Feature"

# Revisa qué pide cada agente
npm run swarm:status

# Hazlo a tu ritmo
# Continúa cuando quieras
npm run swarm:continue <session-id> <task-id>
```

## 🎨 Templates de Features Comunes

### E-commerce

```bash
npm run swarm:start cart
npm run swarm:start checkout
npm run swarm:start wishlist
```

### Auth

```bash
npm run swarm:start login
npm run swarm:start register
npm run swarm:start password-reset
```

### Admin

```bash
npm run swarm:start dashboard
npm run swarm:start analytics
npm run swarm:start user-management
```

## ⚡ Atajos y Aliases (Próximamente)

Puedes agregar estos a tu `~/.bashrc` o `~/.zshrc`:

```bash
# Aliases útiles
alias ss='npm run swarm:status'
alias sw='npm run swarm:start'
alias sc='npm run swarm:continue'
alias sr='npm run swarm:resume'

# Uso:
ss                          # Ver estado
sw "Mi Feature"             # Iniciar
sc session_id task_id       # Continuar
```

## 🔧 Configuración Recomendada

### En VS Code

Agrega a `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Swarm: Status",
      "type": "shell",
      "command": "npm run swarm:status",
      "problemMatcher": []
    },
    {
      "label": "Swarm: Start",
      "type": "shell",
      "command": "npm run swarm:start",
      "problemMatcher": []
    }
  ]
}
```

Luego: `Ctrl+Shift+P` → "Run Task" → "Swarm: Status"

## 📊 Cuándo Usar Cada Comando

### `npm run swarm:status`

- ✅ Ver progreso actual
- ✅ Saber qué tarea sigue
- ✅ Verificar si hay sesión activa
- ✅ Ver reportes generados

**Úsalo:** Siempre que no sepas qué hacer a continuación

### `npm run swarm:start`

- ✅ Iniciar nueva feature
- ✅ Crear estructura base
- ✅ Validar arquitectura antes de codear

**Úsalo:** Al comenzar cualquier feature nueva

### `npm run swarm:continue`

- ✅ Después de completar una tarea
- ✅ Para avanzar al siguiente agente
- ✅ Cuando termines lo que el agente pidió

**Úsalo:** Después de hacer lo que el agente te pidió

### `npm run swarm:resume`

- ✅ Reanudar sesión pausada por rate limit
- ✅ Continuar después de cerrar terminal
- ✅ Recuperar trabajo anterior

**Úsalo:** Cuando el swarm se pausó automáticamente

## 🎯 Tips Pro

### 1. Naming Convention

```bash
# ❌ Evitar
npm run swarm:start "Implementar el carrito de compras con redux y validaciones"

# ✅ Mejor
npm run swarm:start "Cart Implementation"
npm run swarm:start cart
```

### 2. Revisa el Status Antes de Continuar

```bash
npm run swarm:status    # Ver qué falta
npm run swarm:continue <session-id> <task-id>
```

### 3. Guarda el Session ID

```bash
# Cuando inicias, el swarm muestra:
# ✓ Sesión creada: swarm_1234567_abc123

# Guárdalo en un archivo temporal:
echo "swarm_1234567_abc123" > .swarm-session
```

### 4. Usa el Orquestador para Tareas Largas

```bash
# Si una tarea va a tomar horas:
npm run workflow:status  # Verifica ventanas de ejecución

# El swarm se pausará automáticamente si te quedas sin tokens
# y se reanudará en la próxima ventana (2AM, 7AM, 1PM, 7PM)
```

## 🚨 Troubleshooting Común

### No aparece sesión activa

```bash
npm run swarm:status
# Si dice "Sin sesión activa"
npm run swarm:start "Nueva Feature"
```

### Olvidé el Session ID

```bash
# Busca en el directorio de sesiones:
ls agents/swarm/sessions/
# El archivo más reciente es tu sesión activa
```

### El agente pide algo que no entiendo

```bash
# Lee el archivo de prompt:
cat agents/swarm/prompts/architect-*.json

# O pregúntame directamente en Claude Code:
# "Qué quiere decir el Architect Agent con X?"
```

### Quiero cancelar una sesión

```bash
# Simplemente inicia otra:
npm run swarm:start "Nueva Feature"
# La anterior queda pausada, no se pierde
```

## 🎨 Personalización

### Modificar comportamiento de agentes

Edita: `agents/swarm/agents-config.ts`

### Cambiar workflow

Edita: `agents/swarm/agents-config.ts` → `SWARM_CONFIG.workflow`

### Agregar nuevos agentes

1. Crea `agents/swarm/agents/mi-agente.ts`
2. Agrégalo a `agents-config.ts`
3. Actualiza el workflow

## 📈 Métricas (Próximamente)

```bash
# Ver estadísticas de uso
npm run swarm:metrics

# Output esperado:
# 📊 Features completadas: 12
# ⏱️  Tiempo promedio: 45 min
# 🎯 Tasa de éxito: 92%
```

## 🔗 Recursos

- 📖 [README principal](README.md)
- 🏗️ [Configuración de agentes](agents-config.ts)
- 📋 [Templates de prompts](prompts/)
- 📊 [Reportes generados](outputs/)

# Plan de Implementación: Swarm Architecture & Memory Protocol

## Resumen Ejecutivo

Este documento detalla el plan para adaptar e implementar el **Swarm Architecture & Memory Protocol** en el proyecto sass-store, integrándolo con la estructura `.agents/` existente.

---

## 1. Estado Actual vs. Estado Deseado

### Estructura Actual (✅ Existe)
```
.agents/
├── memory/
│   ├── context_be.md        # Reglas Backend
│   └── context_shared.md    # Reglas DTOs/Modelos
├── session/
│   └── current_task.md      # Tarea actual
├── history/
│   ├── debug_logs.md        # Errores pasados
│   └── test_cases.md        # Casos borde
└── skills/
    └── definition.json      # Skills disponibles
```

### Estructura Objetivo (🔄 A Implementar)
```
.agents/
├── SYSTEM_PROMPT.md         # 🆕 Protocolo central del agente
├── memory/
│   ├── context_be.md        # ✏️ Mejorado con directivas multitenancy
│   ├── context_shared.md    # ✅ Sin cambios
│   └── context_frontend.md  # 🆕 Reglas Frontend (opcional)
├── session/
│   ├── current_task.md      # ✏️ Formato ciclo de ejecución
│   └── active_context.json  # 🆕 Contexto serializable para tools
├── history/
│   ├── debug_logs.md        # ✏️ Formato estructurado [Error→Causa→Solución→Prevención]
│   ├── test_cases.md        # ✏️ Categorizado por módulo
│   └── decisions.md         # 🆕 ADRs (Architecture Decision Records)
├── skills/
│   ├── definition.json      # ✏️ Con skills de debugging y testing
│   └── interface-design/    # ✅ Existente
└── protocols/
    ├── validation.md        # 🆕 Protocolo de validación de cambios
    ├── multitenancy.md      # 🆕 Checklist multitenancy
    └── testing.md           # 🆕 Protocolo de testing obligatorio
```

---

## 2. Archivos a Crear

### 2.1 SYSTEM_PROMPT.md (Prioridad: CRÍTICA)
**Ubicación:** `.agents/SYSTEM_PROMPT.md`

**Contenido:**
- Definición del rol: Ingeniero Senior Fullstack Multi-tenant
- Protocolo de memoria obligatorio (lectura antes de actuar)
- Ciclo de ejecución con autocorrección
- Directrices técnicas específicas
- Formato de documentación

**Tamaño estimado:** ~150 líneas

---

### 2.2 protocols/validation.md (Prioridad: ALTA)
**Ubicación:** `.agents/protocols/validation.md`

**Contenido:**
- Checklist pre-commit
- Validación de impacto multitenant
- Tests obligatorios por tipo de cambio
- Criterios de aceptación

---

### 2.3 protocols/multitenancy.md (Prioridad: ALTA)
**Ubicación:** `.agents/protocols/multitenancy.md`

**Contenido:**
- Reglas de aislamiento por tenant
- Validación de tenantId en cada operación
- Prevención de data leakage
- RLS checklist

---

### 2.4 protocols/testing.md (Prioridad: ALTA)
**Ubicación:** `.agents/protocols/testing.md`

**Contenido:**
- Tests obligatorios antes de commit
- Cobertura mínima por módulo
- Protocolo de test fixtures
- Integración con CI/CD

---

### 2.5 history/decisions.md (Prioridad: MEDIA)
**Ubicación:** `.agents/history/decisions.md`

**Contenido:**
- Template para ADRs
- Decisiones arquitectónicas registradas
- Historial de cambios estructurales

---

### 2.6 session/active_context.json (Prioridad: BAJA)
**Ubicación:** `.agents/session/active_context.json`

**Contenido:**
- Contexto serializable para herramientas externas
- Estado de sesión persistente
- Cache de decisiones recientes

---

## 3. Archivos a Modificar

### 3.1 memory/context_be.md
**Cambios:**
- Agregar sección "Protocolo de Memoria Obligatorio"
- Incorporar checklist de multitenancy más estricto
- Añadir referencias al SYSTEM_PROMPT.md
- Incluir formato de logging estructurado

---

### 3.2 session/current_task.md
**Cambios:**
- Nuevo formato con ciclo de ejecución:
  1. Objetivo
  2. Planificación (pasos técnicos)
  3. Estado de ejecución
  4. Errores encontrados
  5. Soluciones aplicadas
  6. Verificación final
- Template reutilizable

---

### 3.3 history/debug_logs.md
**Cambios:**
- Formato estructurado obligatorio:
  ```markdown
  ### [Fecha] - [Título del Error]
  
  | Campo | Valor |
  |-------|-------|
  | Error | Descripción del síntoma |
  | Causa Raíz | Análisis profundo |
  | Solución | Pasos aplicados |
  | Prevención | Cómo evitar recurrencia |
  | Referencia | Archivo/PR/Comando |
  | Tests | Comandos que validan el fix |
  ```
- Agregar índice de errores por categoría

---

### 3.4 history/test_cases.md
**Cambios:**
- Categorizar por módulo:
  - `#auth` - Autenticación y autorización
  - `#multitenancy` - Aislamiento de tenants
  - `#result-pattern` - Manejo de errores
  - `#bookings` - Sistema de reservas
  - `#finance` - Módulo financiero
  - `#social` - Social media
  - `#ecommerce` - E-commerce/POS
- Agregar prioridad (P1/P2/P3)

---

### 3.5 skills/definition.json
**Cambios:**
- Agregar skill `debug-agent`:
  ```json
  {
    "id": "debug-agent",
    "scope": "project-local",
    "enabled": true,
    "purpose": "Protocolo de debugging con memoria persistente",
    "useWhen": ["test fallido", "error en producción", "comportamiento inesperado"]
  }
  ```
- Agregar skill `test-generator`:
  ```json
  {
    "id": "test-generator",
    "scope": "project-local",
    "enabled": true,
    "purpose": "Generar tests basados en casos borde documentados",
    "useWhen": ["nuevo feature", "regresión detectada", "aumentar cobertura"]
  }
  ```

---

## 4. Orden de Implementación

### Fase 1: Fundamentos (Día 1)
1. [ ] Crear `.agents/SYSTEM_PROMPT.md`
2. [ ] Crear `.agents/protocols/validation.md`
3. [ ] Crear `.agents/protocols/multitenancy.md`

### Fase 2: Mejoras (Día 2)
4. [ ] Actualizar `.agents/memory/context_be.md`
5. [ ] Actualizar `.agents/session/current_task.md`
6. [ ] Actualizar `.agents/history/debug_logs.md`

### Fase 3: Completitud (Día 3)
7. [ ] Actualizar `.agents/history/test_cases.md`
8. [ ] Crear `.agents/protocols/testing.md`
9. [ ] Actualizar `.agents/skills/definition.json`

### Fase 4: Opcionales (Futuro)
10. [ ] Crear `.agents/history/decisions.md`
11. [ ] Crear `.agents/session/active_context.json`
12. [ ] Crear `.agents/memory/context_frontend.md`

---

## 5. Validación de Implementación

### Checklist de Aceptación
- [ ] SYSTEM_PROMPT.md existe y contiene el protocolo completo
- [ ] Los 3 protocolos existen en `.agents/protocols/`
- [ ] `context_be.md` tiene referencias cruzadas al SYSTEM_PROMPT
- [ ] `current_task.md` tiene el formato de ciclo de ejecución
- [ ] `debug_logs.md` tiene al menos 1 ejemplo con el nuevo formato
- [ ] `test_cases.md` está categorizado con hashtags
- [ ] `definition.json` tiene las 2 nuevas skills

### Comando de Verificación
```bash
# Verificar estructura completa
tree .agents -L 2

# Validar que todos los archivos existen
node -e "
const fs = require('fs');
const files = [
  '.agents/SYSTEM_PROMPT.md',
  '.agents/protocols/validation.md',
  '.agents/protocols/multitenancy.md',
  '.agents/protocols/testing.md'
];
files.forEach(f => console.log(f, fs.existsSync(f) ? '✅' : '❌'));
"
```

---

## 6. Mantenimiento Post-Implementación

### Actualizaciones Requeridas
- **Por sesión:** Actualizar `current_task.md`
- **Por error:** Agregar entrada en `debug_logs.md`
- **Por feature:** Actualizar `test_cases.md` si hay nuevos casos borde
- **Por decisión arquitectónica:** Agregar ADR en `decisions.md`

### Review Periódico
- **Semanal:** Revisar `debug_logs.md` para patrones de errores
- **Mensual:** Auditar `test_cases.md` para completitud
- **Por sprint:** Validar que `SYSTEM_PROMPT.md` sigue siendo relevante

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Agentes no leen SYSTEM_PROMPT | Media | Alto | Incluir en AGENTS.md referencia obligatoria |
| Archivos muy grandes | Baja | Medio | Mantener archivos <500 líneas |
| Desincronización con código | Media | Medio | CI check que valide referencias |
| Formato inconsistente | Alta | Bajo | Templates en cada archivo |

---

## 8. Próximos Pasos Inmediatos

1. **Crear SYSTEM_PROMPT.md** - Es el archivo central que define el comportamiento
2. **Crear protocols/validation.md** - Establece los checks obligatorios
3. **Actualizar current_task.md** - Para empezar a usar el nuevo formato

---

*Documento creado: 2026-03-02*
*Última actualización: 2026-03-02*
*Estado: PENDIENTE DE APROBACIÓN*

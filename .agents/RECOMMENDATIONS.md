# Recomendaciones para Autonomía Total del Agente

> **Versión:** 1.0.0  
> **Fecha:** 2026-03-02  
> **Objetivo:** Lograr que el agente desarrolle features completas de forma autónoma

---

## 1. Arquitectura Implementada

### 1.1 Sistema de Memoria Persistente

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORIA DEL AGENTE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /memory/          → Reglas de oro (context_be, context_shared)│
│  /session/         → Estado actual (current_task)              │
│  /history/         → Aprendizajes (debug_logs, test_cases)     │
│  /skills/          → Capacidades (definition.json + SKILL.md)  │
│  /protocols/       → Procedimientos (validation, testing, etc) │
│                                                                 │
│  SYSTEM_PROMPT.md  → Comportamiento central del agente         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Autonomía

```
Usuario dice: "Implementa [X]"
        │
        ▼
┌───────────────────┐
│ 1. LEER MEMORIA   │ ← debug_logs, test_cases, context_be
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ 2. PLANIFICAR     │ → current_task.md con pasos
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ 3. DESARROLLAR    │ → Código siguiendo Result Pattern
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ 4. TESTEAR        │ → Unit → Integration → E2E
└────────┬──────────┘
         │
    ┌────┴────┐
    │ PASS?   │
    └────┬────┘
         │
    NO ──┼── YES
         │    │
         ▼    ▼
┌──────────┐ ┌───────────┐
│ CORREGIR │ │ DOCUMENTAR│
│ + LOOP   │ │ + VIDEO   │
└──────────┘ └───────────┘
```

---

## 2. Cómo Solicitar Features al Agente

### 2.1 Formato Óptimo de Pedido

```markdown
Implementa [NOMBRE DE FEATURE]

Requisitos:
- [Requisito 1]
- [Requisito 2]

Criterios de aceptación:
- [ ] [Criterio 1]
- [ ] [Criterio 2]

Incluir:
- Tests unitarios
- Tests E2E
- Video demo
```

### 2.2 Ejemplos de Pedidos Efectivos

**Ejemplo 1: Feature Simple**
```
Implementa un sistema de favoritos para productos

Requisitos:
- Usuario puede marcar/desmarcar productos como favoritos
- Lista de favoritos accesible desde el dashboard
- Contador de favoritos en el card del producto

Criterios:
- [ ] Toggle de favorito funciona
- [ ] Lista muestra todos los favoritos
- [ ] Contador se actualiza en tiempo real

Seguir protocolo autonomous-loop completo
```

**Ejemplo 2: Feature Compleja**
```
Implementa sistema de reservas recurrentes

Requisitos:
- Usuario puede crear reserva diaria/semanal/mensual
- Sistema genera instancias automáticamente
- Notificaciones antes de cada instancia
- Cancelación afecta instancia individual o todas

Criterios:
- [ ] Crear recurrencia con patrón válido
- [ ] Instancias se generan correctamente
- [ ] Cancelar una instancia no afecta otras
- [ ] Cancelar todas elimina recurrencia

Incluir:
- Migración de DB
- Tests unitarios (>80% cobertura)
- Tests de integración
- Tests E2E del flujo completo
- Video demo del proceso
```

### 2.3 Palabras Clave que Activan Autonomía

| Palabra Clave | Acción del Agente |
|---------------|-------------------|
| "Implementa" | Activa skill feature-developer |
| "con tests" | Incluye suite completa de tests |
| "con video" | Genera demo en video |
| "autónomo" | Ejecuta ciclo completo sin preguntar |
| "end-to-end" | Incluye tests E2E |

---

## 3. Configuración del Entorno

### 3.1 Prerrequisitos

```bash
# Verificar que todo está instalado
node --version    # >= 18
npm --version     # >= 9

# Instalar dependencias del proyecto
npm install

# Configurar base de datos de test
cp .env.example .env.test
# Editar .env.test con TEST_DATABASE_URL

# Verificar Playwright
npx playwright --version
npx playwright install chromium

# Verificar que tests corren
npm run test:unit
```

### 3.2 Variables de Entorno Requeridas

```env
# .env.local
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3001

# .env.test (para tests)
TEST_DATABASE_URL=postgresql://...
```

### 3.3 Scripts Disponibles

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:subset": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:seed": "ts-node scripts/seed.ts",
    "demo:record": "ts-node tools/demo-recorder.ts"
  }
}
```

---

## 4. Mejores Prácticas para Autonomía

### 4.1 Para el Usuario

1. **Ser específico en los requisitos**
   - ✅ "Productos con precio entre $10 y $100"
   - ❌ "Productos baratos"

2. **Proporcionar contexto de negocio**
   - ✅ "Los clientes premium tienen 20% descuento"
   - ❌ "Aplicar descuento"

3. **Definir criterios de aceptación claros**
   - ✅ "Al hacer click, muestra confirmación antes de eliminar"
   - ❌ "Eliminar funciona bien"

4. **Especificar edge cases conocidos**
   - "Considera que un producto puede estar sin stock"

### 4.2 Para el Agente (Configurado en SYSTEM_PROMPT)

1. **Leer memoria antes de actuar**
   - Siempre leer debug_logs.md y test_cases.md primero

2. **Documentar mientras desarrolla**
   - Actualizar current_task.md en cada paso

3. **Validar frecuentemente**
   - lint + typecheck después de cada archivo
   - tests después de cada módulo

4. **Corregir en loop**
   - Máximo 5 intentos antes de escalar

5. **Generar entregable completo**
   - Código + Tests + Documentación + Video

---

## 5. Flujo de Trabajo Autónomo Completo

### 5.1 Secuencia de Comandos

```bash
# 1. Usuario solicita feature
# "Implementa sistema de cupones de descuento"

# 2. Agente lee memoria
# - Lee debug_logs.md (errores conocidos)
# - Lee test_cases.md (casos borde)
# - Lee context_be.md (reglas)

# 3. Agente planifica
# - Crea plan en current_task.md
# - Identifica archivos a crear/modificar

# 4. Agente desarrolla
# - Crea schema de DB
# - Crea servicio con Result Pattern
# - Crea API routes
# - Crea componentes UI

# 5. Agente testa
npm run test:unit      # Tests unitarios
npm run test:integration  # Tests de integración
npm run test:e2e       # Tests E2E

# 6. Si falla, corrige y repite
# - Documenta error en debug_logs.md
# - Corrige código
# - Re-ejecuta tests

# 7. Genera video demo
npm run demo:record cupones

# 8. Entrega completa
# - Código funcional
# - Tests pasando
# - Video demo en test-results/
# - current_task.md marcado COMPLETADO
```

### 5.2 Tiempo Estimado por Complejidad

| Complejidad | Archivos | Tests | Tiempo |
|-------------|----------|-------|--------|
| Simple | 3-5 | 5-10 | 30-60 min |
| Media | 5-10 | 10-20 | 60-120 min |
| Compleja | 10-20 | 20-40 | 120-240 min |

---

## 6. Troubleshooting de Autonomía

### 6.1 El agente se queda loop en correcciones

**Síntoma:** Más de 5 intentos sin pasar tests

**Solución:**
1. Revisar `current_task.md` para ver dónde se bloqueó
2. Leer el error en `debug_logs.md`
3. Intervenir manualmente si es problema de infraestructura
4. Documentar la solución para futuras ocasiones

### 6.2 Tests E2E fallan intermitentemente

**Síntoma:** Tests pasan local pero fallan en CI

**Solución:**
1. Agregar waits explícitos: `await page.waitForSelector()`
2. Usar `waitForLoadState('networkidle')`
3. Aumentar timeouts en CI
4. Mockear APIs externas

### 6.3 Video demo no se genera

**Síntoma:** Playwright no graba video

**Solución:**
```bash
# Verificar que chromium está instalado
npx playwright install chromium

# Ejecutar con flag de video
npx playwright test --video=on

# Verificar permisos de carpeta
chmod -R 755 test-results/
```

---

## 7. Integración con CI/CD

### 7.1 Pipeline Autónomo

```yaml
# .github/workflows/autonomous-feature.yml
name: Autonomous Feature Development

on:
  workflow_dispatch:
    inputs:
      feature_name:
        description: 'Nombre de la feature'
        required: true
      requirements:
        description: 'Requisitos en markdown'
        required: true

jobs:
  develop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Agent
        env:
          FEATURE_NAME: ${{ inputs.feature_name }}
          REQUIREMENTS: ${{ inputs.requirements }}
        run: |
          echo "Starting autonomous development..."
          # El agente tomaría el control aquí
          
      - name: Run Tests
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:e2e
          
      - name: Generate Demo Video
        run: npm run demo:record ${{ inputs.feature_name }}
        
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: feature-deliverable
          path: |
            test-results/
            coverage/
```

---

## 8. Próximos Pasos Recomendados

### 8.1 Inmediatos

1. **Probar el sistema con una feature simple**
   ```
   "Implementa un contador de visitas en productos con tests y video demo"
   ```

2. **Verificar que la memoria funciona**
   - Introducir un error intencional
   - Verificar que se documenta en debug_logs.md
   - Verificar que no se repite en siguiente intento

3. **Validar generación de videos**
   ```bash
   npm run demo:record bookings
   ```

### 8.2 Mediano Plazo

1. **Crear más skills específicas**
   - `api-developer` - Solo backend
   - `ui-developer` - Solo frontend
   - `db-migrator` - Solo base de datos

2. **Integrar con GitHub Issues**
   - Crear issue desde pedido de usuario
   - Actualizar issue con progreso
   - Cerrar issue al completar

3. **Sistema de métricas**
   - Tiempo promedio por feature
   - Tasa de éxito autónomo
   - Errores más frecuentes

### 8.3 Largo Plazo

1. **Agentes especializados en paralelo**
   - Agente de backend
   - Agente de frontend
   - Agente de QA

2. **Aprendizaje de patrones**
   - Detectar patrones en debug_logs
   - Sugerir refactorizaciones
   - Predecir errores

3. **Generación de documentación automática**
   - API docs desde código
   - User guides desde tests E2E
   - Diagramas de arquitectura

---

## 9. Comandos de Referencia Rápida

```bash
# Desarrollo
npm run dev                    # Iniciar servidor

# Validación
npm run lint && npm run typecheck && npm run build

# Tests
npm run test:unit              # Unitarios
npm run test:integration       # Integración
npm run test:e2e               # E2E completos
npm run test:e2e:subset -- --grep "feature"  # Subset

# DB
npm run db:generate            # Generar migración
npm run db:push                # Aplicar migración
npm run db:seed                # Poblar datos

# Demo
npm run demo:record [feature]  # Grabar video demo

# Memoria
cat .agents/session/current_task.md   # Ver estado actual
cat .agents/history/debug_logs.md     # Ver errores pasados
```

---

## 10. Contacto y Soporte

Si el agente no puede completar una tarea autónomamente:

1. Verificar `current_task.md` para ver dónde se bloqueó
2. Revisar `debug_logs.md` para errores documentados
3. Crear issue con label `agent-blocked`
4. Incluir:
   - Pedido original
   - Estado de current_task.md
   - Logs de error

---

*Este documento es la guía definitiva para lograr autonomía completa del agente.*

# Comando: valida-todo

Ejecuta el pipeline completo de validación iterativo y auto-corregible. Si un paso falla, se corrige y se re-ejecuta (máx 5 intentos). **Nunca reportar feature listo sin este pipeline limpio.**

## Trigger
```
valida todo
```

## Pipeline de Validación

### Paso 0: Análisis de Impacto
Detectar archivos modificados con `git diff --name-only HEAD~1` y determinar tests afectados.

### Paso 1: Formato
```bash
npx prettier --write "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}" "tests/**/*.{ts,tsx}"
```
Si falla: corregir configuración de Prettier o errores de sintaxis.

### Paso 2: Lint
```bash
npm run lint
```
Si falla: aplicar `npm run lint -- --fix`, luego revisión manual.

### Paso 3: Type Check
```bash
npm run typecheck
```
Si falla: corregir errores de TypeScript.

### Paso 4: Tests Unitarios
```bash
npm run test:unit
```
- Si hay timeouts de DB: verificar si es test legacy → migrar a MockDatabase o usar Docker Postgres.
- Si hay fallos lógicos: corregir servicio/API → re-ejecutar.

### Paso 5: Tests E2E
```bash
npm run test:e2e:subset -- --grep "[feature-name]"
```
- Si falla por timeout de servidor: aumentar timeout, no saltarse.
- Si falla por selector: corregir test o UI → re-ejecutar.

### Paso 6: Seguridad
```bash
npm run security:autofix
npm run test:security
```

### Paso 7: Cobertura
```bash
npx vitest run --coverage
```
Verificar ≥80% en archivos nuevos/modificados.

### Paso 8: Verificación Final
```bash
npm run build
```

## Ciclo de Autocorrección

```
Ejecutar paso N → ¿Falló?
  │
  ├── Sí → Corrección (auto-fix o manual)
  │        → Incrementar contador de intentos
  │        → ¿Intentos < 5?
  │           ├── Sí → Re-ejecutar paso N
  │           └── No → BLOQUEO: reportar al usuario
  │
  └── No → Pasar al paso N+1
```

## Comandos de Auto-Recovery

| Fallo | Comando de recovery |
|-------|--------------------|
| Timeout DB Supabase | Reintentar conexión (máx 3 veces) o migrar `.test.ts` a `.spec.ts` con mocks |
| `.test.ts` legacy fallando | Migrar a `.spec.ts` con mocks |
| `console.error` sin contexto | Reemplazar con `logResult()` |
| Selector E2E ambiguo | Actualizar `data-testid` o selector |
| Build timeout | Revisar imports circulares o tamaño de bundle |
| Servidor caído | Levantar automáticamente con `npm run dev` |

## Reglas de Oro

1. **Nunca declarar listo sin `npm run build` pasando.**
2. **Si E2E falla, corregir código, no saltar test.**
3. **Si hay `.test.ts` legacy fallando, migrarlos o excluirlos de suite.**
4. **Máximo 5 intentos de corrección por paso.**
5. **Si persisten errores después de 5 intentos → reportar bloqueo con contexto completo.**

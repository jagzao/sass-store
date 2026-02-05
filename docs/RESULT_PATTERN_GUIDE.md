# Patrón Result - Guía para Desarrolladores

## 📖 **Tabla de Contenidos**

1. [Visión General](#visión-general)
2. [Guía Rápida](#guía-rápida)
3. [Ejemplos de Uso](#ejemplos)
4. [Mejores Prácticas](#mejores-prácticas)
5. [Reference Completo](#referencia)
6. [Troubleshooting](#troubleshooting)

---

# 1. 🎯 Visión General

El patrón Result es un sistema funcional que reemplaza el manejo tradicional de excepciones (`try/catch`) con un enfoque más robusto, tipado y predecible para mejorar la calidad del código y la experiencia del desarrollador.

## 🎯 Objetivos del Patrón Result

- **Type Safety**: Garantizar que todos los errores se detecten en tiempo de compilación
- **Error Handling**: Proporcionar un manejo consistente de errores con tipos específicos del dominio
- **Composability**: Permitir encadenar operaciones de forma segura y legible
- **Testabilidad**: Facilitar la creación de pruebas unitarias y de integración
- **Mantenibilidad**: Escribir código auto-documentado y fácil de mantener

---

# 2. 📖 Guía Rápida de Referencia

## 🚀 Inicio Rápido

Para empezar a usar el patrón Result, sigue estos pasos fundamentales:

### **Paso 1: Importación**

```typescript
// Importaciones siempre al inicio
import { Result, Ok, Err, match } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
```

### **Paso 2: Crear un Result**

```typescript
// ✅ Éxito
const userResult = await getUser(id);

// ❌ Error con tipo específico
const userResult = Err(ErrorFactories.notFound("User", id));
```

### **Paso 3: Manejar el Result**

```typescript
// Pattern matching - preferido sobre if/else
const message = match(result, {
  ok: (user) => `Usuario ${user.name} encontrado`,
  err: (error) => `Error: ${error.message} (${error.type})`,
});

// Composición de operaciones
const result = await validateUser(data)
  .flatMap((user) => updateUser(user.id, user))
  .flatMap((updatedUser) => sendNotification(updatedUser))
  .map(() => ({ success: true, user: updatedUser }));
```

### **Paso 4: Middleware**

```typescript
// Para API routes
export const GET = withResultHandler(async (request) => {
  return await getUsers();
});

// Para validación
export const POST = withValidation(
  createSchema,
  async (request, validatedData) => {
    return await createUser(validatedData);
  },
);
```

---

# 3. 📋 Mejores Prácticas Esenciales

## 🎯 Principios Clave

### 1. **Siempre Retorna Result**

```typescript
// ❌ MAL: Funciones que lanzan excepciones
function getUser(id: string): User | null {
  try {
    return await db.user.findUnique(id);
  } catch (error) {
    return null;
  }
}

// ✅ BIEN: Siempre retorna Result
function getUser(id: string): Result<User, DomainError> {
  return fromPromise(db.user.findUnique(id));
}
```

### 2. **Usa Tipos de Error Específicos**

```typescript
// ❌ MAL: Error genérico
throw new Error("User not found");

// ✅ BIEN: Error tipado del dominio
return Err(ErrorFactories.notFound("User", id));
```

### 3. **Composición sobre Encadenamiento**

```typescript
// ❌ MAL: Anidación excesiva
try {
  const user = await getUser(id);
  const profile = await getProfile(user.id);
  const settings = await getSettings(user.id);
} catch (error) {
  return Err(...);
}

// ✅ BIEN: Composición fluida
return await getUser(id)
  .flatMap(user => getProfile(user.id))
  .flatMap(profile => getSettings(profile.id))
  .flatMap(settings => saveSettings(settings))
  .map(() => ({ success: true }));
```

### 4. **Manejo Estados Cargados Explícitamente**

```typescript
// ✅ BIEN: Estados explícitos en el tipo
const result: Result<User, DomainError>;
if (isSuccess(result)) {
  console.log("User loaded:", result.data.name);
}
if (isFailure(result)) {
  console.error("Error loading user:", result.error);
}
```

---

# 4. 📋 Errores Comunes y Soluciones

## 🚫 **Error: "Cannot find user"**

```typescript
// Problema: Código aún usa excepciones
try {
  const user = db.user.findUnique(id);
} catch (error) {
  throw error; // ❌ Lanza excepción no controlada
}

// Solución con Result Pattern
return Err(
  ErrorFactories.database(
    "find_user",
    `Failed to find user ${id}`,
    undefined,
    error,
  ),
);
```

## 🚫 **Error: "Unexpected error"**

```typescript
// Problema: Error no manejado adecuadamente
try {
  doSomething();
} catch (error) {
  return { success: false, error: "Server error" }; // ❌ Error genérico sin contexto
}

// Solución con Result Pattern
return Err(
  ErrorFactories.database(
    "operation_failed",
    "Operation failed with unexpected error",
    undefined,
    error instanceof Error ? error : new Error("Unexpected error"),
  ),
);
```

---

# 5. 📋 Testing con Result Pattern

### **Unit Tests**

```typescript
import { expectSuccess, expectFailure } from "@sass-store/core/src/result";

describe("User Service", () => {
  it("should return user when found", async () => {
    const result = await getUser("valid-id");
    expectSuccess(result).toEqual({
      id: "valid-id",
      name: "John Doe",
    });
  });

  it("should return NotFoundError when user missing", async () => {
    const result = await getUser("invalid-id");
    expectFailure(result).toEqual(
      expect.objectContaining({
        type: "NotFoundError",
      }),
    );
  });
});
```

---

# 6. 📚 Referencia Rápida

## 🎯 Funciones Core del Result Pattern

### **Constructores**

```typescript
Ok(data); // Crea un Result exitoso
Err(error); // Crea un Result con error

// Type Guards
isSuccess(result); // Verifica si es éxito
isFailure(result); // Verifica si es error
```

### **Combinators**

```typescript
map(result, fn); // Transforma datos en caso de éxito
flatMap(result, fn); // Encadena operaciones, corta en primer error
combine(...results); // Combina múltiples Results
pipe(result); // Crea interfaz fluida
```

### **Middlewares**

```typescript
withResultHandler(handler); // Maneja API routes automáticamente
withValidation(schema); // Valida request body
```

---

# 7. 📚 Recursos Adicionales

## 📚 Documentación y Herramientas

- **AGENTS.md**: Guía completa actualizada
- **JSDoc**: Tipos documentados
- **Type Definitions**: Referencia de todos los tipos de error
- **Code Examples**: Ejemplos prácticos en cada componente

---

# 8. 🎯 Formación y Capacitación

## 📖 Cursos Recomendados

1. **Foundational**: TypeScript y patrones funcionales
2. **Avanzado**: Result pattern y manejo de errores
3. **Práctico**: Testing driven development con Result pattern

## 📌 Linea de Soporte

Para ayuda técnica sobre implementación del patrón Result:

- **Slack**: Canal `#result-pattern-support`
- **Documentación**: Revisar AGENTS.md y referencias de este archivo
- **Code Review**: Pair programming sessions para revisar implementaciones

---

# 9. 🎯 Comenzar y Mejoras Continuas

## 📈 Roadmap Futuro

### **Corto Plazo (1-2 semanas)**

- Métricas de adopción del patrón Result
- Primeros 10 KPIs y objetivos medibles

### **Medio Plazo (1-3 meses)**

- Optimización de performance con patrones Result
- Integración con frontend frameworks

### **Largo Plazo (3-6 meses)**

- Métricas de calidad y rendimiento estables
- Documentación completa del patrón

---

# 10. 📈 Inicio

## 🚀 ¡Empieza a Usar el Patrón Result!

**Primeros Pasos:**

1. Revisar la [Guía Rápida](#guía-rápida)
2. Empezar con el [API Route más simple](#api-endpoint-básico)
3. Usar el [Performance Monitor](#performance-monitoring) para identificar mejoras

**Recuerda:** El patrón Result requiere un cambio de mentalidad de "catch-as-muchos-que-pueda" a "maneja-resultados-como-éxito". Requiere práctica inicialmente, pero paga dividendos enormes en mantenibilidad a futuro.

**¡Mucha suerte con el patrón Result!** 🎉

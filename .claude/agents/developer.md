# Agente Developer

## Misión

Implementar features de alta calidad para SASS-STORE siguiendo estándares del @architect.

## Stack Tecnológico

- **Frontend**: React, TypeScript, Tailwind
- **Backend**: Node.js, Hono, CloudFlare Workers
- **Database**: D1 (SQLite), KV Storage
- **APIs**: RESTful + GraphQL

## Principios de Desarrollo

### 1. Clean Code

- Nombres descriptivos
- Funciones pequeñas y enfocadas
- DRY (Don't Repeat Yourself)
- Comentarios solo cuando sea necesario

### 2. TypeScript Strict

```typescript
// Siempre tipar correctamente
interface UserData {
  id: string;
  email: string;
  role: "admin" | "user";
}

// Evitar 'any'
function processUser(user: UserData): void {
  // ...
}
```

### 3. Manejo de Errores

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", { error, context });
  throw new AppError("User-friendly message", { cause: error });
}
```

### 4. Validación de Inputs

```typescript
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const userData = userSchema.parse(input);
```

## Workflow de Implementación

1. **Leer especificación del @architect**
2. **Crear estructura de archivos**
3. **Implementar lógica de negocio**
4. **Agregar validaciones**
5. **Escribir tests unitarios**
6. **Documentar código complejo**

## Patrones Recomendados

### Repository Pattern

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Factory Pattern

```typescript
class ServiceFactory {
  createPaymentService(type: "stripe" | "paypal") {
    switch (type) {
      case "stripe":
        return new StripeService();
      case "paypal":
        return new PayPalService();
    }
  }
}
```

### Strategy Pattern

```typescript
interface PricingStrategy {
  calculate(base: number): number;
}

class SeasonalPricing implements PricingStrategy {
  calculate(base: number): number {
    return base * 0.8; // 20% discount
  }
}
```

## Checklist Pre-Commit

- [ ] Código compila sin errores
- [ ] Tests pasan localmente
- [ ] Sin console.log olvidados
- [ ] Sin código comentado
- [ ] Variables de entorno documentadas
- [ ] README actualizado si es necesario

## Anti-Patrones a Evitar

❌ God Objects (clases gigantes)
❌ Magic Numbers sin constantes
❌ Callbacks anidados (callback hell)
❌ Queries SQL sin prepared statements
❌ Credenciales hardcodeadas
❌ Código duplicado
❌ Funciones con >4 parámetros

## Convenciones de Naming

- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase
- **Types**: PascalCase
- **Archivos**: kebab-case.ts
- **Componentes**: PascalCase.tsx

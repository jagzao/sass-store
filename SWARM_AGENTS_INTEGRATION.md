# 🤖 Swarm Agents & Project Integration

## ❓ ¿Los agentes Swarm usan Husky y Redis?

### **Respuesta Corta: NO directamente, PERO deben considerarlos**

---

## 📋 Resumen Ejecutivo

Los agentes **QA** y **Developer** de Swarm **NO ejecutan automáticamente** los hooks de Husky ni las funciones de Redis en sus flujos. Sin embargo, **DEBEN estar conscientes** de estas herramientas cuando hacen modificaciones al código.

---

## 🔍 Explicación Detallada

### **1. Husky (Git Hooks)**

#### ¿Los agentes ejecutan Husky?

**NO**. Husky solo se ejecuta cuando hay operaciones de Git:

- `git commit` → ejecuta pre-commit hook (lint-staged)
- `git push` → ejecuta pre-push hook (typecheck)

#### ¿Los agentes deben considerarlo?

**SÍ**. Los agentes deben:

1. **Escribir código que pase los hooks**:
   - Código formateado (Prettier)
   - Sin errores de linting (ESLint)
   - Sin errores de TypeScript
2. **Probar antes de commit**:
   ```bash
   npm run lint
   npm run typecheck
   ```

#### Ejemplo de flujo:

```
Developer Agent modifica código
  ↓
Husky NO se ejecuta automáticamente
  ↓
Si el usuario hace git commit
  ↓
Husky ejecuta pre-commit → lint-staged
  ↓
Si hay errores → commit rechazado
```

### **Recomendación para agentes**:

```typescript
// Antes de hacer cambios, los agentes deben validar:
1. Formateo correcto (Prettier)
2. Sin errores de linting
3. TypeScript compilando correctamente
```

---

### **2. Redis (Caching)**

#### ¿Los agentes usan Redis?

**DEPENDE del tipo de cambio**:

#### **Escenario A: Cambios en lógica de negocio**

- **NO usan Redis directamente**
- PERO deben considerar invalidación de cache

**Ejemplo**:

```typescript
// ❌ INCORRECTO (agente modifica sin invalidar cache)
export async function updateProduct(id: string, data: any) {
  await db.update(products).set(data).where(eq(products.id, id));
  // FALTA: Invalidar cache del producto
}

// ✅ CORRECTO (agente considera Redis)
import { tenantCache } from "@/../../packages/cache/redis";

export async function updateProduct(id: string, data: any) {
  await db.update(products).set(data).where(eq(products.id, id));

  // Invalidar cache relacionado
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { tenant: true },
  });

  if (product) {
    await tenantCache.invalidate(product.tenant.slug);
  }
}
```

#### **Escenario B: Cambios en servicios de datos**

- **SÍ deben usar Redis** cuando modifican `tenant-service.ts` o similares

**Ejemplo**:

```typescript
// Developer Agent crea nuevo servicio de datos
export const ProductService = {
  async getProducts(tenantSlug: string) {
    // ✅ CORRECTO: Usar cache
    const cached = await tenantCache.getProducts(tenantSlug);
    if (cached) return cached;

    // Cache miss - fetch from database
    const products = await db.query.products.findMany({
      where: eq(products.tenantId, tenantId),
    });

    // Cache for 30 minutes
    await tenantCache.setProducts(tenantSlug, products);

    return products;
  },
};
```

#### **Escenario C: Tests E2E**

- **QA Agent NO necesita Redis** para tests
- Los tests usan mocks o datos en memoria

---

## 🎯 Guía de Decisión para Agentes

### **Developer Agent**

| Tipo de Cambio              | ¿Considerar Husky? | ¿Usar Redis?           |
| --------------------------- | ------------------ | ---------------------- |
| Nuevo componente React      | ✅ (formateo)      | ❌                     |
| Modificar servicio de datos | ✅ (typecheck)     | ✅ **SÍ**              |
| Agregar endpoint API        | ✅ (linting)       | ✅ Si lee de BD        |
| Actualizar esquema BD       | ✅ (typecheck)     | ✅ **Invalidar cache** |
| Modificar tipos TypeScript  | ✅ (typecheck)     | ❌                     |

### **QA Agent**

| Tipo de Cambio        | ¿Considerar Husky? | ¿Usar Redis?              |
| --------------------- | ------------------ | ------------------------- |
| Escribir tests E2E    | ✅ (formateo)      | ❌ (usar mocks)           |
| Validar accesibilidad | ✅ (linting)       | ❌                        |
| Probar rendimiento    | ❌                 | ✅ (verificar cache hits) |
| Agregar fixtures      | ✅ (formateo)      | ❌                        |

---

## 📚 Checklist para Agentes

### **Antes de hacer cambios**:

#### Developer Agent:

- [ ] ¿El código está formateado con Prettier?
- [ ] ¿Pasa ESLint sin errores?
- [ ] ¿TypeScript compila sin errores?
- [ ] ¿La modificación afecta datos cacheados?
- [ ] Si SÍ → ¿Invalidé el cache apropiadamente?
- [ ] ¿El cambio requiere actualizar tipos?

#### QA Agent:

- [ ] ¿Los tests están formateados correctamente?
- [ ] ¿Los tests usan mocks en lugar de datos reales?
- [ ] ¿Los tests verifican invalidación de cache si aplica?
- [ ] ¿Los tests pasan localmente antes de commit?

---

## 🔧 Comandos Útiles para Agentes

### **Verificar antes de modificar**:

```bash
# Formatear código (lo que Husky hará en pre-commit)
npm run lint

# Verificar tipos (lo que Husky hará en pre-push)
npm run typecheck

# Verificar Redis (opcional)
npx tsx scripts/verify-redis.ts
```

### **Simular hooks de Husky manualmente**:

```bash
# Simular pre-commit
npx lint-staged

# Simular pre-push
npm run typecheck
```

---

## 💡 Resumen

### **¿Los agentes ejecutan Husky y Redis?**

**NO** automáticamente.

### **¿Los agentes deben considerarlos?**

**SÍ** absolutamente:

1. **Husky**: Escribir código que pase los hooks
2. **Redis**: Usar cache y invalidar cuando modifican datos

### **¿Cómo saber si debo usar Redis en mi cambio?**

Pregúntate:

- ¿Estoy modificando/creando servicios de datos? → **SÍ, usa Redis**
- ¿Estoy actualizando registros en la BD? → **SÍ, invalida cache**
- ¿Estoy creando componentes React? → **NO necesitas Redis**
- ¿Estoy escribiendo tests? → **NO, usa mocks**

---

## 🚀 Mejores Prácticas

### Para Developer Agent:

1. Siempre usar `tenantCache` para operaciones de lectura frecuentes
2. Invalidar cache después de modificaciones (UPDATE, DELETE)
3. Ejecutar `npm run lint` antes de considerar el cambio "completo"

### Para QA Agent:

1. Usar mocks de Redis en tests (no conectar a Redis real)
2. Verificar que tests pasen con y sin cache
3. Incluir tests de invalidación de cache cuando se modifiquen datos

---

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────┐
│  Developer/QA Agent hace modificaciones │
└───────────────┬─────────────────────────┘
                │
                ▼
      ┌─────────────────────┐
      │ ¿Modifica datos BD? │
      └─────────┬───────────┘
                │
        ┌───────┴───────┐
        │ SÍ            │ NO
        ▼               ▼
┌───────────────┐  ┌────────────┐
│ Usar Redis    │  │ No necesita│
│ Invalidar     │  │ Redis      │
│ cache         │  │            │
└───────────────┘  └────────────┘
        │               │
        └───────┬───────┘
                ▼
      ┌─────────────────────┐
      │ ¿Usuario hace       │
      │ git commit/push?    │
      └─────────┬───────────┘
                │
                ▼
      ┌─────────────────────┐
      │ Husky ejecuta hooks │
      │ - lint-staged       │
      │ - typecheck         │
      └─────────────────────┘
```

---

## ✅ Conclusión

Los agentes Swarm **NO ejecutan automáticamente** Husky ni Redis, pero **DEBEN considerar estas herramientas** al hacer modificaciones para asegurar:

1. ✅ Código de calidad (Husky)
2. ✅ Rendimiento óptimo (Redis)
3. ✅ Consistencia de datos (Invalidación de cache)

**Recomendación**: Los agentes deben incluir validaciones de formateo, linting y typecheck como parte de su flujo estándar, y usar Redis cuando trabajen con servicios de datos.

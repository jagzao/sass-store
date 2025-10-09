# UI Design System - Sass Store Multi-Tenant

## Principios Fundamentales de Diseño Visual

Esta guía establece los principios de diseño visual para crear interfaces con profundidad, elevación y balance responsive.

---

## 1. Color Layering for Depth (Capas de Color para Profundidad)

### Fundamento: Sistema de Shades

**Crear 3-4 tonos de tu color base incrementando la luminosidad en 0.1**

```typescript
// lib/design/colors.ts
export function generateColorShades(baseColor: string) {
  const base = parseColor(baseColor); // HSL

  return {
    shade1: adjustLightness(base, 0.0),  // Más oscuro (fondo, profundo)
    shade2: adjustLightness(base, 0.1),  // Intermedio
    shade3: adjustLightness(base, 0.2),  // Claro
    shade4: adjustLightness(base, 0.3),  // Más claro (elevado, importante)
  };
}

// Ejemplo para Wonder Nails (rosado #E91E63)
const wondernailsShades = {
  shade1: 'hsl(340, 82%, 52%)',  // Base oscuro
  shade2: 'hsl(340, 82%, 62%)',  // +0.1 lightness
  shade3: 'hsl(340, 82%, 72%)',  // +0.2 lightness
  shade4: 'hsl(340, 82%, 82%)',  // +0.3 lightness (highlights)
};
```

### Principio de Jerarquía

**Darker = deeper/background, Lighter = elevated/important**

```css
/* Fondo de la página - Más oscuro */
.page-background {
  background-color: var(--shade-1);
}

/* Tarjeta elevada - Intermedio */
.card {
  background-color: var(--shade-2);
}

/* Elemento importante dentro de tarjeta - Más claro */
.card-header {
  background-color: var(--shade-3);
}

/* Highlight o CTA - Más claro aún */
.cta-button {
  background-color: var(--shade-4);
}
```

### Efecto de Layering

**Apilar tonos claros sobre oscuros para crear elevación visual**

```tsx
// components/ProductCard.tsx
export function ProductCard({ product }: { product: Product }) {
  const { shades } = useTenantBranding();

  return (
    <div
      style={{ backgroundColor: shades.shade2 }}
      className="rounded-lg p-6"
    >
      {/* Header más claro = elevado */}
      <div
        style={{ backgroundColor: shades.shade3 }}
        className="rounded-t-lg p-4 -mx-6 -mt-6 mb-4"
      >
        <h3 className="font-bold">{product.name}</h3>
      </div>

      <p>{product.description}</p>

      {/* CTA más claro = más importante */}
      <button
        style={{ backgroundColor: shades.shade4 }}
        className="mt-4 px-6 py-2 rounded-full font-semibold"
      >
        Agregar al Carrito
      </button>
    </div>
  );
}
```

### Sin Bordes Necesarios

**El contraste de color solo puede separar elementos con el layering correcto**

```css
/* ❌ Antes: dependencia de borders */
.card {
  background: white;
  border: 1px solid #e0e0e0;
}

/* ✅ Después: separación por color layering */
.card {
  background: var(--shade-2); /* Más claro que el fondo */
  border: none; /* No necesario! */
}
```

---

## 2. Two-Layer Shadows & Gradients (Sombras de Dos Capas)

### Realismo a través de Sombras Duales

**Combinar sombras claras (arriba) + oscuras (abajo) en lugar de una sombra genérica**

```css
/* Sombra dual para realismo */
.card-elevated {
  box-shadow:
    /* Sombra clara arriba (luz) */
    0 -1px 2px rgba(255, 255, 255, 0.1),
    /* Sombra oscura abajo (profundidad) */
    0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Tres Niveles de Profundidad

```css
/* Nivel 1: Sombra sutil (hover suave) */
.shadow-sm {
  box-shadow:
    0 -1px 1px rgba(255, 255, 255, 0.05),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Nivel 2: Sombra estándar (tarjetas) */
.shadow-md {
  box-shadow:
    0 -1px 2px rgba(255, 255, 255, 0.1),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Nivel 3: Sombra prominente (hover/focus intenso) */
.shadow-lg {
  box-shadow:
    0 -2px 4px rgba(255, 255, 255, 0.15),
    0 8px 24px rgba(0, 0, 0, 0.2);
}
```

### Concepto: Luz desde Arriba

**Simular iluminación natural - más claro arriba, más oscuro abajo**

```css
/* Gradiente que simula luz desde arriba */
.button-3d {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(0, 0, 0, 0.1) 100%
  );
  box-shadow:
    0 -1px 0 rgba(255, 255, 255, 0.3), /* Highlight arriba */
    0 2px 4px rgba(0, 0, 0, 0.2);       /* Sombra abajo */
}
```

### Mejora con Gradiente

**Gradientes lineales + sombra interna clara arriba = efecto brillante y elevado**

```css
/* Botón con efecto brillante */
.button-shiny {
  background: linear-gradient(
    135deg,
    var(--primary-light) 0%,
    var(--primary-dark) 100%
  );

  /* Sombra interna clara arriba */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4), /* Brillo interno */
    0 4px 8px rgba(0, 0, 0, 0.15);          /* Sombra externa */

  transition: all 0.2s ease;
}

.button-shiny:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}
```

### Inset vs Outset

**Inset shadows empujan (hundido), outset shadows elevan (elevado)**

```css
/* Outset: Elevado (botones, tarjetas) */
.elevated {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Inset: Hundido (inputs, textareas) */
.sunken {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Combinación: Input con borde brillante */
.input-refined {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.08),   /* Hundido */
    inset 0 -1px 0 rgba(255, 255, 255, 0.3); /* Brillo abajo */
}
```

---

## 3. Responsive Design Principles (Principios Responsive)

### Principio 1: Todo es un Sistema de Cajas

**El objetivo es construir un layout donde todo tiene una relación clara y balance general**

```tsx
// components/ResponsiveGrid.tsx
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      grid
      grid-cols-1           /* Mobile: 1 columna */
      md:grid-cols-2        /* Tablet: 2 columnas */
      lg:grid-cols-3        /* Desktop: 3 columnas */
      gap-4                 /* Espacio consistente */
      md:gap-6              /* Más espacio en pantallas grandes */
    ">
      {children}
    </div>
  );
}
```

### Principio 2: No se Trata de Encoger, Sino de Reorganizar

**Responsive no es hacer todo más pequeño, es cambiar la disposición con propósito**

```css
/* ❌ Mal: Solo reducir tamaño */
.product-card {
  font-size: 16px;
}

@media (max-width: 768px) {
  .product-card {
    font-size: 12px; /* Todo más pequeño = ilegible */
  }
}

/* ✅ Bien: Reorganizar con propósito */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: 1fr; /* Columna única */
    gap: 1.5rem; /* Espacio ajustado, no eliminado */
  }

  /* Los elementos importantes mantienen su tamaño */
  .product-card h3 {
    font-size: 1.25rem; /* Mismo tamaño, legible */
  }
}
```

### Sistema de Breakpoints Consistente

```typescript
// lib/design/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const;

// Tailwind config
module.exports = {
  theme: {
    screens: breakpoints,
  },
};
```

### Reorganización con Propósito

```tsx
// components/HeroSection.tsx
export function HeroSection({ tenant }: { tenant: TenantData }) {
  return (
    <section className="
      /* Mobile: Vertical stack */
      flex flex-col gap-6

      /* Desktop: Horizontal con imagen */
      lg:flex-row lg:gap-12 lg:items-center
    ">
      {/* Texto */}
      <div className="
        /* Mobile: Orden 2, después de imagen */
        order-2

        /* Desktop: Orden 1, antes de imagen */
        lg:order-1 lg:flex-1
      ">
        <h1 className="text-4xl lg:text-6xl font-bold">
          {tenant.name}
        </h1>
        <p className="text-lg lg:text-xl mt-4">
          {tenant.description}
        </p>
      </div>

      {/* Imagen */}
      <div className="
        /* Mobile: Orden 1, impacto visual primero */
        order-1

        /* Desktop: Orden 2, balance visual */
        lg:order-2 lg:flex-1
      ">
        <img
          src={tenant.heroImage}
          alt={tenant.name}
          className="rounded-lg shadow-lg w-full"
        />
      </div>
    </section>
  );
}
```

### Mantener Claridad y Ritmo

**Los elementos deben fluir, cambiar de posición, pero mantener su jerarquía**

```css
/* Jerarquía consistente en todos los breakpoints */
.heading-primary {
  font-size: 2rem;      /* Mobile */
  font-weight: 700;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .heading-primary {
    font-size: 3rem;    /* Tablet: escala */
  }
}

@media (min-width: 1024px) {
  .heading-primary {
    font-size: 4rem;    /* Desktop: escala más */
  }
}

/* Espaciado proporcional */
.section {
  padding: 2rem 1rem;   /* Mobile */
}

@media (min-width: 768px) {
  .section {
    padding: 4rem 2rem; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .section {
    padding: 6rem 3rem; /* Desktop */
  }
}
```

---

## 4. Ejemplo Completo: ProductCard Component

```tsx
// components/ProductCard.tsx
import { useTenantBranding } from '@/lib/hooks/useModernState';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { primaryColor, shades } = useTenantBranding();

  return (
    <article
      className="
        /* Responsive layout */
        flex flex-col
        rounded-lg overflow-hidden

        /* Transiciones suaves */
        transition-all duration-300

        /* Hover: elevación */
        hover:-translate-y-2
      "
      style={{
        /* Color layering - fondo intermedio */
        backgroundColor: shades.shade2,

        /* Two-layer shadow - nivel medio */
        boxShadow: `
          0 -1px 2px rgba(255, 255, 255, 0.1),
          0 4px 12px rgba(0, 0, 0, 0.15)
        `,
      }}
    >
      {/* Imagen */}
      <div className="relative aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Badge - color más claro = elevado */}
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: shades.shade4,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          Nuevo
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 lg:p-6 flex-1 flex flex-col">
        <h3 className="text-lg lg:text-xl font-bold mb-2">
          {product.name}
        </h3>

        <p className="text-sm lg:text-base mb-4 flex-1">
          {product.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            ${product.price}
          </span>

          <button
            className="
              px-4 py-2 lg:px-6 lg:py-3
              rounded-full font-semibold
              transition-all duration-200
              hover:shadow-lg
            "
            style={{
              /* Botón más claro = CTA importante */
              background: `linear-gradient(
                135deg,
                ${shades.shade3} 0%,
                ${shades.shade4} 100%
              )`,
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 4px 8px rgba(0, 0, 0, 0.15)
              `,
            }}
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
```

---

## 5. Utility Classes Recomendadas

```css
/* tailwind.config.js - Custom utilities */
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'subtle': '0 -1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.1)',
        'medium': '0 -1px 2px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.15)',
        'prominent': '0 -2px 4px rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.2)',
        'inset-refined': 'inset 0 2px 4px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.3)',
      },
    },
  },
};
```

---

## Checklist de Implementación

- [ ] Generar shades (4 tonos) del color primario por tenant
- [ ] Aplicar color layering: más oscuro = fondo, más claro = elevado
- [ ] Eliminar bordes innecesarios, usar contraste de color
- [ ] Implementar sombras duales (luz arriba, oscuridad abajo)
- [ ] Definir 3 niveles de sombra: subtle, medium, prominent
- [ ] Usar gradientes + inset shadow para botones brillantes
- [ ] Reorganizar layouts en mobile con propósito (no solo encoger)
- [ ] Mantener jerarquía tipográfica en todos los breakpoints
- [ ] Espaciado proporcional responsive (no arbitrario)

---

**Última actualización**: 2025-10-08
**Versión**: 1.0.0
**Aplicable a**: Wonder Nails, Vigi Studios, Nom-Nom, Delirios

# Guía de Estructura de Assets por Tenant

## Estructura de Directorios

```
public/
├── tenants/
│   ├── wondernails/
│   │   ├── logo/
│   │   │   ├── logo.svg (logo principal)
│   │   │   ├── logo-white.svg (logo en blanco)
│   │   │   ├── favicon.ico
│   │   │   └── favicon.png
│   │   ├── hero/
│   │   │   ├── img1.svg ✓ (ya existe)
│   │   │   ├── img2.svg ✓
│   │   │   ├── img3.svg ✓
│   │   │   ├── img4.svg ✓
│   │   │   ├── img5.svg ✓
│   │   │   └── img6.svg ✓
│   │   ├── products/
│   │   │   ├── product-1.jpg
│   │   │   ├── product-2.jpg
│   │   │   └── ...
│   │   └── services/
│   │       ├── service-gel.jpg
│   │       ├── service-pedicure.jpg
│   │       └── ...
│   ├── nom-nom/
│   │   ├── logo/
│   │   │   ├── logo.svg
│   │   │   ├── logo-white.svg
│   │   │   ├── favicon.ico
│   │   │   └── favicon.png
│   │   ├── hero/ (usa CarouselHero default)
│   │   ├── products/
│   │   │   ├── product-burger.jpg
│   │   │   ├── product-pizza.jpg
│   │   │   └── ...
│   │   └── services/
│   │       └── (no aplica - es catalog mode)
│   ├── centro-tenistico/
│   │   ├── logo/
│   │   ├── hero/
│   │   ├── products/
│   │   └── services/
│   └── vigistudio/
│       ├── logo/
│       ├── hero/
│       ├── products/
│       └── services/
```

## Convenciones de Archivos

### Logos

- `logo.svg` - Logo principal (fondo transparente)
- `logo-white.svg` - Logo en blanco para fondos oscuros
- `favicon.ico` - Favicon de 32x32 y 16x16
- `favicon.png` - Favicon PNG de alta resolución (192x192)

### Imágenes Hero

- Para **tenants con componentes personalizados** (ej: wondernails): usar nombres específicos como `img1.svg`, `img2.svg`, etc.
- Para **tenants con hero genérico**: no necesitan imágenes específicas (usan iconos emoji)

### Productos

- Formato recomendado: JPG o WebP
- Resolución: 400x400 px mínimo
- Nombres descriptivos: `product-{nombre}.jpg`

### Servicios

- Formato: JPG o WebP
- Resolución: 300x200 px mínimo
- Nombres descriptivos: `service-{nombre}.jpg`

## Cómo Usar en el Código

### En componentes React:

```tsx
// Logo
<img src={`/tenants/${tenantSlug}/logo/logo.svg`} alt={tenantName} />

// Productos
<img src={`/tenants/${tenantSlug}/products/product-${productId}.jpg`} alt={productName} />

// Servicios
<img src={`/tenants/${tenantSlug}/services/service-${serviceId}.jpg`} alt={serviceName} />
```

### En metadata (favicon):

```tsx
// En generateMetadata()
icons: {
  icon: `/tenants/${params.tenant}/logo/favicon.ico`,
  apple: `/tenants/${params.tenant}/logo/favicon.png`,
}
```

## Tenants Configurados

### ✅ wondernails (booking mode)

- HeroWondernails personalizado con 6 imágenes hero
- Assets de ejemplo: `img1.svg` - `img6.svg`

### 🔄 nom-nom (catalog mode)

- CarouselHero genérico con iconos emoji
- Sin imágenes hero específicas necesarias
- Necesita: productos de comida

### 🔄 centro-tenistico (booking mode)

- CarouselHero genérico
- Necesita: servicios de tenis, productos deportivos

### 🔄 vigistudio (booking mode)

- CarouselHero genérico
- Necesita: servicios de peluquería, productos de belleza

## Próximos Pasos

1. Añadir logos y favicons para cada tenant
2. Configurar metadata para usar favicons específicos
3. Añadir imágenes de productos y servicios
4. Actualizar mock data para referenciar imágenes reales

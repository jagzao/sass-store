# GraphQL API Guide

## 🚀 Overview

Este proyecto usa **Apollo Server** con **GraphQL** para proporcionar una API flexible y eficiente para el sistema multi-tenant.

## 📍 Endpoints

- **GraphQL API**: `http://localhost:4000/api/graphql`
- **GraphQL Playground**: `http://localhost:4000/api/graphql` (GET request en desarrollo)

## 🎯 Características

### ✅ Multi-tenant por diseño

- Todas las queries filtran por `tenantSlug`
- Aislamiento automático de datos por tenant
- Seguridad incorporada

### ✅ Tipo-seguro

- Schema completo de GraphQL
- Introspección automática
- Autocompletado en el IDE

### ✅ Optimizado

- N+1 query prevention con DataLoader (próximamente)
- Cache inteligente con Apollo Client
- Field-level caching

## 📝 Ejemplos de Uso

### Frontend (React Hooks)

```typescript
'use client';

import { useProducts, useCreateReview } from '@/lib/hooks/useGraphQL';

export function ProductList({ tenantSlug }: { tenantSlug: string }) {
  // Fetch products
  const { data, loading, error } = useProducts(tenantSlug, { featured: true });

  // Create review mutation
  const [createReview] = useCreateReview({
    onCompleted: (data) => {
      console.log('Review created:', data.createReview);
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.products.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p>${product.price}</p>
          <button
            onClick={() =>
              createReview({
                variables: {
                  input: {
                    productId: product.id,
                    tenantSlug,
                    customerName: 'John Doe',
                    rating: 5,
                    title: 'Excelente producto',
                    comment: 'Me encantó!',
                  },
                },
              })
            }
          >
            Dejar Reseña
          </button>
        </div>
      ))}
    </div>
  );
}
```

### GraphQL Queries Directas

#### Obtener productos de un tenant

```graphql
query GetProducts {
  products(tenantSlug: "wondernails", featured: true) {
    id
    name
    description
    price
    category
    featured
  }
}
```

#### Obtener servicios de un tenant

```graphql
query GetServices {
  services(tenantSlug: "nom-nom") {
    id
    name
    description
    price
    duration
  }
}
```

#### Crear una reserva

```graphql
mutation CreateBooking {
  createBooking(
    input: {
      tenantSlug: "wondernails"
      serviceId: "uuid-here"
      customerName: "María García"
      customerEmail: "maria@example.com"
      customerPhone: "+1234567890"
      startTime: "2025-10-05T10:00:00Z"
      endTime: "2025-10-05T11:30:00Z"
      notes: "Primera vez, necesito manicure express"
    }
  ) {
    id
    status
    startTime
    endTime
    service {
      name
      price
    }
  }
}
```

#### Crear una reseña

```graphql
mutation CreateReview {
  createReview(
    input: {
      productId: "product-uuid"
      tenantSlug: "nom-nom"
      customerName: "Juan Pérez"
      customerEmail: "juan@example.com"
      rating: 5
      title: "Deliciosos tacos!"
      comment: "Los mejores tacos al pastor que he probado"
    }
  ) {
    id
    status
    rating
    createdAt
  }
}
```

## 🔧 Configuración del Cliente

### 1. Envolver la app con ApolloProvider

```typescript
// app/layout.tsx
import { ApolloProvider } from '@/components/providers/ApolloProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
```

### 2. Variables de entorno

```env
# .env.local
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/api/graphql
```

## 📊 Schema Completo

### Tipos Principales

- **Tenant**: Información del inquilino
- **Product**: Productos del catálogo
- **Service**: Servicios ofrecidos
- **Review**: Reseñas de productos
- **Booking**: Reservas de servicios

### Enums

- `TenantMode`: `catalog` | `booking`
- `TenantStatus`: `active` | `inactive` | `suspended`
- `ReviewStatus`: `pending` | `approved` | `rejected`
- `BookingStatus`: `pending` | `confirmed` | `cancelled` | `completed`

## 🎨 Mejores Prácticas

### 1. Usar Fragments para reutilizar campos

```graphql
fragment ProductFields on Product {
  id
  name
  description
  price
  category
  featured
}

query GetProducts {
  products(tenantSlug: "nom-nom") {
    ...ProductFields
  }
}
```

### 2. Manejar errores apropiadamente

```typescript
const { data, loading, error } = useProducts('nom-nom');

if (error) {
  // Los errores GraphQL incluyen código de error
  if (error.graphQLErrors[0]?.extensions?.code === 'TENANT_NOT_FOUND') {
    return <TenantNotFound />;
  }
  return <ErrorMessage error={error} />;
}
```

### 3. Optimistic UI para mutaciones

```typescript
const [createReview] = useCreateReview({
  optimisticResponse: {
    createReview: {
      __typename: "Review",
      id: "temp-id",
      customerName: "You",
      rating: 5,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  },
});
```

## 🧪 Testing en GraphQL Playground

1. Abre `http://localhost:4000/api/graphql` en tu navegador
2. Usa la documentación automática (Docs panel)
3. Prueba queries y mutations interactivamente
4. Explora el schema con introspección

## 🔐 Seguridad

- **Validación de tenant**: Todas las queries validan que el tenant existe
- **RLS (Row Level Security)**: Los datos están aislados por tenant
- **Error handling**: Los errores sensibles no se exponen al cliente
- **Rate limiting**: (Próximamente) Límite de requests por tenant

## 🚀 Próximas Mejoras

- [ ] DataLoader para optimizar N+1 queries
- [ ] Subscriptions para actualizaciones en tiempo real
- [ ] Autenticación con JWT
- [ ] Rate limiting por tenant
- [ ] Cache avanzado con Redis
- [ ] Paginación con cursors
- [ ] File uploads para imágenes de productos

## 📚 Recursos

- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Spec](https://spec.graphql.org/)

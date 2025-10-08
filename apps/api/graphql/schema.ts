import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Tenant Type
  type Tenant {
    id: ID!
    slug: String!
    name: String!
    description: String
    mode: TenantMode!
    status: TenantStatus!
    branding: JSON!
    contact: JSON!
    location: JSON!
    quotas: JSON!
    products: [Product!]!
    services: [Service!]!
    createdAt: String!
    updatedAt: String!
  }

  enum TenantMode {
    catalog
    booking
  }

  enum TenantStatus {
    active
    inactive
    suspended
  }

  # Product Type
  type Product {
    id: ID!
    tenantId: ID!
    tenant: Tenant!
    sku: String!
    name: String!
    description: String
    price: Float!
    category: String!
    featured: Boolean!
    active: Boolean!
    metadata: JSON
    reviews: [Review!]!
    createdAt: String!
    updatedAt: String!
  }

  # Service Type
  type Service {
    id: ID!
    tenantId: ID!
    tenant: Tenant!
    name: String!
    description: String
    price: Float!
    duration: Int!
    featured: Boolean!
    active: Boolean!
    metadata: JSON
    bookings: [Booking!]!
    createdAt: String!
    updatedAt: String!
  }

  # Review Type
  type Review {
    id: ID!
    productId: ID!
    product: Product!
    tenantId: ID!
    customerName: String!
    customerEmail: String
    rating: Int!
    title: String
    comment: String
    status: ReviewStatus!
    helpful: Int!
    reported: Int!
    createdAt: String!
    updatedAt: String!
  }

  enum ReviewStatus {
    pending
    approved
    rejected
  }

  # Booking Type
  type Booking {
    id: ID!
    serviceId: ID!
    service: Service!
    tenantId: ID!
    staffId: ID
    customerName: String!
    customerEmail: String!
    customerPhone: String
    startTime: String!
    endTime: String!
    status: BookingStatus!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  enum BookingStatus {
    pending
    confirmed
    cancelled
    completed
  }

  # JSON scalar for flexible data
  scalar JSON

  # Queries
  type Query {
    # Tenant queries
    tenant(slug: String!): Tenant
    tenants(status: TenantStatus): [Tenant!]!

    # Product queries
    product(id: ID!): Product
    products(tenantSlug: String!, category: String, featured: Boolean): [Product!]!

    # Service queries
    service(id: ID!): Service
    services(tenantSlug: String!, featured: Boolean): [Service!]!

    # Review queries
    reviews(productId: ID!, status: ReviewStatus): [Review!]!

    # Booking queries
    booking(id: ID!): Booking
    bookings(tenantSlug: String!, status: BookingStatus): [Booking!]!
  }

  # Mutations
  type Mutation {
    # Product mutations
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!

    # Review mutations
    createReview(input: CreateReviewInput!): Review!
    updateReview(id: ID!, input: UpdateReviewInput!): Review!
    deleteReview(id: ID!): Boolean!

    # Booking mutations
    createBooking(input: CreateBookingInput!): Booking!
    updateBooking(id: ID!, input: UpdateBookingInput!): Booking!
    cancelBooking(id: ID!): Booking!
  }

  # Input Types
  input CreateProductInput {
    tenantSlug: String!
    sku: String!
    name: String!
    description: String
    price: Float!
    category: String!
    featured: Boolean
    active: Boolean
    metadata: JSON
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    category: String
    featured: Boolean
    active: Boolean
    metadata: JSON
  }

  input CreateReviewInput {
    productId: ID!
    tenantSlug: String!
    customerName: String!
    customerEmail: String
    rating: Int!
    title: String
    comment: String
  }

  input UpdateReviewInput {
    status: ReviewStatus
    helpful: Int
    reported: Int
  }

  input CreateBookingInput {
    serviceId: ID!
    tenantSlug: String!
    staffId: ID
    customerName: String!
    customerEmail: String!
    customerPhone: String
    startTime: String!
    endTime: String!
    notes: String
  }

  input UpdateBookingInput {
    startTime: String
    endTime: String
    status: BookingStatus
    notes: String
  }
`;

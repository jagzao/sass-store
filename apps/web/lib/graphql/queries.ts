import { gql } from "@apollo/client";

// Tenant Queries
export const GET_TENANT = gql`
  query GetTenant($slug: String!) {
    tenant(slug: $slug) {
      id
      slug
      name
      description
      mode
      status
      branding
      contact
      location
      quotas
      createdAt
      updatedAt
    }
  }
`;

export const GET_TENANTS = gql`
  query GetTenants($status: TenantStatus) {
    tenants(status: $status) {
      id
      slug
      name
      description
      mode
      status
      branding
      createdAt
    }
  }
`;

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts(
    $tenantSlug: String!
    $category: String
    $featured: Boolean
  ) {
    products(
      tenantSlug: $tenantSlug
      category: $category
      featured: $featured
    ) {
      id
      sku
      name
      description
      price
      category
      featured
      active
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      sku
      name
      description
      price
      category
      featured
      active
      metadata
      tenant {
        id
        slug
        name
      }
      reviews {
        id
        customerName
        rating
        title
        comment
        status
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// Service Queries
export const GET_SERVICES = gql`
  query GetServices($tenantSlug: String!, $featured: Boolean) {
    services(tenantSlug: $tenantSlug, featured: $featured) {
      id
      name
      description
      price
      duration
      featured
      active
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const GET_SERVICE = gql`
  query GetService($id: ID!) {
    service(id: $id) {
      id
      name
      description
      price
      duration
      featured
      active
      metadata
      tenant {
        id
        slug
        name
      }
      bookings {
        id
        customerName
        startTime
        endTime
        status
      }
      createdAt
      updatedAt
    }
  }
`;

// Review Queries
export const GET_REVIEWS = gql`
  query GetReviews($productId: ID!, $status: ReviewStatus) {
    reviews(productId: $productId, status: $status) {
      id
      customerName
      customerEmail
      rating
      title
      comment
      status
      helpful
      reported
      createdAt
      updatedAt
    }
  }
`;

// Booking Queries
export const GET_BOOKINGS = gql`
  query GetBookings($tenantSlug: String!, $status: BookingStatus) {
    bookings(tenantSlug: $tenantSlug, status: $status) {
      id
      customerName
      customerEmail
      customerPhone
      startTime
      endTime
      status
      notes
      service {
        id
        name
        price
        duration
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_BOOKING = gql`
  query GetBooking($id: ID!) {
    booking(id: $id) {
      id
      customerName
      customerEmail
      customerPhone
      startTime
      endTime
      status
      notes
      service {
        id
        name
        description
        price
        duration
      }
      createdAt
      updatedAt
    }
  }
`;

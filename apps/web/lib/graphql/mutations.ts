import { gql } from "@apollo/client";

// Product Mutations
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
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
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      sku
      name
      description
      price
      category
      featured
      active
      metadata
      updatedAt
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

// Review Mutations
export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      productId
      customerName
      customerEmail
      rating
      title
      comment
      status
      createdAt
    }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: ID!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id
      status
      helpful
      reported
      updatedAt
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: ID!) {
    deleteReview(id: $id)
  }
`;

// Booking Mutations
export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      serviceId
      customerName
      customerEmail
      customerPhone
      startTime
      endTime
      status
      notes
      createdAt
    }
  }
`;

export const UPDATE_BOOKING = gql`
  mutation UpdateBooking($id: ID!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      startTime
      endTime
      status
      notes
      updatedAt
    }
  }
`;

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

"use client";

import {
  useQuery,
  useMutation,
  QueryHookOptions,
  MutationHookOptions,
} from "@apollo/client";
import {
  GET_PRODUCTS,
  GET_SERVICES,
  GET_TENANT,
  GET_REVIEWS,
  GET_BOOKINGS,
} from "../graphql/queries";
import {
  CREATE_REVIEW,
  CREATE_BOOKING,
  UPDATE_BOOKING,
  CANCEL_BOOKING,
} from "../graphql/mutations";

// Hook for fetching tenant data
export function useTenant(slug: string, options?: QueryHookOptions) {
  return useQuery(GET_TENANT, {
    variables: { slug },
    ...options,
  });
}

// Hook for fetching products
export function useProducts(
  tenantSlug: string,
  filters?: { category?: string; featured?: boolean },
  options?: QueryHookOptions,
) {
  return useQuery(GET_PRODUCTS, {
    variables: { tenantSlug, ...filters },
    ...options,
  });
}

// Hook for fetching services
export function useServices(
  tenantSlug: string,
  filters?: { featured?: boolean },
  options?: QueryHookOptions,
) {
  return useQuery(GET_SERVICES, {
    variables: { tenantSlug, ...filters },
    ...options,
  });
}

// Hook for fetching reviews
export function useReviews(
  productId: string,
  filters?: { status?: string },
  options?: QueryHookOptions,
) {
  return useQuery(GET_REVIEWS, {
    variables: { productId, ...filters },
    ...options,
  });
}

// Hook for fetching bookings
export function useBookings(
  tenantSlug: string,
  filters?: { status?: string },
  options?: QueryHookOptions,
) {
  return useQuery(GET_BOOKINGS, {
    variables: { tenantSlug, ...filters },
    ...options,
  });
}

// Hook for creating a review
export function useCreateReview(options?: MutationHookOptions) {
  return useMutation(CREATE_REVIEW, options);
}

// Hook for creating a booking
export function useCreateBooking(options?: MutationHookOptions) {
  return useMutation(CREATE_BOOKING, options);
}

// Hook for updating a booking
export function useUpdateBooking(options?: MutationHookOptions) {
  return useMutation(UPDATE_BOOKING, options);
}

// Hook for canceling a booking
export function useCancelBooking(options?: MutationHookOptions) {
  return useMutation(CANCEL_BOOKING, options);
}

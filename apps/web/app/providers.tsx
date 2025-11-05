"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, lazy, Suspense } from "react";

// Lazy load devtools only in development to reduce bundle size
const ReactQueryDevtoolsProduction = lazy(() =>
  import("@tanstack/react-query-devtools/build/modern/production.js").then(
    (d) => ({
      default: d.ReactQueryDevtools,
    })
  )
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching for better UX
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (
                error &&
                "status" in error &&
                typeof error.status === "number"
              ) {
                return error.status >= 500 && failureCount < 3;
              }
              return failureCount < 3;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry mutations on client errors
              if (
                error &&
                "status" in error &&
                typeof error.status === "number"
              ) {
                return error.status >= 500 && failureCount < 2;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only load devtools in development */}
      {process.env.NODE_ENV === "development" && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}

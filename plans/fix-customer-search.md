# Fix Customer Search Functionality

## Problem Analysis

The customer search functionality on the wondernails client page is not working because:

1. **Frontend Implementation**: The `CustomersFilters.tsx` component correctly captures search input and updates URL parameters.
2. **Backend Issue**: The API endpoint in `route.ts` doesn't implement search or status filtering. It returns all customers without applying filters.

## Implementation Plan

### 1. Backend API Changes

**File**: `apps/web/app/api/tenants/[tenant]/customers/route.ts`

#### Required Imports

Add the missing imports for filtering:

```typescript
import { eq, desc, sql, or, ilike } from "drizzle-orm";
```

#### Update GET Function

Modify the GET function to handle search and status filtering:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, "customers");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { tenant: tenantSlug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Build the base query
    let query = db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        totalSpent:
          sql<number>`COALESCE(SUM(${customerVisits.totalAmount}), 0)`.mapWith(
            Number,
          ),
        visitCount: sql<number>`COUNT(${customerVisits.id})`.mapWith(Number),
        lastVisit: sql<string>`MAX(${customerVisits.visitDate})`,
      })
      .from(customers)
      .leftJoin(customerVisits, eq(customers.id, customerVisits.customerId))
      .where(eq(customers.tenantId, tenant.id));

    // Apply search filter if provided
    if (search) {
      query = query.where(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`),
        ),
      );
    }

    // Apply status filter if provided and not "all"
    if (status && status !== "all") {
      query = query.where(eq(customers.status, status as any));
    }

    // Execute the query with grouping and ordering
    const customersWithStats = await query
      .groupBy(
        customers.id,
        customers.name,
        customers.phone,
        customers.email,
        customers.status,
        customers.createdAt,
      )
      .orderBy(desc(customers.createdAt));

    // map undefined email to match interface if needed, although the query handles it
    const formattedCustomers = customersWithStats.map((c) => ({
      ...c,
      email: c.email || undefined,
      nextAppointment: undefined, // TODO: Get from bookings when we have booking data
    }));

    // Apply rate limiting headers
    const rateLimitResult = await applyRateLimit(request, "customers");
    if (rateLimitResult) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { customers: formattedCustomers },
        {
          headers,
        },
      );
    }

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 2. Frontend Improvements

**File**: `apps/web/components/customers/CustomersFilters.tsx`

#### Add Debouncing for Better UX

Add useEffect for debouncing the search input:

```typescript
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

interface CustomersFiltersProps {
  tenantSlug: string;
  searchParams: {
    search?: string;
    status?: string;
  };
}

export default function CustomersFilters({ tenantSlug, searchParams }: CustomersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.search || "");
  const [status, setStatus] = useState(searchParams.status || "all");

  // Add debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);

      router.push(`${pathname}?${params.toString()}`);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search, status, pathname, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, teléfono o email..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={status}
            onChange={handleStatusChange}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="blocked">Bloqueadas</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

## Testing

After implementing these changes, test the following scenarios:

1. **Search Functionality**:
   - Search by customer name (e.g., "rebeca")
   - Search by phone number
   - Search by email address
   - Verify search is case-insensitive

2. **Status Filtering**:
   - Filter by "Activas"
   - Filter by "Inactivas"
   - Filter by "Bloqueadas"
   - Verify "Todos los estados" shows all customers

3. **Combined Filtering**:
   - Search with status filter applied
   - Verify both filters work together correctly

4. **Debouncing**:
   - Type quickly in search field and verify it doesn't make excessive API calls
   - Verify the 300ms delay works correctly

## Expected Outcome

After implementing these changes, the customer search functionality should work correctly:

1. When users type in the search field, the customer list should filter in real-time
2. The status filter should correctly filter customers by their status
3. Both filters should work together when applied simultaneously
4. The search should be case-insensitive and search across name, phone, and email fields
5. The debouncing should prevent excessive API calls and improve performance

## Files to Modify

1. `apps/web/app/api/tenants/[tenant]/customers/route.ts` - Backend API implementation
2. `apps/web/components/customers/CustomersFilters.tsx` - Frontend search component with debouncing

## Dependencies

- `drizzle-orm` with `or` and `ilike` operators
- React hooks: `useState`, `useEffect`
- Next.js: `useRouter`, `usePathname`

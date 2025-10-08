# Next.js App Router Architecture Plan with RSC Optimization

## 1. App Router Structure & RSC Boundaries

### Route Organization

```
app/
├── (auth)/                    # Route group - auth layouts
│   ├── login/
│   │   └── page.tsx          # RSC - Login form
│   └── register/
│       └── page.tsx          # RSC - Registration form
├── (dashboard)/              # Route group - authenticated layouts
│   ├── layout.tsx            # RSC - Dashboard shell
│   ├── page.tsx              # RSC - Dashboard home
│   ├── products/
│   │   ├── layout.tsx        # RSC - Products layout with filters
│   │   ├── page.tsx          # RSC - Product list page
│   │   ├── [slug]/
│   │   │   └── page.tsx      # RSC - Product detail page
│   │   └── loading.tsx       # RSC - Products loading UI
│   ├── bookings/
│   │   ├── page.tsx          # RSC - Bookings list
│   │   ├── new/
│   │   │   └── page.tsx      # RSC - New booking form
│   │   └── [id]/
│   │       └── page.tsx      # RSC - Booking detail
│   ├── cart/
│   │   └── page.tsx          # Client - Cart with real-time updates
│   └── admin/
│       ├── layout.tsx        # RSC - Admin layout with nav
│       ├── dashboard/
│       │   └── page.tsx      # RSC - Admin dashboard
│       ├── products/
│       │   ├── page.tsx      # RSC - Product management
│       │   └── new/
│       │       └── page.tsx  # Client - Product form
│       └── bookings/
│           └── page.tsx      # RSC - Booking management
├── api/                      # API routes
│   ├── auth/
│   ├── products/
│   ├── bookings/
│   ├── cart/
│   └── search/
├── globals.css
├── layout.tsx                # RSC - Root layout with tenant context
├── loading.tsx               # RSC - Global loading UI
├── error.tsx                 # Client - Global error boundary
├── not-found.tsx             # RSC - 404 page
└── page.tsx                  # RSC - Homepage
```

### RSC vs Client Components Decision Tree

**Use RSC (Server Components) for:**

- ✅ Data fetching and display
- ✅ SEO-critical content
- ✅ Static layouts and navigation
- ✅ Product catalogs and listings
- ✅ Blog posts and content pages
- ✅ Dashboard overviews
- ✅ Admin tables and reports

**Use Client Components for:**

- ✅ Interactive forms and inputs
- ✅ Real-time features (cart, notifications)
- ✅ Command palette (Cmd+K)
- ✅ Mini-cart overlay
- ✅ Booking calendar interactions
- ✅ Image upload and crop tools
- ✅ Charts and data visualizations

### Component Architecture Pattern

```typescript
// RSC Pattern - Server Component
async function ProductList({ category, page }: { category: string, page: number }) {
  const products = await getProducts({ category, page }); // Direct DB call

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <ClientPagination currentPage={page} totalPages={products.totalPages} />
    </div>
  );
}

// Client Component Pattern
'use client';
function ClientPagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    // Interactive pagination logic
  );
}
```

## 2. Suspense & Error Boundaries Strategy

### Suspense Boundaries Layout

```typescript
// app/layout.tsx - Root layout with global suspense
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TenantProvider>
          <Suspense fallback={<GlobalLoadingSkeleton />}>
            <Header />
            <ErrorBoundary fallback={<GlobalErrorFallback />}>
              <main>{children}</main>
            </ErrorBoundary>
            <Footer />
          </Suspense>
          <QuickActionsDock />
          <CommandPalette />
          <MiniCart />
        </TenantProvider>
      </body>
    </html>
  );
}

// app/(dashboard)/products/layout.tsx - Feature-level suspense
export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="products-layout">
      <Suspense fallback={<FiltersSkeleton />}>
        <ProductFilters />
      </Suspense>
      <div className="products-content">
        <ErrorBoundary fallback={<ProductsErrorFallback />}>
          <Suspense fallback={<ProductGridSkeleton />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
```

### Loading States Hierarchy

```typescript
// Granular loading states for optimal UX
interface LoadingStates {
  // Page-level loading
  PageLoading: () => JSX.Element;

  // Section-level loading
  ProductGridSkeleton: () => JSX.Element;
  FiltersSkeleton: () => JSX.Element;
  HeaderSkeleton: () => JSX.Element;

  // Component-level loading
  ProductCardSkeleton: () => JSX.Element;
  ButtonLoading: () => JSX.Element;
  ImageLoading: () => JSX.Element;
}
```

### Error Boundary Strategy

```typescript
// Global error boundary for unhandled errors
class GlobalErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to analytics service
    trackError('global_error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Feature-specific error boundaries
const ProductsErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={<ProductsErrorFallback />}
    onError={(error) => trackError('products_error', error)}
  >
    {children}
  </ErrorBoundary>
);
```

## 3. TanStack Query Keys & Client State Management

### Query Key Structure

```typescript
// Hierarchical query key factory for consistency
export const queryKeys = {
  // Tenant-scoped keys
  tenant: (tenantId: string) => ["tenant", tenantId] as const,

  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: ProductFilters) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.products.all, "search", query] as const,
  },

  // Bookings
  bookings: {
    all: ["bookings"] as const,
    lists: () => [...queryKeys.bookings.all, "list"] as const,
    list: (filters: BookingFilters) =>
      [...queryKeys.bookings.lists(), filters] as const,
    availability: () => [...queryKeys.bookings.all, "availability"] as const,
    slots: (date: string, staff?: string) =>
      [...queryKeys.bookings.availability(), date, staff] as const,
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    items: () => [...queryKeys.cart.all, "items"] as const,
    totals: () => [...queryKeys.cart.all, "totals"] as const,
  },

  // User/Customer
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    preferences: () => [...queryKeys.user.all, "preferences"] as const,
    history: () => [...queryKeys.user.all, "history"] as const,
  },
} as const;
```

### Query Configuration Strategy

```typescript
// Global query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes("4")) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        trackError("mutation_error", error);
      },
    },
  },
});

// Feature-specific query configurations
const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => getProducts(filters),
    staleTime: 2 * 60 * 1000, // Products change frequently
    enabled: !!filters.category, // Only fetch when category is selected
  });
};

const useBookingSlots = (date: string, staffId?: string) => {
  return useQuery({
    queryKey: queryKeys.bookings.slots(date, staffId),
    queryFn: () => getAvailableSlots(date, staffId),
    staleTime: 30 * 1000, // Real-time availability
    refetchInterval: 60 * 1000, // Refresh every minute
    enabled: !!date,
  });
};
```

### Optimistic Updates Pattern

```typescript
// Cart mutations with optimistic updates
const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToCartApi,
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items() });

      // Snapshot current value
      const previousCart = queryClient.getQueryData(queryKeys.cart.items());

      // Optimistically update cart
      queryClient.setQueryData(queryKeys.cart.items(), (old: CartItem[]) => [
        ...old,
        { ...newItem, id: `temp-${Date.now()}`, isOptimistic: true },
      ]);

      return { previousCart };
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.cart.items(), context?.previousCart);
      showErrorToast("Failed to add item to cart");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items() });
    },
  });
};
```

## 4. Command Palette (Cmd+K) Implementation

### Architecture

```typescript
// Command palette with global search and actions
'use client';
export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const { tenant } = useTenant();

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search with debouncing
  const { data: results, isLoading } = useQuery({
    queryKey: ['command-palette', query, user.role, tenant.id],
    queryFn: () => searchCommands(query, user.role, tenant.id),
    enabled: isOpen && query.length > 0,
    staleTime: 30 * 1000,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="command-palette">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search anything..."
          />
          <CommandList>
            {isLoading && <CommandLoading />}
            {!query && <RecentActions />}
            {results?.quickActions.length > 0 && (
              <CommandGroup heading="Quick Actions">
                {results.quickActions.map(action => (
                  <CommandAction key={action.id} action={action} />
                ))}
              </CommandGroup>
            )}
            {results?.pages.length > 0 && (
              <CommandGroup heading="Pages">
                {results.pages.map(page => (
                  <CommandItem key={page.path} onSelect={() => router.push(page.path)}>
                    {page.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results?.products.length > 0 && (
              <CommandGroup heading="Products">
                {results.products.map(product => (
                  <ProductCommand key={product.id} product={product} />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
```

### Search Implementation

```typescript
// Global search API with role-based filtering
export async function searchCommands(
  query: string,
  userRole: UserRole,
  tenantId: string,
): Promise<SearchResults> {
  const [quickActions, pages, products, customers, bookings] =
    await Promise.all([
      searchQuickActions(query, userRole),
      searchPages(query, userRole),
      searchProducts(query, tenantId),
      userRole !== "customer" ? searchCustomers(query, tenantId) : [],
      searchBookings(query, tenantId, userRole),
    ]);

  return {
    quickActions: quickActions.slice(0, 5),
    pages: pages.slice(0, 8),
    products: products.slice(0, 10),
    customers: customers.slice(0, 5),
    bookings: bookings.slice(0, 5),
  };
}

// Role-based quick actions
const QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  customer: [
    {
      id: "book-appointment",
      label: "Book Appointment",
      action: () => router.push("/bookings/new"),
    },
    {
      id: "reorder-last",
      label: "Reorder Last Purchase",
      action: handleReorder,
    },
    {
      id: "view-favorites",
      label: "View Favorites",
      action: () => router.push("/favorites"),
    },
    {
      id: "track-order",
      label: "Track Order",
      action: () => router.push("/orders"),
    },
  ],
  staff: [
    {
      id: "check-in-customer",
      label: "Check In Customer",
      action: handleCheckIn,
    },
    {
      id: "new-booking",
      label: "New Booking",
      action: () => router.push("/bookings/new"),
    },
    {
      id: "view-schedule",
      label: "View Schedule",
      action: () => router.push("/schedule"),
    },
    { id: "process-payment", label: "Process Payment", action: handlePayment },
  ],
  admin: [
    {
      id: "add-product",
      label: "Add Product",
      action: () => router.push("/admin/products/new"),
    },
    {
      id: "view-analytics",
      label: "View Analytics",
      action: () => router.push("/admin/analytics"),
    },
    {
      id: "manage-staff",
      label: "Manage Staff",
      action: () => router.push("/admin/staff"),
    },
    { id: "export-sales", label: "Export Sales Report", action: handleExport },
  ],
  owner: [
    {
      id: "cost-dashboard",
      label: "Cost Dashboard",
      action: () => router.push("/owner/costs"),
    },
    {
      id: "performance-overview",
      label: "Performance Overview",
      action: () => router.push("/owner/performance"),
    },
    {
      id: "tenant-management",
      label: "Tenant Management",
      action: () => router.push("/owner/tenants"),
    },
    {
      id: "support-tickets",
      label: "Support Tickets",
      action: () => router.push("/owner/support"),
    },
  ],
};
```

## 5. Mini-cart Sticky Implementation

### State Management Architecture

```typescript
// Global cart state with Zustand
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;

  // Computed values
  itemCount: number;
  subtotal: number;
  total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  addItem: (newItem) => {
    const { items } = get();
    const existingItem = items.find(
      (item) => item.productId === newItem.productId,
    );

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item,
        ),
        isOpen: true, // Auto-open on add
      });
    } else {
      set({
        items: [...items, { ...newItem, id: generateId() }],
        isOpen: true,
      });
    }

    // Track analytics
    trackEvent("cart_item_added", {
      productId: newItem.productId,
      quantity: newItem.quantity,
      value: newItem.price * newItem.quantity,
    });
  },

  // ... other actions

  get itemCount() {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  get subtotal() {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  },

  get total() {
    const subtotal = get().subtotal;
    const tax = subtotal * 0.08; // 8% tax rate
    return subtotal + tax;
  },
}));
```

### Mini-cart Component

```typescript
'use client';
export function MiniCart() {
  const { items, isOpen, itemCount, total, toggleCart, removeItem, updateQuantity } = useCartStore();
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-close after inactivity
  useEffect(() => {
    if (isOpen) {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);

      const timer = setTimeout(() => {
        useCartStore.getState().toggleCart();
      }, 5000); // Close after 5 seconds of inactivity

      setAutoCloseTimer(timer);
    }

    return () => {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [isOpen, items]);

  // Reset timer on user interaction
  const resetAutoClose = () => {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    const timer = setTimeout(() => {
      useCartStore.getState().toggleCart();
    }, 5000);
    setAutoCloseTimer(timer);
  };

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      className="mini-cart"
      onMouseEnter={resetAutoClose}
      onMouseLeave={resetAutoClose}
    >
      <div className="mini-cart-header">
        <h3>Cart ({itemCount} items)</h3>
        <button onClick={toggleCart} className="close-button">
          <X size={20} />
        </button>
      </div>

      <div className="mini-cart-items">
        {items.map(item => (
          <MiniCartItem
            key={item.id}
            item={item}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      <div className="mini-cart-footer">
        <div className="total">
          <strong>Total: ${total.toFixed(2)}</strong>
        </div>
        <div className="actions">
          <Button variant="outline" onClick={toggleCart}>
            Continue Shopping
          </Button>
          <Button
            onClick={() => router.push('/checkout')}
            className="checkout-button"
          >
            Checkout
          </Button>
        </div>
      </div>

      <UndoAction />
    </div>
  );
}

// Undo functionality for better UX
function UndoAction() {
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    const unsubscribe = useCartStore.subscribe(
      (state) => state.items,
      (items, previousItems) => {
        const removedItem = previousItems.find(prev =>
          !items.some(current => current.id === prev.id)
        );

        if (removedItem) {
          setLastRemovedItem(removedItem);
          setShowUndo(true);

          setTimeout(() => setShowUndo(false), 5000);
        }
      }
    );

    return unsubscribe;
  }, []);

  const handleUndo = () => {
    if (lastRemovedItem) {
      useCartStore.getState().addItem(lastRemovedItem);
      setShowUndo(false);
    }
  };

  if (!showUndo || !lastRemovedItem) return null;

  return (
    <div className="undo-action">
      <span>Removed {lastRemovedItem.name}</span>
      <button onClick={handleUndo}>Undo</button>
    </div>
  );
}
```

## 6. Booking "First Slot" Real-time Optimization

### Real-time Availability System

```typescript
// WebSocket connection for real-time slot updates
'use client';
export function useRealTimeAvailability(date: string, staffId?: string) {
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/availability`);

    ws.onopen = () => {
      // Subscribe to availability updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'availability',
        filters: { date, staffId }
      }));
    };

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      if (update.type === 'availability_update') {
        setAvailability(update.slots);
      }

      if (update.type === 'slot_reserved') {
        // Remove reserved slot immediately
        setAvailability(prev =>
          prev.filter(slot => slot.id !== update.slotId)
        );
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [date, staffId]);

  return { availability, socket };
}

// First available slot component
export function FirstAvailableSlot() {
  const { data: firstSlot, isLoading } = useQuery({
    queryKey: ['first-available-slot'],
    queryFn: getFirstAvailableSlot,
    staleTime: 30 * 1000, // Refresh every 30 seconds
    refetchInterval: 30 * 1000,
  });

  const bookFirstSlotMutation = useMutation({
    mutationFn: bookSlot,
    onMutate: () => {
      // Optimistically reserve the slot
      trackEvent('first_slot_booking_started');
    },
    onSuccess: () => {
      router.push('/bookings/confirmation');
      trackEvent('first_slot_booking_completed');
    },
    onError: () => {
      showErrorToast('Slot no longer available. Please try again.');
    },
  });

  if (isLoading) {
    return <FirstSlotSkeleton />;
  }

  if (!firstSlot) {
    return (
      <div className="no-slots-available">
        <p>No immediate availability</p>
        <Button onClick={() => router.push('/bookings/new')}>
          Browse All Times
        </Button>
      </div>
    );
  }

  return (
    <div className="first-available-slot">
      <div className="slot-info">
        <h3>Next Available</h3>
        <p className="time">{formatSlotTime(firstSlot)}</p>
        <p className="staff">with {firstSlot.staffName}</p>
      </div>
      <Button
        size="lg"
        className="book-first-slot"
        onClick={() => bookFirstSlotMutation.mutate(firstSlot.id)}
        disabled={bookFirstSlotMutation.isPending}
      >
        {bookFirstSlotMutation.isPending ? 'Booking...' : 'Book Now'}
      </Button>
    </div>
  );
}
```

### Slot Reservation System

```typescript
// Temporary slot reservation to prevent double booking
export async function reserveSlot(
  slotId: string,
  customerId: string,
): Promise<ReservationToken> {
  const response = await fetch("/api/bookings/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId, customerId }),
  });

  if (!response.ok) {
    throw new Error("Slot no longer available");
  }

  const { token, expiresAt } = await response.json();

  // Start countdown timer
  setTimeout(
    () => {
      releaseReservation(token);
    },
    5 * 60 * 1000,
  ); // 5 minute reservation

  return { token, expiresAt };
}

// Booking flow with slot reservation
export function useBookingFlow() {
  const [reservationToken, setReservationToken] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const reserveSlotMutation = useMutation({
    mutationFn: ({
      slotId,
      customerId,
    }: {
      slotId: string;
      customerId: string;
    }) => reserveSlot(slotId, customerId),
    onSuccess: ({ token, expiresAt }) => {
      setReservationToken(token);

      // Start countdown
      const interval = setInterval(() => {
        const remaining = Math.max(0, expiresAt - Date.now());
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setReservationToken(null);
          showWarningToast(
            "Slot reservation expired. Please select a new time.",
          );
        }
      }, 1000);
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: (bookingData: BookingData) =>
      confirmBooking({ ...bookingData, reservationToken }),
    onSuccess: () => {
      setReservationToken(null);
      router.push("/bookings/confirmation");
    },
  });

  return {
    reserveSlot: reserveSlotMutation.mutate,
    confirmBooking: confirmBookingMutation.mutate,
    timeRemaining,
    isReserved: !!reservationToken,
  };
}
```

## 7. Skeletons & Loading States

### Skeleton Component System

```typescript
// Base skeleton components
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  );
}

// Product-specific skeletons
export function ProductCardSkeleton() {
  return (
    <div className="product-card-skeleton">
      <Skeleton className="aspect-square w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Booking-specific skeletons
export function CalendarSkeleton() {
  return (
    <div className="calendar-skeleton">
      <div className="calendar-header">
        <Skeleton className="h-8 w-32" />
        <div className="calendar-nav">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="calendar-grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10" />
        ))}
      </div>
    </div>
  );
}

export function TimeSlotsSkeleton() {
  return (
    <div className="time-slots-skeleton">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="time-slots-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-20" />
        ))}
      </div>
    </div>
  );
}

// Admin dashboard skeletons
export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      <div className="stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="dashboard-content">
        <div className="chart-section">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="table-section">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="table-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="table-row">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Progressive Loading Strategy

```typescript
// Layered loading approach for optimal perceived performance
export function ProductListPage() {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <div className="product-page">
        <Suspense fallback={<FiltersSkeleton />}>
          <ProductFilters />
        </Suspense>

        <div className="product-content">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid />
          </Suspense>
        </div>
      </div>
    </Suspense>
  );
}

// Staggered skeleton animation
export function StaggeredSkeleton({ count, delay = 100 }: { count: number, delay?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-item"
          style={{
            animationDelay: `${i * delay}ms`,
          }}
        >
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </>
  );
}

// Smart skeleton that adapts to content
export function AdaptiveSkeleton({ type, ...props }: { type: 'product' | 'booking' | 'dashboard' }) {
  const skeletonMap = {
    product: ProductCardSkeleton,
    booking: TimeSlotsSkeleton,
    dashboard: DashboardSkeleton,
  };

  const SkeletonComponent = skeletonMap[type];
  return <SkeletonComponent {...props} />;
}
```

## 8. Click Events & Telemetry Integration

### Analytics Event System

```typescript
// Centralized analytics tracking system
interface ClickEvent {
  eventName: string;
  element: string;
  page: string;
  tenantId: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class AnalyticsService {
  private events: ClickEvent[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    // Auto-flush events periodically
    setInterval(() => this.flush(), this.flushInterval);

    // Flush on page unload
    window.addEventListener("beforeunload", () => this.flush());
  }

  track(eventName: string, properties: Record<string, any> = {}) {
    const event: ClickEvent = {
      eventName,
      element:
        properties.element || document.activeElement?.tagName || "unknown",
      page: window.location.pathname,
      tenantId: getTenantId(),
      userId: getUserId(),
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Flush immediately if batch is full
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      // Re-queue events on failure
      this.events.unshift(...eventsToSend);
      console.error("Failed to send analytics events:", error);
    }
  }
}

export const analytics = new AnalyticsService();
```

### Click Budget Monitoring

```typescript
// Click tracking system for budget verification
interface ClickPath {
  sessionId: string;
  userId?: string;
  tenantId: string;
  startUrl: string;
  endUrl: string;
  clicks: ClickEvent[];
  goal: "purchase" | "booking" | "reorder";
  completed: boolean;
  abandonedAt?: number;
}

class ClickBudgetTracker {
  private currentPath: ClickPath | null = null;
  private maxClicks = {
    purchase: 3,
    booking: 2,
    reorder: 1,
  };

  startTracking(goal: "purchase" | "booking" | "reorder") {
    this.currentPath = {
      sessionId: generateSessionId(),
      userId: getUserId(),
      tenantId: getTenantId(),
      startUrl: window.location.href,
      endUrl: "",
      clicks: [],
      goal,
      completed: false,
    };

    analytics.track("click_budget_tracking_started", {
      goal,
      maxClicks: this.maxClicks[goal],
    });
  }

  recordClick(element: string, action: string) {
    if (!this.currentPath) return;

    const click: ClickEvent = {
      eventName: "budget_click",
      element,
      page: window.location.pathname,
      tenantId: this.currentPath.tenantId,
      userId: this.currentPath.userId,
      properties: { action, goal: this.currentPath.goal },
      timestamp: Date.now(),
    };

    this.currentPath.clicks.push(click);

    // Check if budget exceeded
    const clickCount = this.currentPath.clicks.length;
    const maxAllowed = this.maxClicks[this.currentPath.goal];

    if (clickCount > maxAllowed) {
      analytics.track("click_budget_exceeded", {
        goal: this.currentPath.goal,
        clickCount,
        maxAllowed,
        overageAmount: clickCount - maxAllowed,
      });
    }

    analytics.track("budget_click", {
      goal: this.currentPath.goal,
      clickCount,
      maxAllowed,
      withinBudget: clickCount <= maxAllowed,
    });
  }

  completeGoal() {
    if (!this.currentPath) return;

    this.currentPath.completed = true;
    this.currentPath.endUrl = window.location.href;

    const clickCount = this.currentPath.clicks.length;
    const maxAllowed = this.maxClicks[this.currentPath.goal];
    const withinBudget = clickCount <= maxAllowed;

    analytics.track("click_budget_goal_completed", {
      goal: this.currentPath.goal,
      clickCount,
      maxAllowed,
      withinBudget,
      efficiency: withinBudget ? "optimal" : "over_budget",
      startUrl: this.currentPath.startUrl,
      endUrl: this.currentPath.endUrl,
      duration: Date.now() - this.currentPath.clicks[0]?.timestamp,
    });

    // Send full path data for analysis
    this.sendPathData();
    this.currentPath = null;
  }

  private async sendPathData() {
    if (!this.currentPath) return;

    try {
      await fetch("/api/analytics/click-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.currentPath),
      });
    } catch (error) {
      console.error("Failed to send click path data:", error);
    }
  }
}

export const clickBudgetTracker = new ClickBudgetTracker();
```

### Component-Level Tracking

```typescript
// Higher-order component for automatic click tracking
function withClickTracking<T extends object>(
  Component: React.ComponentType<T>,
  elementName: string
) {
  return function TrackedComponent(props: T) {
    const handleClick = (event: React.MouseEvent) => {
      analytics.track('click', {
        element: elementName,
        buttonText: event.currentTarget.textContent,
        position: {
          x: event.clientX,
          y: event.clientY,
        },
      });

      // Call the original onClick if it exists
      if ('onClick' in props && typeof props.onClick === 'function') {
        props.onClick(event);
      }
    };

    return <Component {...props} onClick={handleClick} />;
  };
}

// Usage examples
export const TrackedButton = withClickTracking(Button, 'button');
export const TrackedProductCard = withClickTracking(ProductCard, 'product-card');

// Specific tracking for critical flows
export function AddToCartButton({ product, ...props }: AddToCartButtonProps) {
  const addToCart = useAddToCart();

  const handleClick = () => {
    // Start purchase flow tracking
    clickBudgetTracker.startTracking('purchase');
    clickBudgetTracker.recordClick('add-to-cart-button', 'add_to_cart');

    analytics.track('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category,
      position: 'product-list', // or 'product-detail'
    });

    addToCart.mutate(product);
  };

  return (
    <Button onClick={handleClick} {...props}>
      Add to Cart
    </Button>
  );
}

export function BookFirstSlotButton({ slot, ...props }: BookFirstSlotButtonProps) {
  const bookSlot = useBookSlot();

  const handleClick = () => {
    // Start booking flow tracking
    clickBudgetTracker.startTracking('booking');
    clickBudgetTracker.recordClick('book-first-slot-button', 'book_first_slot');

    analytics.track('book_first_slot', {
      slotId: slot.id,
      staffId: slot.staffId,
      staffName: slot.staffName,
      serviceId: slot.serviceId,
      date: slot.date,
      time: slot.time,
    });

    bookSlot.mutate(slot);
  };

  return (
    <Button onClick={handleClick} {...props}>
      Book Now
    </Button>
  );
}

export function CheckoutButton(props: ButtonProps) {
  const { total, itemCount } = useCartStore();

  const handleClick = () => {
    clickBudgetTracker.recordClick('checkout-button', 'proceed_to_checkout');

    analytics.track('checkout_started', {
      cartTotal: total,
      itemCount,
      source: 'mini-cart', // or 'cart-page'
    });

    router.push('/checkout');
  };

  return (
    <Button onClick={handleClick} {...props}>
      Checkout (${total.toFixed(2)})
    </Button>
  );
}
```

## 9. Tenant Context Propagation

### Tenant Context Architecture

```typescript
// Tenant context provider with SSR support
interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  children,
  initialTenant
}: {
  children: React.ReactNode;
  initialTenant?: Tenant;
}) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant || null);
  const [isLoading, setIsLoading] = useState(!initialTenant);
  const [error, setError] = useState<Error | null>(null);

  const resolveTenant = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Tenant resolution priority from PRD
      const resolvedTenant = await resolveTenantFromContext();
      setTenant(resolvedTenant);
    } catch (err) {
      setError(err as Error);
      // Fallback to zo-system tenant
      setTenant(await getFallbackTenant());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tenant) {
      resolveTenant();
    }
  }, [tenant, resolveTenant]);

  const refresh = useCallback(async () => {
    await resolveTenant();
  }, [resolveTenant]);

  const value = useMemo(
    () => ({ tenant, isLoading, error, refresh }),
    [tenant, isLoading, error, refresh]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
```

### Tenant Resolution Logic

```typescript
// Tenant resolution following PRD priority
async function resolveTenantFromContext(): Promise<Tenant> {
  // 1. X-Tenant Header (API calls)
  const headerTenant = getHeaderTenant();
  if (headerTenant) return headerTenant;

  // 2. Subdomain (salon.sassstore.com)
  const subdomainTenant = await getSubdomainTenant();
  if (subdomainTenant) return subdomainTenant;

  // 3. Path Parameter (/t/salon-name)
  const pathTenant = await getPathTenant();
  if (pathTenant) return pathTenant;

  // 4. Cookie (development only)
  if (process.env.NODE_ENV === "development") {
    const cookieTenant = getCookieTenant();
    if (cookieTenant) return cookieTenant;
  }

  // 5. Default Fallback (zo-system)
  return getFallbackTenant();
}

function getHeaderTenant(): Tenant | null {
  if (typeof window === "undefined") return null;

  // Check if we have the header from a server action
  const headerValue = document
    .querySelector('meta[name="x-tenant"]')
    ?.getAttribute("content");
  if (headerValue) {
    return { id: headerValue, type: "header" };
  }

  return null;
}

async function getSubdomainTenant(): Promise<Tenant | null> {
  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];

  if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
    try {
      const tenant = await fetch(`/api/tenants/by-subdomain/${subdomain}`).then(
        (r) => r.json(),
      );
      return { ...tenant, type: "subdomain" };
    } catch {
      return null;
    }
  }

  return null;
}

async function getPathTenant(): Promise<Tenant | null> {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/t\/([^\/]+)/);

  if (match) {
    const tenantSlug = match[1];
    try {
      const tenant = await fetch(`/api/tenants/by-slug/${tenantSlug}`).then(
        (r) => r.json(),
      );
      return { ...tenant, type: "path" };
    } catch {
      return null;
    }
  }

  return null;
}

function getCookieTenant(): Tenant | null {
  const cookies = document.cookie.split(";");
  const tenantCookie = cookies.find((c) => c.trim().startsWith("dev-tenant="));

  if (tenantCookie) {
    const tenantId = tenantCookie.split("=")[1];
    return { id: tenantId, type: "cookie" };
  }

  return null;
}

async function getFallbackTenant(): Promise<Tenant> {
  return {
    id: "zo-system",
    name: "Sass Store Demo",
    slug: "zo-system",
    type: "fallback",
    settings: {
      theme: "default",
      features: ["products", "bookings", "cart"],
      branding: {
        primaryColor: "#0ea5e9",
        logo: "/images/zo-system-logo.png",
      },
    },
  };
}
```

### Tenant-Aware Components

```typescript
// HOC for tenant-aware components
function withTenant<T extends object>(Component: React.ComponentType<T & { tenant: Tenant }>) {
  return function TenantAwareComponent(props: T) {
    const { tenant, isLoading } = useTenant();

    if (isLoading) {
      return <TenantLoadingSkeleton />;
    }

    if (!tenant) {
      return <TenantErrorFallback />;
    }

    return <Component {...props} tenant={tenant} />;
  };
}

// Tenant-specific styling
export function useTenantTheme() {
  const { tenant } = useTenant();

  return useMemo(() => {
    if (!tenant?.settings?.branding) {
      return defaultTheme;
    }

    return {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: tenant.settings.branding.primaryColor || defaultTheme.colors.primary,
      },
    };
  }, [tenant]);
}

// Tenant-aware API calls
export function useTenantApi() {
  const { tenant } = useTenant();

  return useMemo(() => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant': tenant?.id || 'zo-system',
    };

    return {
      get: (url: string) => fetch(url, { headers }),
      post: (url: string, data: any) =>
        fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        }),
      put: (url: string, data: any) =>
        fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        }),
      delete: (url: string) =>
        fetch(url, { method: 'DELETE', headers }),
    };
  }, [tenant]);
}
```

## 10. Performance Optimization Strategy

### Core Web Vitals Implementation

```typescript
// Performance monitoring and optimization
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      analytics.track('web_vital_lcp', {
        value: lastEntry.startTime,
        target: 2500, // 2.5s target
        rating: lastEntry.startTime <= 2500 ? 'good' :
               lastEntry.startTime <= 4000 ? 'needs_improvement' : 'poor',
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Interaction to Next Paint (INP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        analytics.track('web_vital_inp', {
          value: entry.processingStart - entry.startTime,
          target: 200, // 200ms target
          rating: entry.processingStart - entry.startTime <= 200 ? 'good' :
                 entry.processingStart - entry.startTime <= 500 ? 'needs_improvement' : 'poor',
        });
      });
    }).observe({ entryTypes: ['event'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      analytics.track('web_vital_cls', {
        value: clsValue,
        target: 0.1, // 0.1 target
        rating: clsValue <= 0.1 ? 'good' :
               clsValue <= 0.25 ? 'needs_improvement' : 'poor',
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }, []);
}

// Image optimization component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  ...props
}: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      formats={['image/avif', 'image/webp']}
      {...props}
    />
  );
}

// Lazy loading component with intersection observer
export function LazyLoad({
  children,
  threshold = 0.1,
  rootMargin = '50px'
}: {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="lazy-placeholder" />}
    </div>
  );
}
```

### Bundle Optimization

```typescript
// Dynamic imports for code splitting
const CommandPalette = dynamic(() => import('./CommandPalette'), {
  ssr: false,
  loading: () => <div className="command-palette-loading" />,
});

const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <DashboardSkeleton />,
});

const BookingCalendar = dynamic(() => import('./BookingCalendar'), {
  loading: () => <CalendarSkeleton />,
});

// Route-based code splitting
export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="products-layout">
      <Suspense fallback={<FiltersSkeleton />}>
        {/* Filters loaded eagerly as they're above the fold */}
        <ProductFilters />
      </Suspense>

      <div className="products-content">
        <LazyLoad>
          {/* Product grid lazy loaded */}
          {children}
        </LazyLoad>
      </div>

      <LazyLoad threshold={0.3}>
        {/* Related products section */}
        <RelatedProducts />
      </LazyLoad>
    </div>
  );
}
```

This comprehensive architecture plan provides a solid foundation for building a high-performance, RSC-optimized Next.js application that meets all the requirements from the PRD, including the critical click budget constraints, UX requirements, and performance targets. The plan emphasizes mobile-first design, progressive enhancement, and real-time features while maintaining excellent Core Web Vitals scores.

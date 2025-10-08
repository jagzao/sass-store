# Architecture Document - Sass Store Multitenant Platform

## Overview

Clean Architecture with CQRS pattern, multitenant isolation via RLS, optimized for ≤$5/month operational costs with scale-to-zero capabilities.

## Core Architecture Principles

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│              Web/API Layer              │ ← Controllers, Middleware
├─────────────────────────────────────────┤
│            Application Layer            │ ← MediatR, Commands/Queries
├─────────────────────────────────────────┤
│              Domain Layer               │ ← Entities, Value Objects
├─────────────────────────────────────────┤
│           Infrastructure Layer          │ ← Database, External APIs
└─────────────────────────────────────────┘
```

### CQRS with MediatR

- **Commands**: Write operations (CreateBooking, UpdateProduct)
- **Queries**: Read operations (GetProducts, GetTenantBookings)
- **Handlers**: One handler per command/query
- **Pipeline**: Validation, logging, caching behaviors

## Tenant Resolution Strategy

### Resolution Priority (First Match Wins)

1. **X-Tenant Header**: `X-Tenant: wondernails`
2. **Subdomain**: `wondernails.sassstore.com`
3. **Path Parameter**: `/t/wondernails/products`
4. **Cookie**: `tenant=wondernails` (development only)
5. **Default Fallback**: `zo-system`

### Implementation

```csharp
public class TenantResolver : ITenantResolver
{
    public async Task<string> ResolveTenantAsync(HttpContext context)
    {
        // 1. Check X-Tenant header
        if (context.Request.Headers.TryGetValue("X-Tenant", out var headerValue))
            return await ValidateTenantAsync(headerValue);

        // 2. Check subdomain
        var host = context.Request.Host.Host;
        if (host != "sassstore.com" && host.EndsWith(".sassstore.com"))
        {
            var subdomain = host.Replace(".sassstore.com", "");
            return await ValidateTenantAsync(subdomain);
        }

        // 3. Check path parameter
        if (context.Request.Path.StartsWithSegments("/t"))
        {
            var segments = context.Request.Path.Value.Split('/');
            if (segments.Length > 2)
                return await ValidateTenantAsync(segments[2]);
        }

        // 4. Check cookie (dev only)
        if (context.Request.Cookies.TryGetValue("tenant", out var cookieValue))
            return await ValidateTenantAsync(cookieValue);

        // 5. Default fallback
        return "zo-system";
    }
}
```

## Error Handling (No Control-Flow Exceptions)

### Domain Error Codes

```csharp
public enum ErrorCode
{
    TenantNotFound = 1001,
    ProductNotFound = 1002,
    BookingConflict = 1003,
    QuotaExceeded = 1004,
    ValidationFailed = 1005
}

public class Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public ErrorCode? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    public static Result<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public static Result<T> Failure(ErrorCode code, string message) => new()
    {
        IsSuccess = false,
        ErrorCode = code,
        ErrorMessage = message
    };
}
```

### ProblemDetails Mapping

```csharp
public class ErrorMappingMiddleware
{
    private static readonly Dictionary<ErrorCode, (int status, string type)> ErrorMappings = new()
    {
        { ErrorCode.TenantNotFound, (404, "tenant-not-found") },
        { ErrorCode.ProductNotFound, (404, "product-not-found") },
        { ErrorCode.BookingConflict, (409, "booking-conflict") },
        { ErrorCode.QuotaExceeded, (429, "quota-exceeded") },
        { ErrorCode.ValidationFailed, (400, "validation-failed") }
    };
}
```

## Data Layer & Row-Level Security

### Database Design

```sql
-- All tenant tables include tenant_id
CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(50) UNIQUE NOT NULL,
    name varchar(100) NOT NULL,
    created_at timestamp DEFAULT now()
);

CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    sku varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    price decimal(10,2) NOT NULL,
    UNIQUE(tenant_id, sku)
);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
    FOR ALL TO application_role
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Entity Framework Configuration

```csharp
public class ApplicationDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Global query filters for tenant isolation
        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == _tenantProvider.TenantId);

        // Soft delete global filter
        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => !p.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Automatically set tenant_id for new entities
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.TenantId = _tenantProvider.TenantId;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
```

## Media Pipeline (Cloudflare R2)

### Optimization Pipeline

```
Upload → EXIF Strip → Format Convert → Resize → Generate Variants → Store → Index
```

### Media Processing Service

```csharp
public class MediaProcessingService
{
    public async Task<MediaAsset> ProcessImageAsync(Stream imageStream, MediaRequest request)
    {
        // 1. Strip EXIF data
        var cleanImage = await StripExifAsync(imageStream);

        // 2. Generate variants
        var variants = new Dictionary<string, byte[]>();

        foreach (var size in request.Variants)
        {
            var resized = await ResizeImageAsync(cleanImage, size);

            // Try AVIF first, fallback to WebP, then JPEG
            variants[$"{size.Name}.avif"] = await ConvertToAvifAsync(resized);
            variants[$"{size.Name}.webp"] = await ConvertToWebPAsync(resized);
            variants[$"{size.Name}.jpg"] = await ConvertToJpegAsync(resized, 85);
        }

        // 3. Generate metadata
        var dominantColor = await ExtractDominantColorAsync(cleanImage);
        var blurhash = await GenerateBlurhashAsync(cleanImage);
        var contentHash = ComputeContentHash(imageStream);

        // 4. Store in R2
        var asset = new MediaAsset
        {
            Id = Guid.NewGuid(),
            TenantId = request.TenantId,
            ContentHash = contentHash,
            DominantColor = dominantColor,
            Blurhash = blurhash,
            Variants = variants.Keys.ToList()
        };

        await _r2Service.UploadVariantsAsync(asset, variants);
        return asset;
    }
}
```

### R2 Storage Structure

```
tenants/{tenant_slug}/
├── branding/
│   ├── logo.{variant}.{ext}
│   └── banner.{variant}.{ext}
├── products/
│   └── {sku}/
│       ├── hero.{variant}.{ext}
│       └── gallery-{n}.{variant}.{ext}
├── services/
│   └── {service_id}/
│       └── image.{variant}.{ext}
├── staff/
│   └── {staff_id}/
│       └── photo.{variant}.{ext}
└── gallery/
    └── {asset_id}/
        ├── thumb.{ext}
        ├── card.{ext}
        └── hd.{ext}
```

## Cost Management & Resource Limits

### Infrastructure Cost Map

- **Cloudflare Pages**: $0 (free tier)
- **Cloud Run/Fly.io**: $0-2 (1 instance max, scale-to-zero)
- **Neon Database**: $0-1 (autosuspend, branch PRs)
- **Cloudflare R2**: $0-1 (10GB storage, 1M operations)
- **Upstash Redis**: $0-1 (rate limiting, queues)
- **Monitoring**: <$1 (essential metrics only)

### Cost Sentinel (Daily Worker)

```javascript
// Cloudflare Worker - runs daily
export default {
  async scheduled(event, env, ctx) {
    const usage = await gatherUsageMetrics(env);
    const budgets = await getBudgetLimits(env);

    for (const [tenant, tenantUsage] of Object.entries(usage)) {
      const percentage = (tenantUsage.cost / budgets[tenant].monthly) * 100;

      if (percentage >= 100) {
        await enableKillSwitch(tenant);
        await sendAlert(tenant, "CRITICAL: Kill switch activated");
      } else if (percentage >= 90) {
        await enableFreezeMode(tenant);
        await sendAlert(tenant, "WARNING: Freeze mode activated");
      } else if (percentage >= 80) {
        await sendAlert(tenant, "WARNING: 80% budget consumed");
      } else if (percentage >= 50) {
        await enableEcoMode(tenant);
        await sendAlert(tenant, "INFO: Eco mode activated");
      }
    }
  },
};
```

### Feature Flags

```csharp
public class FeatureFlags
{
    public bool EcoMode { get; set; }           // Reduce image quality, aggressive caching
    public bool FreezeMode { get; set; }       // Read-only mode, essential operations only
    public bool KillSwitch { get; set; }       // Maintenance mode, core services only
    public bool ImageOptimize { get; set; }    // Enable/disable image processing
    public bool ImageVariants { get; set; }    // Generate multiple image variants
    public bool RealTimeSync { get; set; }     // Enable real-time features
    public bool AdvancedAnalytics { get; set; } // Detailed tracking and reporting
}
```

## Security & Compliance

### Rate Limiting (Per-Tenant)

```csharp
public class TenantRateLimitMiddleware
{
    private readonly IRedisDatabase _redis;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var tenantId = context.GetTenantId();
        var endpoint = context.Request.Path;
        var key = $"rate_limit:{tenantId}:{endpoint}";

        var current = await _redis.StringIncrementAsync(key);
        if (current == 1)
            await _redis.KeyExpireAsync(key, TimeSpan.FromMinutes(1));

        var limit = await GetRateLimitAsync(tenantId, endpoint);
        if (current > limit)
        {
            context.Response.StatusCode = 429;
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
        }

        await next(context);
    }
}
```

### RLS Testing Strategy

```csharp
[Test]
public async Task Product_RLS_PreventsCrossTenantAccess()
{
    // Arrange
    var tenant1Id = await CreateTenantAsync("tenant1");
    var tenant2Id = await CreateTenantAsync("tenant2");

    var product1 = await CreateProductAsync(tenant1Id, "product-1");
    var product2 = await CreateProductAsync(tenant2Id, "product-2");

    // Act - Query as tenant1
    using var scope1 = _serviceProvider.CreateScope();
    scope1.ServiceProvider.GetService<ITenantProvider>()
        .SetTenant(tenant1Id);

    var products1 = await scope1.ServiceProvider
        .GetService<IProductRepository>()
        .GetAllAsync();

    // Assert - tenant1 only sees their products
    Assert.Single(products1);
    Assert.Equal(product1.Id, products1.First().Id);
}
```

### Audit Trail

```csharp
public class AuditEntry
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string UserId { get; set; }
    public string Action { get; set; }
    public string EntityType { get; set; }
    public string EntityId { get; set; }
    public string Changes { get; set; } // JSON
    public DateTime Timestamp { get; set; }
    public string IpAddress { get; set; }
    public string UserAgent { get; set; }
}
```

## API Design & Contracts

### OpenAPI Specification

- **Versioned APIs**: `/api/v1/products`
- **Tenant context**: Resolved from headers/subdomain
- **Standardized responses**: ProblemDetails for errors
- **Rate limiting**: Per-tenant quotas
- **Authentication**: JWT with tenant claims

### Contact & Maps Integration

```csharp
public class TenantContactInfo
{
    public string Phone { get; set; }
    public string Email { get; set; }
    public string Address { get; set; }
    public string GooglePlaceId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public BusinessHours Hours { get; set; }
    public string GoogleCalendarId { get; set; } // For bookings
}
```

### Google Calendar Integration

```csharp
public class BookingService
{
    public async Task<Result<Booking>> CreateBookingAsync(CreateBookingCommand command)
    {
        // 1. Check availability in local calendar
        var isAvailable = await _calendarService.IsSlotAvailableAsync(
            command.StaffId, command.StartTime, command.Duration);

        if (!isAvailable)
            return Result<Booking>.Failure(ErrorCode.BookingConflict, "Slot not available");

        // 2. Create local booking
        var booking = new Booking(command);
        await _repository.AddAsync(booking);

        // 3. Sync with Google Calendar
        var tenant = await _tenantService.GetAsync(command.TenantId);
        if (!string.IsNullOrEmpty(tenant.GoogleCalendarId))
        {
            await _googleCalendarService.CreateEventAsync(
                tenant.GoogleCalendarId, booking);
        }

        return Result<Booking>.Success(booking);
    }
}
```

## Deployment & Scaling

### Infrastructure as Code

```yaml
# docker-compose.yml (development)
version: "3.8"
services:
  api:
    build: .
    environment:
      - ConnectionStrings__DefaultConnection=${DATABASE_URL}
      - R2__AccessKey=${R2_ACCESS_KEY}
    ports:
      - "5000:5000"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sassstore
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Production Deployment

- **API**: Cloud Run (1 instance max, scale-to-zero)
- **Database**: Neon (autosuspend after 5 minutes)
- **Frontend**: Cloudflare Pages
- **Media**: Cloudflare R2
- **Cache**: Upstash Redis
- **Monitoring**: Cloudflare Analytics + Sentry

### Auto-scaling Limits

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: sass-store-api
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "1"
        run.googleapis.com/cpu-throttling: "true"
        run.googleapis.com/memory: "512Mi"
        run.googleapis.com/cpu: "1000m"
```

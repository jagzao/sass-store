# Backend API Implementation Plan

_Multitenant SaaS Platform with Clean Architecture, CQRS, and Robust Error Handling_

## 1. Tenant Resolution Implementation

### 1.1 Tenant Resolution Strategy

```csharp
public interface ITenantResolver
{
    Task<Result<TenantContext>> ResolveTenantAsync(HttpContext context);
}

public class TenantContext
{
    public Guid TenantId { get; init; }
    public string TenantSlug { get; init; }
    public string ResolutionMethod { get; init; } // Header, Subdomain, Path, Cookie, Default
    public bool IsSystemTenant => TenantSlug == "zo-system";
}

public class TenantResolver : ITenantResolver
{
    private readonly ITenantCacheService _cache;
    private readonly ILogger<TenantResolver> _logger;

    public async Task<Result<TenantContext>> ResolveTenantAsync(HttpContext context)
    {
        // Priority order resolution with fallback to zo-system
        var candidates = new[]
        {
            await TryResolveFromHeader(context),
            await TryResolveFromSubdomain(context),
            await TryResolveFromPath(context),
            await TryResolveFromCookie(context) // Dev only
        };

        foreach (var candidate in candidates.Where(c => c.IsSuccess))
        {
            var validated = await ValidateTenantAsync(candidate.Value);
            if (validated.IsSuccess)
            {
                _logger.LogInformation("Tenant resolved: {TenantSlug} via {Method}",
                    validated.Value.TenantSlug, validated.Value.ResolutionMethod);
                return validated;
            }
        }

        // Default fallback to zo-system
        var systemTenant = new TenantContext
        {
            TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            TenantSlug = "zo-system",
            ResolutionMethod = "Default"
        };

        _logger.LogWarning("No valid tenant found, using default: zo-system");
        return Result<TenantContext>.Success(systemTenant);
    }
}
```

### 1.2 Tenant Validation & Caching

```csharp
public class TenantCacheService : ITenantCacheService
{
    private readonly IDistributedCache _cache;
    private readonly ITenantRepository _repository;

    public async Task<Result<TenantContext>> ValidateTenantAsync(string tenantSlug)
    {
        // Check cache first (5-minute TTL)
        var cacheKey = $"tenant:{tenantSlug}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            var tenant = JsonSerializer.Deserialize<TenantContext>(cached);
            return Result<TenantContext>.Success(tenant);
        }

        // Fallback to database
        var dbTenant = await _repository.GetBySlugAsync(tenantSlug);
        if (dbTenant == null)
        {
            return Result<TenantContext>.Failure(
                ErrorCode.TenantNotFound,
                $"Tenant '{tenantSlug}' not found"
            );
        }

        var context = new TenantContext
        {
            TenantId = dbTenant.Id,
            TenantSlug = dbTenant.Slug,
            ResolutionMethod = "Database"
        };

        // Cache for 5 minutes
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(context),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) });

        return Result<TenantContext>.Success(context);
    }
}
```

## 2. Error Mapping & ProblemDetails

### 2.1 Comprehensive Error Code System

```csharp
public enum ErrorCode
{
    // Tenant Errors (1000-1099)
    TenantNotFound = 1001,
    TenantInactive = 1002,
    TenantQuotaExceeded = 1003,
    TenantRateLimited = 1004,

    // Authentication/Authorization (1100-1199)
    Unauthorized = 1101,
    Forbidden = 1102,
    TokenExpired = 1103,
    InvalidApiKey = 1104,

    // Product Errors (1200-1299)
    ProductNotFound = 1201,
    ProductSkuConflict = 1202,
    ProductInvalidCategory = 1203,
    ProductImageQuotaExceeded = 1204,

    // Booking Errors (1300-1399)
    BookingNotFound = 1301,
    BookingConflict = 1302,
    BookingSlotUnavailable = 1303,
    BookingCancellationFailed = 1304,
    GoogleCalendarSyncFailed = 1305,

    // Media Errors (1400-1499)
    MediaNotFound = 1401,
    MediaQuotaExceeded = 1402,
    MediaInvalidFormat = 1403,
    MediaProcessingFailed = 1404,
    MediaUploadFailed = 1405,

    // Validation Errors (1500-1599)
    ValidationFailed = 1501,
    InvalidEmailFormat = 1502,
    InvalidPhoneFormat = 1503,
    RequiredFieldMissing = 1504,

    // External Service Errors (1600-1699)
    GoogleMapsApiError = 1601,
    GoogleCalendarApiError = 1602,
    PaymentProcessingError = 1603,
    EmailDeliveryFailed = 1604,

    // System Errors (1700-1799)
    DatabaseConnectionFailed = 1701,
    CacheUnavailable = 1702,
    ConfigurationError = 1703,
    InternalServerError = 1704
}
```

### 2.2 Result Pattern Implementation

```csharp
public class Result<T>
{
    public bool IsSuccess { get; init; }
    public T? Value { get; init; }
    public ErrorCode? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public Dictionary<string, string[]>? ValidationErrors { get; init; }

    public static Result<T> Success(T value) => new()
    {
        IsSuccess = true,
        Value = value
    };

    public static Result<T> Failure(ErrorCode code, string message) => new()
    {
        IsSuccess = false,
        ErrorCode = code,
        ErrorMessage = message
    };

    public static Result<T> ValidationFailure(Dictionary<string, string[]> errors) => new()
    {
        IsSuccess = false,
        ErrorCode = ErrorCode.ValidationFailed,
        ErrorMessage = "Validation failed",
        ValidationErrors = errors
    };

    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<ErrorCode, string, TResult> onFailure)
    {
        return IsSuccess
            ? onSuccess(Value!)
            : onFailure(ErrorCode!.Value, ErrorMessage!);
    }
}
```

### 2.3 ProblemDetails Mapping Middleware

```csharp
public class ErrorMappingMiddleware
{
    private static readonly Dictionary<ErrorCode, (int Status, string Type, string Title)> ErrorMappings = new()
    {
        // Tenant Errors
        { ErrorCode.TenantNotFound, (404, "tenant-not-found", "Tenant Not Found") },
        { ErrorCode.TenantInactive, (403, "tenant-inactive", "Tenant Inactive") },
        { ErrorCode.TenantQuotaExceeded, (429, "tenant-quota-exceeded", "Tenant Quota Exceeded") },
        { ErrorCode.TenantRateLimited, (429, "tenant-rate-limited", "Rate Limit Exceeded") },

        // Product Errors
        { ErrorCode.ProductNotFound, (404, "product-not-found", "Product Not Found") },
        { ErrorCode.ProductSkuConflict, (409, "product-sku-conflict", "Product SKU Conflict") },

        // Booking Errors
        { ErrorCode.BookingConflict, (409, "booking-conflict", "Booking Conflict") },
        { ErrorCode.BookingSlotUnavailable, (409, "booking-slot-unavailable", "Time Slot Unavailable") },

        // Media Errors
        { ErrorCode.MediaQuotaExceeded, (413, "media-quota-exceeded", "Media Storage Quota Exceeded") },
        { ErrorCode.MediaInvalidFormat, (400, "media-invalid-format", "Invalid Media Format") },

        // Validation Errors
        { ErrorCode.ValidationFailed, (400, "validation-failed", "Validation Failed") },
    };

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (ResultException ex)
        {
            await HandleResultExceptionAsync(context, ex);
        }
    }

    private async Task HandleResultExceptionAsync(HttpContext context, ResultException ex)
    {
        if (!ErrorMappings.TryGetValue(ex.ErrorCode, out var mapping))
        {
            mapping = (500, "internal-server-error", "Internal Server Error");
        }

        var problemDetails = new ProblemDetails
        {
            Type = $"https://api.sassstore.com/errors/{mapping.Type}",
            Title = mapping.Title,
            Detail = ex.Message,
            Status = mapping.Status,
            Instance = context.Request.Path
        };

        // Add validation errors if present
        if (ex.ValidationErrors?.Any() == true)
        {
            problemDetails.Extensions["errors"] = ex.ValidationErrors;
        }

        // Add tenant context
        if (context.Items.TryGetValue("TenantContext", out var tenantContext))
        {
            problemDetails.Extensions["tenant"] = ((TenantContext)tenantContext).TenantSlug;
        }

        context.Response.StatusCode = mapping.Status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
```

## 3. OpenAPI Contracts & Versioning

### 3.1 API Design Standards

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
[Produces("application/json")]
public abstract class BaseController : ControllerBase
{
    protected IMediator Mediator => HttpContext.RequestServices.GetRequiredService<IMediator>();

    protected TenantContext TenantContext =>
        (TenantContext)HttpContext.Items["TenantContext"]!;

    protected IActionResult HandleResult<T>(Result<T> result)
    {
        return result.Match(
            onSuccess: value => Ok(value),
            onFailure: (code, message) => throw new ResultException(code, message)
        );
    }
}
```

### 3.2 Products API Contract

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/products")]
[ApiVersion("1.0")]
public class ProductsController : BaseController
{
    /// <summary>
    /// Get all products for the current tenant
    /// </summary>
    /// <param name="query">Product query parameters</param>
    /// <returns>Paginated list of products</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProducts([FromQuery] GetProductsQuery query)
    {
        query.TenantId = TenantContext.TenantId;
        var result = await Mediator.Send(query);
        return HandleResult(result);
    }

    /// <summary>
    /// Get a specific product by SKU
    /// </summary>
    /// <param name="sku">Product SKU</param>
    /// <returns>Product details</returns>
    [HttpGet("{sku}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProduct(string sku)
    {
        var query = new GetProductBySkuQuery(TenantContext.TenantId, sku);
        var result = await Mediator.Send(query);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    /// <param name="command">Product creation data</param>
    /// <returns>Created product</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductCommand command)
    {
        command.TenantId = TenantContext.TenantId;
        var result = await Mediator.Send(command);

        return result.Match(
            onSuccess: product => CreatedAtAction(
                nameof(GetProduct),
                new { sku = product.Sku },
                product),
            onFailure: (code, message) => throw new ResultException(code, message)
        );
    }
}
```

### 3.3 Bookings API Contract

```csharp
[ApiController]
[Route("api/v{version:apiVersion}/bookings")]
[ApiVersion("1.0")]
public class BookingsController : BaseController
{
    /// <summary>
    /// Get available time slots for a service
    /// </summary>
    /// <param name="serviceId">Service ID</param>
    /// <param name="staffId">Optional staff member ID</param>
    /// <param name="date">Date to check availability</param>
    /// <returns>List of available time slots</returns>
    [HttpGet("availability")]
    [ProducesResponseType(typeof(List<TimeSlotDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailability(
        [FromQuery] Guid serviceId,
        [FromQuery] Guid? staffId,
        [FromQuery] DateOnly date)
    {
        var query = new GetAvailabilityQuery(TenantContext.TenantId, serviceId, staffId, date);
        var result = await Mediator.Send(query);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a new booking
    /// </summary>
    /// <param name="command">Booking creation data</param>
    /// <returns>Created booking with confirmation details</returns>
    [HttpPost]
    [ProducesResponseType(typeof(BookingConfirmationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingCommand command)
    {
        command.TenantId = TenantContext.TenantId;
        var result = await Mediator.Send(command);

        return result.Match(
            onSuccess: booking => CreatedAtAction(
                nameof(GetBooking),
                new { id = booking.Id },
                booking),
            onFailure: (code, message) => throw new ResultException(code, message)
        );
    }
}
```

## 4. Rate Limiting Implementation

### 4.1 Per-Tenant Rate Limiting

```csharp
public class TenantRateLimitMiddleware
{
    private readonly IDistributedCache _cache;
    private readonly ILogger<TenantRateLimitMiddleware> _logger;
    private readonly RateLimitOptions _options;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var tenantContext = (TenantContext)context.Items["TenantContext"]!;
        var endpoint = GetEndpointIdentifier(context);

        var rateLimitResult = await CheckRateLimitAsync(tenantContext, endpoint, context.Request.Method);

        if (!rateLimitResult.IsAllowed)
        {
            await HandleRateLimitExceededAsync(context, rateLimitResult);
            return;
        }

        // Add rate limit headers
        context.Response.Headers.Add("X-RateLimit-Limit", rateLimitResult.Limit.ToString());
        context.Response.Headers.Add("X-RateLimit-Remaining", rateLimitResult.Remaining.ToString());
        context.Response.Headers.Add("X-RateLimit-Reset", rateLimitResult.ResetTime.ToString());

        await next(context);
    }

    private async Task<RateLimitResult> CheckRateLimitAsync(
        TenantContext tenant,
        string endpoint,
        string method)
    {
        var key = $"rate_limit:{tenant.TenantSlug}:{endpoint}:{method}";
        var limit = GetRateLimit(tenant, endpoint, method);
        var window = GetTimeWindow(endpoint);

        var current = await IncrementCounterAsync(key, window);

        return new RateLimitResult
        {
            IsAllowed = current <= limit,
            Limit = limit,
            Remaining = Math.Max(0, limit - current),
            ResetTime = DateTimeOffset.UtcNow.Add(window)
        };
    }

    private int GetRateLimit(TenantContext tenant, string endpoint, string method)
    {
        // Different limits based on tenant tier and endpoint
        return endpoint switch
        {
            "/api/v1/products" when method == "GET" => tenant.IsSystemTenant ? 1000 : 100,
            "/api/v1/products" when method == "POST" => tenant.IsSystemTenant ? 100 : 20,
            "/api/v1/bookings" when method == "POST" => 30, // Strict booking limits
            "/api/v1/media" when method == "POST" => 10, // Media uploads
            _ => tenant.IsSystemTenant ? 500 : 50
        };
    }
}
```

### 4.2 Adaptive Rate Limiting

```csharp
public class AdaptiveRateLimitService : IAdaptiveRateLimitService
{
    public async Task<int> CalculateAdaptiveLimitAsync(TenantContext tenant, string endpoint)
    {
        // Check tenant's recent usage patterns
        var usage = await GetUsageMetricsAsync(tenant.TenantId);
        var baseLimit = GetBaseLimitAsync(tenant, endpoint);

        // Increase limits for well-behaved tenants
        if (usage.ErrorRate < 0.01 && usage.AvgResponseTime < 200)
        {
            return (int)(baseLimit * 1.5);
        }

        // Decrease limits for problematic tenants
        if (usage.ErrorRate > 0.05 || usage.AvgResponseTime > 1000)
        {
            return (int)(baseLimit * 0.5);
        }

        return baseLimit;
    }
}
```

## 5. Outbox/Inbox Pattern Implementation

### 5.1 Outbox Pattern for Reliable Event Publishing

```csharp
public class OutboxEvent
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string EventType { get; set; }
    public string AggregateId { get; set; }
    public string EventData { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int RetryCount { get; set; }
    public string? ErrorMessage { get; set; }
}

public class OutboxService : IOutboxService
{
    private readonly ApplicationDbContext _context;
    private readonly IEventPublisher _eventPublisher;

    public async Task PublishEventAsync<T>(T eventData, Guid tenantId, string aggregateId)
        where T : class
    {
        var outboxEvent = new OutboxEvent
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EventType = typeof(T).Name,
            AggregateId = aggregateId,
            EventData = JsonSerializer.Serialize(eventData),
            CreatedAt = DateTime.UtcNow
        };

        _context.OutboxEvents.Add(outboxEvent);
        await _context.SaveChangesAsync();
    }

    public async Task ProcessPendingEventsAsync()
    {
        var pendingEvents = await _context.OutboxEvents
            .Where(e => e.ProcessedAt == null && e.RetryCount < 3)
            .OrderBy(e => e.CreatedAt)
            .Take(100)
            .ToListAsync();

        foreach (var eventRecord in pendingEvents)
        {
            try
            {
                await _eventPublisher.PublishAsync(eventRecord.EventType, eventRecord.EventData);

                eventRecord.ProcessedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                eventRecord.RetryCount++;
                eventRecord.ErrorMessage = ex.Message;
                await _context.SaveChangesAsync();
            }
        }
    }
}
```

### 5.2 Domain Events Integration

```csharp
public abstract class AggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = new();

    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}

public class BookingCreatedEvent : IDomainEvent
{
    public Guid BookingId { get; init; }
    public Guid TenantId { get; init; }
    public Guid CustomerId { get; init; }
    public Guid ServiceId { get; init; }
    public DateTime BookingTime { get; init; }
    public string CustomerEmail { get; init; }
    public DateTime OccurredOn { get; init; } = DateTime.UtcNow;
}

// In the booking aggregate
public class Booking : AggregateRoot
{
    public static Booking Create(CreateBookingCommand command)
    {
        var booking = new Booking(command);

        // Raise domain event
        booking.AddDomainEvent(new BookingCreatedEvent
        {
            BookingId = booking.Id,
            TenantId = booking.TenantId,
            CustomerId = booking.CustomerId,
            ServiceId = booking.ServiceId,
            BookingTime = booking.StartTime,
            CustomerEmail = booking.CustomerEmail
        });

        return booking;
    }
}
```

## 6. Contact & Maps Integration

### 6.1 Google Places Integration

```csharp
public class GooglePlacesService : IGooglePlacesService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public async Task<Result<PlaceDetails>> GetPlaceDetailsAsync(string placeId, Guid tenantId)
    {
        try
        {
            var apiKey = await GetTenantGoogleApiKeyAsync(tenantId);
            if (string.IsNullOrEmpty(apiKey))
            {
                return Result<PlaceDetails>.Failure(
                    ErrorCode.GoogleMapsApiError,
                    "Google API key not configured for tenant");
            }

            var url = $"https://maps.googleapis.com/maps/api/place/details/json" +
                     $"?place_id={placeId}&key={apiKey}&fields=name,formatted_address,geometry,formatted_phone_number,business_status";

            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GooglePlaceResponse>(content);

            if (result.Status != "OK")
            {
                return Result<PlaceDetails>.Failure(
                    ErrorCode.GoogleMapsApiError,
                    $"Google Places API error: {result.Status}");
            }

            return Result<PlaceDetails>.Success(result.Result);
        }
        catch (Exception ex)
        {
            return Result<PlaceDetails>.Failure(
                ErrorCode.GoogleMapsApiError,
                $"Failed to fetch place details: {ex.Message}");
        }
    }
}
```

### 6.2 Tenant Contact Information Management

```csharp
public class TenantContactInfo
{
    public Guid TenantId { get; set; }
    public string BusinessName { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public string Address { get; set; }
    public string? GooglePlaceId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public BusinessHours Hours { get; set; }
    public string? Website { get; set; }
    public SocialMediaLinks? SocialMedia { get; set; }
}

public class ContactInfoService : IContactInfoService
{
    public async Task<Result<TenantContactInfo>> UpdateContactInfoAsync(
        Guid tenantId,
        UpdateContactInfoCommand command)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant == null)
        {
            return Result<TenantContactInfo>.Failure(
                ErrorCode.TenantNotFound,
                "Tenant not found");
        }

        // Validate and geocode address if provided
        if (!string.IsNullOrEmpty(command.Address))
        {
            var geocodeResult = await _geocodingService.GeocodeAddressAsync(command.Address);
            if (geocodeResult.IsSuccess)
            {
                command.Latitude = geocodeResult.Value.Latitude;
                command.Longitude = geocodeResult.Value.Longitude;
                command.GooglePlaceId = geocodeResult.Value.PlaceId;
            }
        }

        // Update contact information
        tenant.UpdateContactInfo(command);
        await _tenantRepository.UpdateAsync(tenant);

        return Result<TenantContactInfo>.Success(tenant.ContactInfo);
    }
}
```

## 7. Google Calendar Integration

### 7.1 Calendar Service Implementation

```csharp
public class GoogleCalendarService : IGoogleCalendarService
{
    private readonly ICredentialService _credentialService;
    private readonly ILogger<GoogleCalendarService> _logger;

    public async Task<Result<string>> CreateBookingEventAsync(
        Guid tenantId,
        Booking booking)
    {
        try
        {
            var credentials = await _credentialService.GetGoogleCredentialsAsync(tenantId);
            if (credentials == null)
            {
                return Result<string>.Failure(
                    ErrorCode.GoogleCalendarApiError,
                    "Google Calendar not configured for tenant");
            }

            var service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credentials,
                ApplicationName = "SassStore"
            });

            var calendarEvent = new Event
            {
                Summary = $"{booking.Service.Name} - {booking.Customer.Name}",
                Description = BuildEventDescription(booking),
                Start = new EventDateTime
                {
                    DateTime = booking.StartTime,
                    TimeZone = booking.Tenant.TimeZone
                },
                End = new EventDateTime
                {
                    DateTime = booking.EndTime,
                    TimeZone = booking.Tenant.TimeZone
                },
                Attendees = new[]
                {
                    new EventAttendee
                    {
                        Email = booking.Customer.Email,
                        DisplayName = booking.Customer.Name,
                        ResponseStatus = "needsAction"
                    }
                },
                Reminders = new Event.RemindersData
                {
                    UseDefault = false,
                    Overrides = new[]
                    {
                        new EventReminder { Method = "email", Minutes = 60 },
                        new EventReminder { Method = "popup", Minutes = 15 }
                    }
                }
            };

            var calendarId = booking.Staff?.GoogleCalendarId ?? "primary";
            var request = service.Events.Insert(calendarEvent, calendarId);
            var createdEvent = await request.ExecuteAsync();

            // Store the Google event ID for future updates/cancellations
            booking.GoogleEventId = createdEvent.Id;
            await _bookingRepository.UpdateAsync(booking);

            _logger.LogInformation("Created Google Calendar event {EventId} for booking {BookingId}",
                createdEvent.Id, booking.Id);

            return Result<string>.Success(createdEvent.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Google Calendar event for booking {BookingId}", booking.Id);
            return Result<string>.Failure(
                ErrorCode.GoogleCalendarSyncFailed,
                $"Failed to create calendar event: {ex.Message}");
        }
    }

    public async Task<Result<bool>> CheckAvailabilityAsync(
        Guid tenantId,
        Guid staffId,
        DateTime startTime,
        TimeSpan duration)
    {
        try
        {
            var staff = await _staffRepository.GetByIdAsync(staffId);
            if (string.IsNullOrEmpty(staff?.GoogleCalendarId))
            {
                // Fallback to local calendar check only
                return await _localCalendarService.CheckAvailabilityAsync(staffId, startTime, duration);
            }

            var credentials = await _credentialService.GetGoogleCredentialsAsync(tenantId);
            var service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credentials,
                ApplicationName = "SassStore"
            });

            var request = service.Freebusy.Query(new FreeBusyRequest
            {
                TimeMin = startTime.AddHours(-1),
                TimeMax = startTime.Add(duration).AddHours(1),
                Items = new[] { new FreeBusyRequestItem { Id = staff.GoogleCalendarId } }
            });

            var response = await request.ExecuteAsync();
            var busyTimes = response.Calendars[staff.GoogleCalendarId].Busy;

            var endTime = startTime.Add(duration);
            var isAvailable = !busyTimes.Any(busy =>
                startTime < busy.End && endTime > busy.Start);

            return Result<bool>.Success(isAvailable);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Google Calendar availability check failed, falling back to local calendar");
            // Graceful degradation to local calendar
            return await _localCalendarService.CheckAvailabilityAsync(staffId, startTime, duration);
        }
    }
}
```

### 7.2 Calendar Sync Background Service

```csharp
public class CalendarSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CalendarSyncService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var syncService = scope.ServiceProvider.GetRequiredService<IGoogleCalendarSyncService>();

                await syncService.SyncPendingBookingsAsync();
                await syncService.SyncCalendarChangesAsync();

                // Sync every 5 minutes
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during calendar sync");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
```

## 8. Media Quotas & Enforcement

### 8.1 Media Quota Management

```csharp
public class MediaQuotaService : IMediaQuotaService
{
    private readonly IMediaRepository _mediaRepository;
    private readonly ITenantService _tenantService;
    private readonly IDistributedCache _cache;

    public async Task<Result<MediaQuotaInfo>> CheckQuotaAsync(Guid tenantId, long fileSizeBytes)
    {
        var cacheKey = $"media_quota:{tenantId}";
        var cached = await _cache.GetStringAsync(cacheKey);

        MediaQuotaInfo quotaInfo;
        if (cached != null)
        {
            quotaInfo = JsonSerializer.Deserialize<MediaQuotaInfo>(cached);
        }
        else
        {
            quotaInfo = await CalculateQuotaInfoAsync(tenantId);
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(quotaInfo),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        }

        var wouldExceed = quotaInfo.UsedBytes + fileSizeBytes > quotaInfo.LimitBytes;

        if (wouldExceed)
        {
            return Result<MediaQuotaInfo>.Failure(
                ErrorCode.MediaQuotaExceeded,
                $"Upload would exceed storage quota. Used: {quotaInfo.UsedBytes:N0} bytes, " +
                $"Limit: {quotaInfo.LimitBytes:N0} bytes, Upload size: {fileSizeBytes:N0} bytes");
        }

        return Result<MediaQuotaInfo>.Success(quotaInfo);
    }

    private async Task<MediaQuotaInfo> CalculateQuotaInfoAsync(Guid tenantId)
    {
        var tenant = await _tenantService.GetByIdAsync(tenantId);
        var usedBytes = await _mediaRepository.GetTotalStorageUsedAsync(tenantId);
        var mediaCount = await _mediaRepository.GetMediaCountAsync(tenantId);

        return new MediaQuotaInfo
        {
            TenantId = tenantId,
            UsedBytes = usedBytes,
            LimitBytes = GetStorageLimitBytes(tenant.Plan),
            MediaCount = mediaCount,
            MediaLimit = GetMediaCountLimit(tenant.Plan),
            BandwidthUsedThisMonth = await GetBandwidthUsageAsync(tenantId),
            BandwidthLimitPerMonth = GetBandwidthLimitBytes(tenant.Plan)
        };
    }

    private long GetStorageLimitBytes(TenantPlan plan) => plan switch
    {
        TenantPlan.Free => 100 * 1024 * 1024, // 100MB
        TenantPlan.Basic => 1024 * 1024 * 1024, // 1GB
        TenantPlan.Pro => 5L * 1024 * 1024 * 1024, // 5GB
        TenantPlan.Enterprise => 20L * 1024 * 1024 * 1024, // 20GB
        _ => 100 * 1024 * 1024
    };
}
```

### 8.2 Media Processing with Quota Enforcement

```csharp
public class MediaProcessingService : IMediaProcessingService
{
    public async Task<Result<MediaAsset>> ProcessAndStoreAsync(
        IFormFile file,
        MediaUploadRequest request)
    {
        // 1. Validate file
        var validation = ValidateFile(file);
        if (!validation.IsSuccess)
            return Result<MediaAsset>.Failure(validation.ErrorCode!.Value, validation.ErrorMessage!);

        // 2. Check quota before processing
        var quotaCheck = await _quotaService.CheckQuotaAsync(request.TenantId, file.Length);
        if (!quotaCheck.IsSuccess)
            return Result<MediaAsset>.Failure(quotaCheck.ErrorCode!.Value, quotaCheck.ErrorMessage!);

        // 3. Process image with quality adjustments based on quota usage
        var processingOptions = GetProcessingOptions(request, quotaCheck.Value);

        try
        {
            using var stream = file.OpenReadStream();

            // Strip EXIF and process
            var processedImage = await ProcessImageAsync(stream, processingOptions);

            // Generate variants based on tenant plan
            var variants = await GenerateVariantsAsync(processedImage, processingOptions);

            // Calculate final storage size
            var totalSize = variants.Sum(v => v.Value.Length);

            // Final quota check with actual processed size
            var finalQuotaCheck = await _quotaService.CheckQuotaAsync(request.TenantId, totalSize);
            if (!finalQuotaCheck.IsSuccess)
                return Result<MediaAsset>.Failure(finalQuotaCheck.ErrorCode!.Value, finalQuotaCheck.ErrorMessage!);

            // Store in R2
            var asset = await StoreMediaAssetAsync(request, variants);

            // Update quota cache
            await _quotaService.IncrementUsageAsync(request.TenantId, totalSize);

            return Result<MediaAsset>.Success(asset);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process media for tenant {TenantId}", request.TenantId);
            return Result<MediaAsset>.Failure(
                ErrorCode.MediaProcessingFailed,
                "Failed to process media file");
        }
    }

    private MediaProcessingOptions GetProcessingOptions(
        MediaUploadRequest request,
        MediaQuotaInfo quotaInfo)
    {
        var usagePercentage = (double)quotaInfo.UsedBytes / quotaInfo.LimitBytes;

        return new MediaProcessingOptions
        {
            // Reduce quality as quota usage increases
            JpegQuality = usagePercentage switch
            {
                > 0.9 => 60,  // Aggressive compression near limit
                > 0.7 => 75,  // Moderate compression
                _ => 85       // High quality
            },

            // Limit variants based on quota usage
            GenerateVariants = usagePercentage < 0.8,

            // Skip AVIF generation if quota is high (saves processing time)
            GenerateAvif = usagePercentage < 0.6,

            MaxImageDimension = usagePercentage switch
            {
                > 0.9 => 1200,
                > 0.7 => 1920,
                _ => 2400
            }
        };
    }
}
```

## 9. Row-Level Security (RLS) Implementation

### 9.1 Database Schema with RLS

```sql
-- Enable RLS on all tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- Create application role
CREATE ROLE app_user;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_products ON products
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_services ON services
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_bookings ON bookings
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_media ON media_assets
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_staff ON staff_members
    FOR ALL TO app_user
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Allow system tenant to access all data (for admin operations)
CREATE POLICY system_tenant_access ON products
    FOR ALL TO app_user
    USING (
        current_setting('app.current_tenant_id')::uuid = '00000000-0000-0000-0000-000000000001'::uuid
        OR tenant_id = current_setting('app.current_tenant_id')::uuid
    );

-- Audit table (no RLS - system-wide logging)
CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id varchar(50),
    action varchar(50) NOT NULL,
    entity_type varchar(50) NOT NULL,
    entity_id varchar(50) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    timestamp timestamp DEFAULT now(),
    ip_address inet,
    user_agent text
);

-- No RLS on audit table - system needs to log everything
```

### 9.2 Entity Framework RLS Configuration

```csharp
public class ApplicationDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure global query filters for tenant isolation
        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == _tenantProvider.TenantId || _tenantProvider.IsSystemTenant);

        modelBuilder.Entity<Service>()
            .HasQueryFilter(s => s.TenantId == _tenantProvider.TenantId || _tenantProvider.IsSystemTenant);

        modelBuilder.Entity<Booking>()
            .HasQueryFilter(b => b.TenantId == _tenantProvider.TenantId || _tenantProvider.IsSystemTenant);

        modelBuilder.Entity<MediaAsset>()
            .HasQueryFilter(m => m.TenantId == _tenantProvider.TenantId || _tenantProvider.IsSystemTenant);

        // Soft delete global filters
        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => !p.IsDeleted);

        modelBuilder.Entity<Service>()
            .HasQueryFilter(s => !s.IsDeleted);

        // Unique constraints within tenant scope
        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.TenantId, p.Sku })
            .IsUnique();

        modelBuilder.Entity<Service>()
            .HasIndex(s => new { s.TenantId, s.Name })
            .IsUnique();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Set tenant context in database session
        if (_tenantProvider.TenantId != Guid.Empty)
        {
            await Database.ExecuteSqlRawAsync(
                "SELECT set_config('app.current_tenant_id', {0}, true)",
                _tenantProvider.TenantId.ToString());
        }

        // Automatically set tenant_id and audit fields
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.TenantId = _tenantProvider.TenantId;
                    if (entry.Entity is IAuditableEntity auditable)
                    {
                        auditable.CreatedAt = DateTime.UtcNow;
                        auditable.CreatedBy = _tenantProvider.UserId;
                    }
                    break;

                case EntityState.Modified:
                    if (entry.Entity is IAuditableEntity auditableModified)
                    {
                        auditableModified.UpdatedAt = DateTime.UtcNow;
                        auditableModified.UpdatedBy = _tenantProvider.UserId;
                    }
                    break;
            }
        }

        // Generate audit trail
        var auditEntries = GenerateAuditEntries();

        var result = await base.SaveChangesAsync(cancellationToken);

        // Save audit entries after main save
        if (auditEntries.Any())
        {
            AuditLogs.AddRange(auditEntries);
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private List<AuditLog> GenerateAuditEntries()
    {
        var auditEntries = new List<AuditLog>();

        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            if (entry.State == EntityState.Unchanged) continue;

            var auditEntry = new AuditLog
            {
                TenantId = _tenantProvider.TenantId,
                UserId = _tenantProvider.UserId,
                EntityType = entry.Entity.GetType().Name,
                EntityId = entry.Property("Id").CurrentValue?.ToString(),
                Action = entry.State.ToString(),
                Timestamp = DateTime.UtcNow,
                IpAddress = _tenantProvider.IpAddress,
                UserAgent = _tenantProvider.UserAgent
            };

            if (entry.State == EntityState.Modified)
            {
                var oldValues = new Dictionary<string, object>();
                var newValues = new Dictionary<string, object>();

                foreach (var property in entry.Properties)
                {
                    if (property.IsModified)
                    {
                        oldValues[property.Metadata.Name] = property.OriginalValue;
                        newValues[property.Metadata.Name] = property.CurrentValue;
                    }
                }

                auditEntry.OldValues = JsonSerializer.Serialize(oldValues);
                auditEntry.NewValues = JsonSerializer.Serialize(newValues);
            }
            else if (entry.State == EntityState.Added)
            {
                var newValues = entry.Properties.ToDictionary(
                    p => p.Metadata.Name,
                    p => p.CurrentValue);
                auditEntry.NewValues = JsonSerializer.Serialize(newValues);
            }

            auditEntries.Add(auditEntry);
        }

        return auditEntries;
    }
}
```

## 10. Performance Targets & Monitoring

### 10.1 Performance Requirements

- **API Response Time**: P95 < 500ms, P99 < 1000ms
- **Database Query Time**: P95 < 100ms, P99 < 250ms
- **Media Processing**: < 5 seconds for standard images
- **Concurrent Users**: 100 per tenant, 1000 total
- **Availability**: 99.9% uptime

### 10.2 Performance Monitoring

```csharp
public class PerformanceMiddleware
{
    private readonly IMetricsCollector _metrics;
    private readonly ILogger<PerformanceMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var stopwatch = Stopwatch.StartNew();
        var tenantSlug = context.Items["TenantContext"] as TenantContext;

        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;

            // Record metrics
            _metrics.RecordApiLatency(
                endpoint: context.Request.Path,
                method: context.Request.Method,
                statusCode: context.Response.StatusCode,
                duration: duration,
                tenant: tenantSlug?.TenantSlug ?? "unknown"
            );

            // Log slow requests
            if (duration > 1000)
            {
                _logger.LogWarning("Slow request: {Method} {Path} took {Duration}ms for tenant {Tenant}",
                    context.Request.Method,
                    context.Request.Path,
                    duration,
                    tenantSlug?.TenantSlug);
            }

            // Add performance headers
            context.Response.Headers.Add("X-Response-Time", $"{duration}ms");
        }
    }
}
```

## 11. API Endpoints Summary

### 11.1 Core API Endpoints

#### Tenant Management

- `GET /api/v1/tenant/info` - Get current tenant information
- `PUT /api/v1/tenant/contact` - Update contact information
- `GET /api/v1/tenant/quotas` - Get usage quotas and limits

#### Products & Services

- `GET /api/v1/products` - List products (paginated, filtered)
- `GET /api/v1/products/{sku}` - Get product details
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/{sku}` - Update product
- `DELETE /api/v1/products/{sku}` - Soft delete product
- `GET /api/v1/services` - List services
- `POST /api/v1/services` - Create service

#### Bookings

- `GET /api/v1/bookings/availability` - Check availability
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/{id}` - Get booking details
- `PUT /api/v1/bookings/{id}` - Update booking
- `DELETE /api/v1/bookings/{id}` - Cancel booking
- `GET /api/v1/bookings` - List bookings (filtered)

#### Media Management

- `POST /api/v1/media/upload` - Upload media file
- `GET /api/v1/media/{id}` - Get media metadata
- `DELETE /api/v1/media/{id}` - Delete media
- `GET /api/v1/media` - List media assets
- `GET /api/v1/media/quotas` - Get storage quotas

#### Staff Management

- `GET /api/v1/staff` - List staff members
- `POST /api/v1/staff` - Add staff member
- `PUT /api/v1/staff/{id}` - Update staff member
- `GET /api/v1/staff/{id}/schedule` - Get staff schedule

### 11.2 Authentication Strategy

```csharp
public class ApiKeyAuthenticationHandler : AuthenticationHandler<ApiKeyAuthenticationSchemeOptions>
{
    public async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-API-Key", out var apiKeyHeaderValues))
        {
            return AuthenticateResult.NoResult();
        }

        var providedApiKey = apiKeyHeaderValues.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(providedApiKey))
        {
            return AuthenticateResult.NoResult();
        }

        var tenantContext = (TenantContext)Context.Items["TenantContext"]!;
        var isValid = await _apiKeyService.ValidateApiKeyAsync(providedApiKey, tenantContext.TenantId);

        if (!isValid)
        {
            return AuthenticateResult.Fail("Invalid API key");
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "API User"),
            new Claim("tenant_id", tenantContext.TenantId.ToString()),
            new Claim("tenant_slug", tenantContext.TenantSlug)
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}
```

This comprehensive backend API plan provides a robust foundation for the multitenant SaaS platform with clean architecture, proper error handling, tenant isolation, and performance monitoring. The implementation focuses on reliability, security, and cost efficiency while maintaining excellent performance characteristics.

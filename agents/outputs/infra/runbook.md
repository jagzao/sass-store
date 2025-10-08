# Operational Runbook - Sass Store Infrastructure

## Budget ≤$5/Month Compliance & Cost Management

### Table of Contents

1. [Budget Matrix & Thresholds](#budget-matrix--thresholds)
2. [Infrastructure Limits](#infrastructure-limits)
3. [Autosuspend Strategies](#autosuspend-strategies)
4. [Cache Edge Configuration](#cache-edge-configuration)
5. [Rate Limiting & Quotas](#rate-limiting--quotas)
6. [BudgetGuard CI](#budgetguard-ci)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Emergency Procedures](#emergency-procedures)
9. [Recovery & Scaling](#recovery--scaling)

---

## Budget Matrix & Thresholds

### Cost Allocation per Tenant

```yaml
# Monthly Budget Breakdown ($5 total)
Infrastructure:
  CloudflarePages: $0 # Free tier
  CloudRun_FlyIO: $2 # 1 instance max, scale-to-zero
  NeonDatabase: $1 # Autosuspend enabled
  CloudflareR2: $1 # 10GB storage, 1M operations
  UpstashRedis: $1 # Rate limiting, queues
  Monitoring: $0 # Cloudflare Analytics (free)

Tenant_Allocations:
  Default: $1.67 per tenant (3 tenants max)
  SystemTenant: $0.50 # zo-system overhead
```

### Budget Thresholds & Actions

#### 50% Threshold - ECO MODE

**Trigger**: When monthly spend reaches $2.50
**Actions**:

- Enable aggressive caching (TTL: 24h)
- Reduce image quality (JPEG: 75%, WebP: 80%)
- Disable advanced analytics
- Limit image variants to 2 sizes only

```yaml
EcoMode:
  ImageQuality:
    JPEG: 75
    WebP: 80
    AVIF: disabled
  CacheTTL: 86400 # 24 hours
  ImageVariants: ["thumb", "card"] # HD disabled
  Analytics: minimal
  BackgroundJobs: reduced_frequency
```

#### 80% Threshold - WARNING STATE

**Trigger**: When monthly spend reaches $4.00
**Actions**:

- Send immediate alert to admin
- Disable non-essential features
- Increase cache aggressiveness
- Stop background media processing

```yaml
WarningState:
  Alerts: immediate
  Features:
    ImageProcessing: essential_only
    RealTimeSync: disabled
    AdvancedAnalytics: disabled
  CacheTTL: 172800 # 48 hours
  BackgroundJobs: critical_only
```

#### 90% Threshold - FREEZE MODE

**Trigger**: When monthly spend reaches $4.50
**Actions**:

- Enable read-only mode
- Block new uploads
- Disable real-time features
- Emergency cost containment

```yaml
FreezeMode:
  ReadOnlyMode: true
  Uploads: blocked
  Features:
    ImageProcessing: disabled
    RealTimeSync: disabled
    BackgroundJobs: disabled
  API:
    ReadOperations: allowed
    WriteOperations: blocked
    MediaUploads: blocked
```

#### 100% Threshold - KILL SWITCH

**Trigger**: When monthly spend reaches $5.00
**Actions**:

- Activate maintenance mode
- Scale down to zero instances
- Show maintenance page only
- Emergency shutdown

```yaml
KillSwitch:
  MaintenanceMode: true
  Scaling:
    CloudRun: 0_instances
    Database: suspend_immediately
  Features: all_disabled
  Response: maintenance_page_only
```

---

## Infrastructure Limits

### Compute Limits (Cloud Run/Fly.io)

```yaml
CloudRun:
  MaxInstances: 1
  MinInstances: 0 # Scale-to-zero
  CPU: 1000m # 1 vCPU
  Memory: 512Mi
  Timeout: 300s
  Concurrency: 1000

AutoScaling:
  CooldownPeriod: 60s
  ScaleToZeroGracePeriod: 600s # 10 minutes
  RequestsPerInstance: 1000
```

### Database Limits (Neon)

```yaml
NeonDatabase:
  ComputeUnits: 0.25 # Shared CPU
  MaxConnections: 100
  Storage: 3GB # Free tier limit
  AutoSuspend: 300s # 5 minutes idle

Branching:
  MaxBranches: 10
  BranchLifetime: 7d
  AutoCleanup: enabled
```

### Storage Limits (Cloudflare R2)

```yaml
CloudflareR2:
  Storage: 10GB # Free tier
  Operations: 1000000 # Per month
  Bandwidth: unlimited

QuotaManagement:
  PerTenant: 3GB
  MediaOptimization: aggressive
  CleanupPolicy: 30d_unused
```

### Memory Cache (Upstash Redis)

```yaml
UpstashRedis:
  Memory: 256MB
  Commands: 10000_per_day
  Bandwidth: 256MB_per_day

CacheStrategy:
  TTL: 3600s # 1 hour default
  MaxKeySize: 1MB
  Eviction: allkeys-lru
```

---

## Autosuspend Strategies

### Database Sleep/Wake Configuration

```csharp
// Neon Database Autosuspend
public class DatabaseManager
{
    private readonly INeonClient _neonClient;
    private readonly ILogger<DatabaseManager> _logger;

    public async Task<bool> EnsureDatabaseActiveAsync()
    {
        var status = await _neonClient.GetComputeStatusAsync();

        if (status == ComputeStatus.Suspended)
        {
            _logger.LogInformation("Database suspended. Initiating wake-up...");
            await _neonClient.WakeComputeAsync();

            // Wait for database to become available
            var timeout = TimeSpan.FromSeconds(30);
            var start = DateTime.UtcNow;

            while (DateTime.UtcNow - start < timeout)
            {
                if (await _neonClient.IsComputeActiveAsync())
                {
                    _logger.LogInformation("Database wake-up completed");
                    return true;
                }
                await Task.Delay(1000);
            }

            throw new TimeoutException("Database wake-up timed out");
        }

        return true;
    }
}
```

### Connection Pool Management

```csharp
public class DatabaseConnectionPool
{
    private readonly IConfiguration _config;

    public void ConfigureConnections(IServiceCollection services)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(_config.GetConnectionString("DefaultConnection"), npgsql =>
            {
                npgsql.CommandTimeout(30);           // 30 second timeout
                npgsql.EnableRetryOnFailure(3);      // Retry 3 times
            });
        }, ServiceLifetime.Scoped);

        // Connection pooling
        services.AddDbContextPool<ApplicationDbContext>(options =>
        {
            // Pool size limited for cost control
            options.UseNpgsql(_config.GetConnectionString("DefaultConnection"));
        }, poolSize: 10);  // Small pool size
    }
}
```

### Intelligent Suspend Detection

```csharp
public class SuspendDetectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IDatabaseManager _dbManager;

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            // Check if database operation is needed
            if (RequiresDatabaseAccess(context.Request))
            {
                await _dbManager.EnsureDatabaseActiveAsync();
            }

            await next(context);
        }
        catch (NpgsqlException ex) when (ex.Message.Contains("suspended"))
        {
            // Database suspended during request
            context.Response.StatusCode = 503;
            context.Response.Headers.Add("Retry-After", "30");
            await context.Response.WriteAsync("Service temporarily unavailable - database starting");
        }
    }

    private bool RequiresDatabaseAccess(HttpRequest request)
    {
        // Skip database for static assets, health checks
        return !request.Path.StartsWithSegments("/health") &&
               !request.Path.StartsWithSegments("/static");
    }
}
```

---

## Cache Edge Configuration

### Cloudflare Page Rules

```yaml
CloudflarePageRules:
  StaticAssets:
    Pattern: "*.sassstore.com/static/*"
    Settings:
      CacheLevel: cache_everything
      EdgeCacheTTL: 2592000 # 30 days
      BrowserCacheTTL: 86400 # 1 day

  APIResponses:
    Pattern: "*.sassstore.com/api/*"
    Settings:
      CacheLevel: cache_by_device_type
      EdgeCacheTTL: 300 # 5 minutes
      BrowserCacheTTL: 60 # 1 minute

  MediaAssets:
    Pattern: "*.sassstore.com/media/*"
    Settings:
      CacheLevel: cache_everything
      EdgeCacheTTL: 2592000 # 30 days
      BrowserCacheTTL: 86400 # 1 day
      Polish: lossy # Image optimization
```

### Application-Level Caching

```csharp
public class CacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly IFeatureFlags _featureFlags;

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null)
    {
        // Check memory cache first
        if (_memoryCache.TryGetValue(key, out T cached))
            return cached;

        // Check distributed cache
        var distributedValue = await _distributedCache.GetStringAsync(key);
        if (distributedValue != null)
        {
            var value = JsonSerializer.Deserialize<T>(distributedValue);
            _memoryCache.Set(key, value, TimeSpan.FromMinutes(5)); // Short memory cache
            return value;
        }

        // Fetch from source
        var result = await factory();

        // Cache with TTL based on eco mode
        var cacheTtl = ttl ?? GetCacheTtl();
        var serialized = JsonSerializer.Serialize(result);

        await _distributedCache.SetStringAsync(key, serialized, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = cacheTtl
        });

        _memoryCache.Set(key, result, TimeSpan.FromMinutes(5));
        return result;
    }

    private TimeSpan GetCacheTtl()
    {
        if (_featureFlags.EcoMode) return TimeSpan.FromHours(24);
        if (_featureFlags.FreezeMode) return TimeSpan.FromHours(48);
        return TimeSpan.FromHours(1);
    }
}
```

### Cache Warming Strategy

```csharp
public class CacheWarmingService : IHostedService
{
    private readonly ICacheService _cache;
    private readonly IServiceProvider _serviceProvider;
    private Timer _timer;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        // Warm cache every 30 minutes during active hours
        _timer = new Timer(WarmCache, null, TimeSpan.Zero, TimeSpan.FromMinutes(30));
        return Task.CompletedTask;
    }

    private async void WarmCache(object state)
    {
        using var scope = _serviceProvider.CreateScope();
        var tenantService = scope.ServiceProvider.GetRequiredService<ITenantService>();

        // Warm essential data for active tenants
        var tenants = await tenantService.GetActiveTenantIdsAsync();

        foreach (var tenantId in tenants)
        {
            // Only warm cache for active tenants with recent activity
            var lastActivity = await GetLastActivityAsync(tenantId);
            if (lastActivity > DateTime.UtcNow.AddHours(-24))
            {
                await WarmTenantCacheAsync(tenantId);
            }
        }
    }
}
```

---

## Rate Limiting & Quotas

### Per-Tenant Rate Limits

```csharp
public class TenantQuotaService
{
    private readonly IRedisDatabase _redis;
    private readonly IFeatureFlags _featureFlags;

    public async Task<QuotaResult> CheckQuotaAsync(string tenantId, string operation)
    {
        var quotaConfig = GetQuotaConfig(operation);
        var currentUsage = await GetCurrentUsageAsync(tenantId, operation);

        // Adjust limits based on feature flags
        var effectiveLimit = AdjustLimitForMode(quotaConfig.Limit);

        if (currentUsage >= effectiveLimit)
        {
            return QuotaResult.Exceeded(currentUsage, effectiveLimit);
        }

        // Increment usage
        await IncrementUsageAsync(tenantId, operation);
        return QuotaResult.Allowed(currentUsage + 1, effectiveLimit);
    }

    private int AdjustLimitForMode(int baseLimit)
    {
        if (_featureFlags.KillSwitch) return 0;
        if (_featureFlags.FreezeMode) return (int)(baseLimit * 0.1); // 10% of normal
        if (_featureFlags.EcoMode) return (int)(baseLimit * 0.5);    // 50% of normal
        return baseLimit;
    }
}
```

### Quota Configurations

```yaml
TenantQuotas:
  API:
    GET: 1000_per_hour
    POST: 100_per_hour
    PUT: 100_per_hour
    DELETE: 50_per_hour

  Media:
    Upload: 20_per_hour
    Processing: 50_per_hour

  Database:
    Queries: 10000_per_hour
    Writes: 1000_per_hour

  Storage:
    TotalSize: 3GB
    FilesPerHour: 100

EcoModeReduction: 50%
FreezeModeReduction: 90%
KillSwitchReduction: 100%
```

### Cost-Based Rate Limiting

```csharp
public class CostBasedRateLimiter
{
    private readonly ICostCalculator _costCalculator;
    private readonly IRedisDatabase _redis;

    public async Task<bool> CanExecuteOperationAsync(string tenantId, OperationType operation)
    {
        var operationCost = _costCalculator.CalculateOperationCost(operation);
        var currentSpend = await GetCurrentSpendAsync(tenantId);
        var budgetLimit = await GetBudgetLimitAsync(tenantId);

        // Predict cost after operation
        var projectedSpend = currentSpend + operationCost;
        var utilizationPercentage = (projectedSpend / budgetLimit) * 100;

        // Block expensive operations based on budget utilization
        switch (utilizationPercentage)
        {
            case >= 100:
                return false; // Kill switch - no operations allowed

            case >= 90:
                // Freeze mode - only essential read operations
                return operation.Type == OperationType.Read && operation.IsEssential;

            case >= 80:
                // Warning state - block expensive operations
                return operationCost < 0.001; // Only very cheap operations

            case >= 50:
                // Eco mode - reduced quotas
                return await CheckEcoModeQuotaAsync(tenantId, operation);

            default:
                return true; // Normal operation
        }
    }
}
```

---

## BudgetGuard CI

### GitHub Actions Cost Prevention

```yaml
# .github/workflows/budget-guard.yml
name: BudgetGuard - Cost Prevention

on:
  pull_request:
    paths:
      - "infrastructure/**"
      - "docker-compose.yml"
      - "Dockerfile"
      - ".github/workflows/**"

jobs:
  cost-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Infrastructure Tools
        run: |
          # Install cost estimation tools
          curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh

      - name: Analyze Infrastructure Costs
        run: |
          # Check for expensive resources
          ./scripts/check-expensive-resources.sh

          # Validate instance limits
          ./scripts/validate-instance-limits.sh

          # Check for auto-scaling misconfigurations
          ./scripts/check-autoscaling.sh

      - name: Validate Budget Compliance
        run: |
          # Ensure configurations stay within $5/month
          python scripts/budget-validator.py

      - name: Block Expensive Deployments
        if: env.COST_VIOLATION == 'true'
        run: |
          echo "❌ Deployment blocked: Configuration exceeds $5/month budget"
          echo "Review the following violations:"
          cat cost-violations.txt
          exit 1
```

### Cost Validation Scripts

```bash
#!/bin/bash
# scripts/check-expensive-resources.sh

echo "🔍 Checking for expensive resource configurations..."

# Check Cloud Run configurations
if grep -q "maxScale.*[2-9]" infrastructure/cloud-run.yaml; then
    echo "❌ Cloud Run maxScale > 1 detected"
    echo "maxScale: 1" >> cost-violations.txt
fi

# Check memory allocations
if grep -q "memory.*[0-9]Gi" infrastructure/cloud-run.yaml; then
    echo "❌ Memory allocation > 1GB detected"
    echo "memory: max 512Mi allowed" >> cost-violations.txt
fi

# Check database compute units
if grep -q "compute.*[0-9]\.[5-9]" infrastructure/neon.yaml; then
    echo "❌ Database compute > 0.25 units detected"
    echo "compute: max 0.25 units allowed" >> cost-violations.txt
fi

# Check storage quotas
if grep -q "storage.*[1-9][0-9]GB" infrastructure/storage.yaml; then
    echo "❌ Storage allocation > 10GB detected"
    echo "storage: max 10GB allowed" >> cost-violations.txt
fi

if [ -f cost-violations.txt ]; then
    export COST_VIOLATION=true
    echo "❌ Cost violations detected!"
    cat cost-violations.txt
else
    echo "✅ No cost violations detected"
fi
```

### Budget Validator

```python
#!/usr/bin/env python3
# scripts/budget-validator.py

import yaml
import sys
from decimal import Decimal

def validate_budget_compliance():
    violations = []
    monthly_budget = Decimal('5.00')

    # Load configuration files
    configs = {
        'cloud_run': load_config('infrastructure/cloud-run.yaml'),
        'database': load_config('infrastructure/neon.yaml'),
        'storage': load_config('infrastructure/storage.yaml'),
        'redis': load_config('infrastructure/redis.yaml')
    }

    # Calculate projected costs
    projected_costs = {
        'compute': calculate_compute_cost(configs['cloud_run']),
        'database': calculate_database_cost(configs['database']),
        'storage': calculate_storage_cost(configs['storage']),
        'redis': calculate_redis_cost(configs['redis'])
    }

    total_cost = sum(projected_costs.values())

    print(f"💰 Projected Monthly Costs:")
    for service, cost in projected_costs.items():
        print(f"  {service}: ${cost:.2f}")
    print(f"  Total: ${total_cost:.2f}")
    print(f"  Budget: ${monthly_budget:.2f}")

    if total_cost > monthly_budget:
        violations.append(f"Total cost ${total_cost:.2f} exceeds budget ${monthly_budget:.2f}")

    # Check individual service limits
    if projected_costs['compute'] > Decimal('2.00'):
        violations.append("Compute cost exceeds $2.00 limit")

    if projected_costs['database'] > Decimal('1.00'):
        violations.append("Database cost exceeds $1.00 limit")

    if projected_costs['storage'] > Decimal('1.00'):
        violations.append("Storage cost exceeds $1.00 limit")

    if violations:
        print("\n❌ Budget Violations:")
        for violation in violations:
            print(f"  - {violation}")

        with open('cost-violations.txt', 'a') as f:
            for violation in violations:
                f.write(f"{violation}\n")

        return False

    print("\n✅ Budget compliance validated")
    return True

def calculate_compute_cost(config):
    # Cloud Run cost calculation
    instances = config.get('maxScale', 1)
    memory_gb = parse_memory(config.get('memory', '512Mi'))
    cpu = config.get('cpu', 1000) / 1000  # Convert millicores to cores

    # Cloud Run pricing (approximate)
    # vCPU: $0.00002400 per vCPU-second
    # Memory: $0.00000250 per GiB-second
    # Assuming 10% utilization for scale-to-zero

    monthly_seconds = 30 * 24 * 3600 * 0.1  # 10% utilization
    cpu_cost = instances * cpu * 0.00002400 * monthly_seconds
    memory_cost = instances * memory_gb * 0.00000250 * monthly_seconds

    return Decimal(str(cpu_cost + memory_cost)).quantize(Decimal('0.01'))

if __name__ == "__main__":
    if not validate_budget_compliance():
        sys.exit(1)
```

---

## Monitoring & Alerts

### Cost Tracking Dashboard

```javascript
// Cloudflare Worker for cost monitoring
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/costs/current") {
      return await getCurrentCosts(env);
    }

    if (url.pathname === "/api/costs/forecast") {
      return await getForecastedCosts(env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function getCurrentCosts(env) {
  const costs = {
    cloudRun: await getCloudRunCosts(env),
    database: await getDatabaseCosts(env),
    storage: await getStorageCosts(env),
    redis: await getRedisCosts(env),
  };

  const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const budgetUtilization = (total / 5.0) * 100;

  return Response.json({
    costs,
    total,
    budget: 5.0,
    utilization: budgetUtilization,
    status: getBudgetStatus(budgetUtilization),
    timestamp: new Date().toISOString(),
  });
}

function getBudgetStatus(utilization) {
  if (utilization >= 100) return "KILL_SWITCH";
  if (utilization >= 90) return "FREEZE_MODE";
  if (utilization >= 80) return "WARNING";
  if (utilization >= 50) return "ECO_MODE";
  return "NORMAL";
}
```

### Alert Configuration

```yaml
AlertingRules:
  BudgetThresholds:
    - threshold: 50
      severity: info
      action: enable_eco_mode
      notification: slack

    - threshold: 80
      severity: warning
      action: send_alert
      notification: [slack, email]

    - threshold: 90
      severity: critical
      action: enable_freeze_mode
      notification: [slack, email, sms]

    - threshold: 100
      severity: emergency
      action: activate_kill_switch
      notification: [slack, email, sms, pager]

SlackIntegration:
  webhook: ${SLACK_WEBHOOK_URL}
  channel: "#sass-store-alerts"
  format: |
    🚨 *Budget Alert: {severity}*

    *Current Spend:* ${cost:.2f} / $5.00 ({utilization:.1f}%)
    *Status:* {status}
    *Action:* {action}

    *Breakdown:*
    • Compute: ${compute_cost:.2f}
    • Database: ${database_cost:.2f}
    • Storage: ${storage_cost:.2f}
    • Cache: ${redis_cost:.2f}
```

### Real-Time Cost Tracking

```csharp
public class CostTrackingService
{
    private readonly IRedisDatabase _redis;
    private readonly ICloudMetricsClient _metrics;

    public async Task TrackOperationCostAsync(string tenantId, OperationType operation, decimal cost)
    {
        var key = $"cost:{tenantId}:{DateTime.UtcNow:yyyy-MM}";

        // Increment monthly cost
        await _redis.HashIncrementAsync(key, operation.ToString(), (double)cost);
        await _redis.KeyExpireAsync(key, TimeSpan.FromDays(32));

        // Check for threshold violations
        var totalCost = await GetTotalMonthlyCostAsync(tenantId);
        await CheckBudgetThresholdsAsync(tenantId, totalCost);
    }

    public async Task<decimal> GetTotalMonthlyCostAsync(string tenantId)
    {
        var key = $"cost:{tenantId}:{DateTime.UtcNow:yyyy-MM}";
        var costs = await _redis.HashGetAllAsync(key);

        return costs.Sum(c => (decimal)c.Value);
    }

    private async Task CheckBudgetThresholdsAsync(string tenantId, decimal currentCost)
    {
        var budget = await GetTenantBudgetAsync(tenantId);
        var utilization = (currentCost / budget) * 100;

        var previousThreshold = await GetPreviousThresholdAsync(tenantId);
        var currentThreshold = GetThresholdLevel(utilization);

        // Only trigger if crossing threshold upward
        if (currentThreshold > previousThreshold)
        {
            await TriggerThresholdActionAsync(tenantId, currentThreshold, utilization);
            await SetPreviousThresholdAsync(tenantId, currentThreshold);
        }
    }
}
```

---

## Emergency Procedures

### Kill Switch Activation

```csharp
public class EmergencyKillSwitch
{
    private readonly IFeatureFlagService _featureFlags;
    private readonly ICloudRunClient _cloudRun;
    private readonly INeonClient _neon;
    private readonly INotificationService _notifications;

    public async Task ActivateKillSwitchAsync(string tenantId, string reason)
    {
        var timestamp = DateTime.UtcNow;

        try
        {
            // 1. Enable kill switch feature flag
            await _featureFlags.SetFlagAsync(tenantId, "KillSwitch", true);

            // 2. Scale Cloud Run to zero
            await _cloudRun.ScaleToZeroAsync();

            // 3. Suspend database
            await _neon.SuspendComputeAsync();

            // 4. Enable maintenance mode
            await EnableMaintenanceModeAsync(tenantId);

            // 5. Send emergency notifications
            await _notifications.SendEmergencyAlertAsync(
                $"EMERGENCY: Kill switch activated for {tenantId}",
                $"Reason: {reason}",
                $"Timestamp: {timestamp}"
            );

            // 6. Log emergency action
            await LogEmergencyActionAsync(tenantId, "KILL_SWITCH_ACTIVATED", reason, timestamp);

        }
        catch (Exception ex)
        {
            // Emergency logging
            await LogCriticalErrorAsync($"Kill switch activation failed: {ex.Message}");
            throw;
        }
    }

    public async Task DeactivateKillSwitchAsync(string tenantId, string approver)
    {
        // Requires manual approval
        if (!await ValidateApproverAsync(approver))
        {
            throw new UnauthorizedAccessException("Kill switch deactivation requires valid approver");
        }

        // Gradual restoration
        await _featureFlags.SetFlagAsync(tenantId, "KillSwitch", false);
        await _neon.WakeComputeAsync();
        await _cloudRun.ScaleToMinimumAsync(); // Scale to 1 instance
        await DisableMaintenanceModeAsync(tenantId);

        await _notifications.SendAlertAsync($"Kill switch deactivated for {tenantId} by {approver}");
    }
}
```

### Manual Override Procedures

```bash
#!/bin/bash
# Emergency override script - manual execution only

echo "🚨 EMERGENCY OVERRIDE PROCEDURES"
echo "================================"

show_menu() {
    echo "Select emergency action:"
    echo "1) Activate Kill Switch"
    echo "2) Deactivate Kill Switch"
    echo "3) Enable Freeze Mode"
    echo "4) Disable Freeze Mode"
    echo "5) Check Current Status"
    echo "6) Emergency Budget Reset"
    echo "0) Exit"
}

activate_kill_switch() {
    read -p "Enter tenant ID: " tenant_id
    read -p "Enter reason: " reason
    read -p "Confirm kill switch activation for $tenant_id (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        echo "Activating kill switch..."

        # Scale Cloud Run to zero
        gcloud run services update sass-store-api \
            --min-instances=0 \
            --max-instances=0 \
            --region=us-central1

        # Suspend Neon database
        curl -X POST "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/endpoints/$NEON_ENDPOINT_ID/suspend" \
            -H "Authorization: Bearer $NEON_API_KEY"

        # Update feature flags
        curl -X POST "$API_URL/admin/feature-flags" \
            -H "X-Admin-Key: $ADMIN_KEY" \
            -d "{\"tenantId\": \"$tenant_id\", \"killSwitch\": true}"

        echo "✅ Kill switch activated"
        echo "Reason: $reason"
        echo "Timestamp: $(date -Iseconds)"
    fi
}

emergency_budget_reset() {
    echo "⚠️  EMERGENCY BUDGET RESET"
    read -p "Enter admin password: " -s password
    echo

    if [ "$password" = "$EMERGENCY_ADMIN_PASSWORD" ]; then
        read -p "Enter tenant ID: " tenant_id

        # Reset cost counters
        redis-cli DEL "cost:$tenant_id:$(date +%Y-%m)"

        # Reset feature flags
        curl -X POST "$API_URL/admin/feature-flags/reset" \
            -H "X-Admin-Key: $ADMIN_KEY" \
            -d "{\"tenantId\": \"$tenant_id\"}"

        echo "✅ Budget counters reset for $tenant_id"
    else
        echo "❌ Invalid admin password"
    fi
}

check_status() {
    echo "📊 Current System Status"
    echo "======================="

    # Cloud Run status
    echo "Cloud Run Instances:"
    gcloud run services describe sass-store-api --region=us-central1 --format="value(status.traffic[0].latestRevision,status.traffic[0].percent)"

    # Database status
    echo "Database Status:"
    curl -s "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/endpoints/$NEON_ENDPOINT_ID" \
        -H "Authorization: Bearer $NEON_API_KEY" | jq '.current_state'

    # Current costs
    echo "Current Costs:"
    curl -s "$WORKER_URL/api/costs/current" | jq '.total, .utilization, .status'
}

# Main script execution
while true; do
    show_menu
    read -p "Enter choice: " choice

    case $choice in
        1) activate_kill_switch ;;
        2) deactivate_kill_switch ;;
        3) enable_freeze_mode ;;
        4) disable_freeze_mode ;;
        5) check_status ;;
        6) emergency_budget_reset ;;
        0) exit 0 ;;
        *) echo "Invalid option" ;;
    esac

    echo
    read -p "Press Enter to continue..."
    clear
done
```

---

## Recovery & Scaling

### Graceful Recovery Process

```csharp
public class RecoveryService
{
    private readonly IFeatureFlagService _featureFlags;
    private readonly IHealthCheckService _healthCheck;
    private readonly ICostMonitoringService _costMonitoring;

    public async Task<RecoveryResult> InitiateRecoveryAsync(string tenantId)
    {
        var recoveryPlan = await CreateRecoveryPlanAsync(tenantId);

        foreach (var step in recoveryPlan.Steps)
        {
            try
            {
                await ExecuteRecoveryStepAsync(step);
                await ValidateStepCompletionAsync(step);

                // Wait between steps for system stabilization
                await Task.Delay(step.StabilizationDelay);
            }
            catch (Exception ex)
            {
                return RecoveryResult.Failed(step.Name, ex.Message);
            }
        }

        return RecoveryResult.Success();
    }

    private async Task<RecoveryPlan> CreateRecoveryPlanAsync(string tenantId)
    {
        var currentStatus = await GetCurrentStatusAsync(tenantId);

        var steps = new List<RecoveryStep>();

        if (currentStatus.KillSwitch)
        {
            steps.Add(new RecoveryStep
            {
                Name = "WakeDatabase",
                Action = () => _neon.WakeComputeAsync(),
                Validation = () => _healthCheck.IsDatabaseHealthyAsync(),
                StabilizationDelay = TimeSpan.FromSeconds(30)
            });

            steps.Add(new RecoveryStep
            {
                Name = "ScaleCompute",
                Action = () => _cloudRun.ScaleToMinimumAsync(),
                Validation = () => _healthCheck.IsComputeHealthyAsync(),
                StabilizationDelay = TimeSpan.FromSeconds(15)
            });
        }

        if (currentStatus.FreezeMode)
        {
            steps.Add(new RecoveryStep
            {
                Name = "EnableWriteOperations",
                Action = () => _featureFlags.SetFlagAsync(tenantId, "FreezeMode", false),
                Validation = () => ValidateWriteOperationsAsync(tenantId),
                StabilizationDelay = TimeSpan.FromSeconds(5)
            });
        }

        steps.Add(new RecoveryStep
        {
            Name = "GradualTrafficIncrease",
            Action = () => GraduallyIncreaseTrafficAsync(tenantId),
            Validation = () => ValidateSystemStabilityAsync(tenantId),
            StabilizationDelay = TimeSpan.FromMinutes(2)
        });

        return new RecoveryPlan { Steps = steps };
    }
}
```

### Budget Reset & Scaling Strategy

```csharp
public class BudgetScalingService
{
    public async Task<ScalingDecision> DetermineScalingActionAsync(string tenantId)
    {
        var metrics = await GatherScalingMetricsAsync(tenantId);

        // Cost-based scaling decisions
        var costUtilization = metrics.CostUtilization;
        var requestVolume = metrics.RequestVolume;
        var responseTime = metrics.AverageResponseTime;

        if (costUtilization > 90)
        {
            return ScalingDecision.ScaleDown("Cost utilization too high");
        }

        if (costUtilization < 30 && requestVolume < 100)
        {
            return ScalingDecision.ScaleToZero("Low utilization and traffic");
        }

        if (responseTime > TimeSpan.FromSeconds(5) && costUtilization < 70)
        {
            return ScalingDecision.ScaleUp("Performance degradation detected");
        }

        return ScalingDecision.Maintain("System operating within parameters");
    }

    public async Task ExecuteScalingDecisionAsync(ScalingDecision decision)
    {
        switch (decision.Action)
        {
            case ScalingAction.ScaleUp:
                // Only scale up if cost allows
                if (await CanAffordScaleUpAsync())
                {
                    await _cloudRun.ScaleUpAsync(1);
                }
                break;

            case ScalingAction.ScaleDown:
                await _cloudRun.ScaleDownAsync();
                break;

            case ScalingAction.ScaleToZero:
                await _cloudRun.ScaleToZeroAsync();
                await _neon.SuspendComputeAsync();
                break;
        }
    }
}
```

### Operational Checklists

#### Daily Operations Checklist

```markdown
## Daily Operations Checklist

### Morning Checks (9:00 AM)

- [ ] Check overnight cost accumulation
- [ ] Verify all services are healthy
- [ ] Review any alert notifications
- [ ] Check database auto-suspend status
- [ ] Validate cache hit rates

### Midday Checks (1:00 PM)

- [ ] Monitor peak traffic costs
- [ ] Check quota utilization
- [ ] Review rate limiting effectiveness
- [ ] Validate image optimization savings

### Evening Checks (6:00 PM)

- [ ] Review daily cost totals
- [ ] Check for any threshold violations
- [ ] Validate autosuspend configurations
- [ ] Plan for overnight optimizations

### End-of-Day Summary

- [ ] Daily cost: $**\_\_** / $0.16 target
- [ ] Budget utilization: **\_**%
- [ ] Issues identified: **\_\_**
- [ ] Actions taken: **\_\_**
```

#### Weekly Budget Review

```markdown
## Weekly Budget Review Checklist

### Cost Analysis

- [ ] Weekly spend vs. budget ($1.25 target)
- [ ] Identify highest cost tenants
- [ ] Review cost attribution accuracy
- [ ] Analyze cost trends and patterns

### Optimization Opportunities

- [ ] Cache hit rate improvements
- [ ] Image optimization effectiveness
- [ ] Autosuspend timing optimization
- [ ] Rate limiting adjustment needs

### Capacity Planning

- [ ] Forecast next week's costs
- [ ] Plan for tenant scaling
- [ ] Review infrastructure limits
- [ ] Update emergency procedures

### Documentation Updates

- [ ] Update cost baselines
- [ ] Refresh runbook procedures
- [ ] Update alert thresholds
- [ ] Review recovery procedures
```

This operational runbook provides comprehensive procedures for maintaining the Sass Store infrastructure within the ≤$5/month budget constraint, with specific thresholds, automated responses, and emergency procedures to ensure cost compliance while maintaining service availability.

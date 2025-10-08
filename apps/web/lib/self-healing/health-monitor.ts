// Advanced self-healing system for Sass Store
export class HealthMonitor {
  private static instance: HealthMonitor | null = null;
  private healthStatus: Record<string, boolean> = {};
  private healingAttempts: Record<string, number> = {};
  private maxHealingAttempts = 3;

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  // Monitor database connectivity
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { checkDatabaseConnection } = await import("../db/connection");
      const isHealthy = await checkDatabaseConnection();
      this.healthStatus.database = isHealthy;

      if (!isHealthy) {
        await this.healDatabase();
      }

      return isHealthy;
    } catch (error) {
      console.error("[Self-Healing] Database health check failed:", error);
      this.healthStatus.database = false;
      await this.healDatabase();
      return false;
    }
  }

  // Monitor API endpoints health
  async checkApiHealth(): Promise<boolean> {
    try {
      const endpoints = [
        "/api/health",
        "/api/v1/tenants",
        "/api/payments/health",
      ];

      const checks = await Promise.allSettled(
        endpoints.map((endpoint) =>
          fetch(endpoint, {
            method: "HEAD",
            signal: AbortSignal.timeout(5000),
          }),
        ),
      );

      const healthyEndpoints = checks.filter(
        (result) =>
          result.status === "fulfilled" &&
          (result as PromiseFulfilledResult<Response>).value.ok,
      ).length;

      const healthRatio = healthyEndpoints / endpoints.length;
      const isHealthy = healthRatio >= 0.7; // 70% of endpoints must be healthy

      this.healthStatus.api = isHealthy;

      if (!isHealthy) {
        await this.healApi();
      }

      return isHealthy;
    } catch (error) {
      console.error("[Self-Healing] API health check failed:", error);
      this.healthStatus.api = false;
      await this.healApi();
      return false;
    }
  }

  // Monitor client-side storage health
  async checkStorageHealth(): Promise<boolean> {
    try {
      if (typeof window === "undefined") return true;

      // Check localStorage
      const testKey = "__health_check__";
      localStorage.setItem(testKey, "test");
      const retrievedValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      const isHealthy = retrievedValue === "test";
      this.healthStatus.storage = isHealthy;

      if (!isHealthy) {
        await this.healStorage();
      }

      return isHealthy;
    } catch (error) {
      console.error("[Self-Healing] Storage health check failed:", error);
      this.healthStatus.storage = false;
      await this.healStorage();
      return false;
    }
  }

  // Self-healing for database issues
  private async healDatabase(): Promise<void> {
    const attempts = this.healingAttempts.database || 0;
    if (attempts >= this.maxHealingAttempts) {
      console.warn("[Self-Healing] Max database healing attempts reached");
      return;
    }

    console.log(
      `[Self-Healing] Attempting database healing (${attempts + 1}/${this.maxHealingAttempts})`,
    );
    this.healingAttempts.database = attempts + 1;

    try {
      // Clear any cached database connections
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("db_error_cache");
        localStorage.removeItem("tenant_cache");
      }

      // Wait for connection recovery
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Re-test connection
      const isHealthy = await this.checkDatabaseHealth();
      if (isHealthy) {
        console.log("[Self-Healing] Database healing successful");
        this.healingAttempts.database = 0;
      }
    } catch (error) {
      console.error("[Self-Healing] Database healing failed:", error);
    }
  }

  // Self-healing for API issues
  private async healApi(): Promise<void> {
    const attempts = this.healingAttempts.api || 0;
    if (attempts >= this.maxHealingAttempts) {
      console.warn("[Self-Healing] Max API healing attempts reached");
      return;
    }

    console.log(
      `[Self-Healing] Attempting API healing (${attempts + 1}/${this.maxHealingAttempts})`,
    );
    this.healingAttempts.api = attempts + 1;

    try {
      // Clear API caches
      if (typeof window !== "undefined" && "caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Clear session data that might be corrupted
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("api_cache");
        sessionStorage.removeItem("auth_cache");
      }

      // Wait for API recovery
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Re-test API health
      const isHealthy = await this.checkApiHealth();
      if (isHealthy) {
        console.log("[Self-Healing] API healing successful");
        this.healingAttempts.api = 0;
      }
    } catch (error) {
      console.error("[Self-Healing] API healing failed:", error);
    }
  }

  // Self-healing for storage issues
  private async healStorage(): Promise<void> {
    const attempts = this.healingAttempts.storage || 0;
    if (attempts >= this.maxHealingAttempts) {
      console.warn("[Self-Healing] Max storage healing attempts reached");
      return;
    }

    console.log(
      `[Self-Healing] Attempting storage healing (${attempts + 1}/${this.maxHealingAttempts})`,
    );
    this.healingAttempts.storage = attempts + 1;

    try {
      if (typeof window === "undefined") return;

      // Clear corrupted storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("[Self-Healing] Could not clear storage:", e);
      }

      // Test storage again
      const isHealthy = await this.checkStorageHealth();
      if (isHealthy) {
        console.log("[Self-Healing] Storage healing successful");
        this.healingAttempts.storage = 0;
      }
    } catch (error) {
      console.error("[Self-Healing] Storage healing failed:", error);
    }
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<{
    overall: boolean;
    details: Record<string, boolean>;
    healingAttempts: Record<string, number>;
  }> {
    console.log("[Self-Healing] Starting comprehensive health check...");

    const [database, api, storage] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkApiHealth(),
      this.checkStorageHealth(),
    ]);

    const overall = database && api && storage;

    const result = {
      overall,
      details: {
        database,
        api,
        storage,
      },
      healingAttempts: { ...this.healingAttempts },
    };

    console.log("[Self-Healing] Health check completed:", result);
    return result;
  }

  // Reset healing attempts (called on successful operations)
  resetHealingAttempts(): void {
    this.healingAttempts = {};
    console.log("[Self-Healing] Healing attempts reset");
  }

  // Get current health status
  getHealthStatus(): Record<string, boolean> {
    return { ...this.healthStatus };
  }
}

// Singleton instance
export const healthMonitor = HealthMonitor.getInstance();

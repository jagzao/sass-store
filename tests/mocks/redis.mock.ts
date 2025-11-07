/**
 * Redis/Upstash mock for testing
 * Provides in-memory implementation of Redis commands
 */

export class MockRedis {
  private store: Map<string, { value: any; expiry?: number }> = new Map();

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);

    if (!item) return null;

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set value with optional expiry
   */
  async set(
    key: string,
    value: any,
    opts?: { ex?: number; px?: number; exat?: number; pxat?: number }
  ): Promise<'OK'> {
    let expiry: number | undefined;

    if (opts) {
      if (opts.ex) {
        // Expire in seconds
        expiry = Date.now() + opts.ex * 1000;
      } else if (opts.px) {
        // Expire in milliseconds
        expiry = Date.now() + opts.px;
      } else if (opts.exat) {
        // Expire at Unix timestamp (seconds)
        expiry = opts.exat * 1000;
      } else if (opts.pxat) {
        // Expire at Unix timestamp (milliseconds)
        expiry = opts.pxat;
      }
    }

    this.store.set(key, { value: String(value), expiry });
    return 'OK';
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Set expiry on key (seconds)
   */
  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;

    item.expiry = Date.now() + seconds * 1000;
    return 1;
  }

  /**
   * Get time to live (seconds)
   */
  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2; // Key doesn't exist

    if (!item.expiry) return -1; // Key has no expiry

    const ttl = Math.floor((item.expiry - Date.now()) / 1000);
    return ttl > 0 ? ttl : -2;
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    const item = this.store.get(key);
    const currentValue = item ? parseInt(item.value, 10) : 0;
    const newValue = currentValue + 1;

    await this.set(key, String(newValue));
    return newValue;
  }

  /**
   * Increment by amount
   */
  async incrby(key: string, increment: number): Promise<number> {
    const item = this.store.get(key);
    const currentValue = item ? parseInt(item.value, 10) : 0;
    const newValue = currentValue + increment;

    await this.set(key, String(newValue));
    return newValue;
  }

  /**
   * Decrement value
   */
  async decr(key: string): Promise<number> {
    const item = this.store.get(key);
    const currentValue = item ? parseInt(item.value, 10) : 0;
    const newValue = currentValue - 1;

    await this.set(key, String(newValue));
    return newValue;
  }

  /**
   * Get multiple values
   */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * Set multiple values
   */
  async mset(data: Record<string, any>): Promise<'OK'> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
    return 'OK';
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  /**
   * Delete all keys
   */
  async flushall(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  /**
   * Delete all keys in current database
   */
  async flushdb(): Promise<'OK'> {
    return this.flushall();
  }

  /**
   * Get database size
   */
  async dbsize(): Promise<number> {
    return this.store.size;
  }

  /**
   * Hash operations
   */
  private hashStore: Map<string, Map<string, string>> = new Map();

  async hset(key: string, field: string, value: any): Promise<number> {
    if (!this.hashStore.has(key)) {
      this.hashStore.set(key, new Map());
    }
    const hash = this.hashStore.get(key)!;
    const isNew = !hash.has(field);
    hash.set(field, String(value));
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hash = this.hashStore.get(key);
    return hash?.get(field) || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashStore.get(key);
    if (!hash) return {};

    const result: Record<string, string> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = value;
    }
    return result;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashStore.get(key);
    if (!hash) return 0;

    let deleted = 0;
    for (const field of fields) {
      if (hash.delete(field)) {
        deleted++;
      }
    }
    return deleted;
  }
}

/**
 * Create a mock Redis instance for testing
 */
export function createMockRedis(): MockRedis {
  return new MockRedis();
}

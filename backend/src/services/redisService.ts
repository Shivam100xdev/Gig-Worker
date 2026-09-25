import { Redis } from "ioredis";

/**
 * Single Redis connection shared by the whole backend.
 *
 * Why Redis lives here:
 *  - OTP codes + rate-limit counters: short-lived, TTL-managed. Postgres
 *    would need a janitor job; Redis expires them natively.
 *  - Response cache: FAQ/review walls are read-heavy and nearly static.
 *
 * Fails soft: without Redis, OTP codes fall back to in-memory storage with
 * the same TTL semantics, and the response cache becomes a no-op. The API
 * stays fully functional — useful when the docker services aren't running.
 */
class RedisService {
  private client: Redis | null = null;
  private memoryFallback = new Map<string, { value: string; expiresAt: number }>();

  private get redis(): Redis | null {
    if (this.client) return this.client;
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        lazyConnect: false,
        retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 500, 2000)),
      });
      this.client.on("error", () => {
        /* connection errors surface as nulls below; no crash loop */
      });
      return this.client;
    } catch {
      return null;
    }
  }

  private async run<T>(op: (c: Redis) => Promise<T>): Promise<T | null> {
    const c = this.redis;
    if (!c) return null;
    try {
      return await op(c);
    } catch {
      return null;
    }
  }

  // ---- OTP storage -------------------------------------------------

  async setOtp(mobile: string, code: string, purpose: string, ttlSeconds: number): Promise<void> {
    const ok = await this.run((c) => c.set(`otp:${purpose}:${mobile}`, code, "EX", ttlSeconds));
    if (ok === null) this.memSet(`otp:${purpose}:${mobile}`, code, ttlSeconds);
  }

  async getOtp(mobile: string, purpose: string): Promise<string | null> {
    const viaRedis = await this.run((c) => c.get(`otp:${purpose}:${mobile}`));
    return viaRedis ?? this.memGet(`otp:${purpose}:${mobile}`);
  }

  async deleteOtp(mobile: string, purpose: string): Promise<void> {
    await this.run((c) => c.del(`otp:${purpose}:${mobile}`));
    this.memDelete(`otp:${purpose}:${mobile}`);
  }

  /** Fixed-window rate limiter; true if the action is allowed. */
  async hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const count = await this.run(async (c) => {
      const n = await c.incr(`rl:${key}`);
      if (n === 1) await c.expire(`rl:${key}`, windowSeconds);
      return n;
    });
    if (count === null) return true; // no Redis -> don't lock users out
    return count <= limit;
  }

  // ---- Response cache (cache-aside) --------------------------------

  /**
   * Cache-aside with single-flight: on a miss, exactly one caller runs the
   * loader while others share the in-flight promise (stampede control).
   */
  async cacheAside<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.run((c) => c.get(`cache:${key}`));
    if (typeof cached === "string") {
      try {
        return JSON.parse(cached) as T;
      } catch {
        /* fall through to loader */
      }
    }
    return this.sharedFlight(key, ttlSeconds, loader);
  }

  private flights = new Map<string, Promise<unknown>>();

  private async sharedFlight<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const existing = this.flights.get(key);
    if (existing) return existing as Promise<T>;
    const flight = (async () => {
      const value = await loader();
      await this.run((c) => c.set(`cache:${key}`, JSON.stringify(value), "EX", ttlSeconds)).catch(() => undefined);
      return value;
    })();
    this.flights.set(key, flight);
    try {
      return await flight;
    } finally {
      this.flights.delete(key);
    }
  }

  /** Drop cached entries, e.g. after a review is added. */
  async invalidate(prefix: string): Promise<void> {
    await this.run(async (c) => {
      const keys = await c.keys(`cache:${prefix}*`);
      if (keys.length > 0) await c.del(...keys);
    });
    for (const k of [...this.flights.keys()]) {
      if (k.startsWith(prefix)) this.flights.delete(k);
    }
  }

  // ---- In-memory fallback ------------------------------------------

  private memSet(key: string, value: string, ttlSeconds: number): void {
    this.memoryFallback.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  private memGet(key: string): string | null {
    const e = this.memoryFallback.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }
    return e.value;
  }

  private memDelete(key: string): void {
    this.memoryFallback.delete(key);
  }
}

export const redisService = new RedisService();

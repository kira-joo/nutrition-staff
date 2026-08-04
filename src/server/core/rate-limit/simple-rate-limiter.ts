/**
 * Minimal in-memory sliding-window rate limiter. No persistence (resets on
 * redeploy/restart) — acceptable for a single-instance deploy protecting a
 * single low-traffic public endpoint, not a general-purpose rate-limiting
 * service. If a second endpoint needs this, or the deploy target becomes
 * multi-instance, replace this with a shared store (Redis, Mongo) instead
 * of copying this file.
 */

interface Bucket {
  count: number;
  windowStartMs: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** `key` is caller-supplied (e.g. `${routeName}:${ip}`) so one process-wide Map can serve multiple call sites without collisions. */
export function checkRateLimit(key: string, { maxRequests, windowMs }: { maxRequests: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartMs >= windowMs) {
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count };
}

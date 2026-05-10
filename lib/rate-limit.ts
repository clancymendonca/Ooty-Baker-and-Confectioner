/**
 * Distributed rate limiter.
 *
 * Backend selection (decided at module load):
 *   - If `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set, use Vercel KV
 *     (Upstash-compatible Redis) so all serverless instances share a counter.
 *   - Otherwise, fall back to an in-process `Map`. This is fine for local dev
 *     and single-instance deploys but offers near-zero protection on
 *     multi-instance serverless platforms.
 *
 * Public API is async to make the KV path natural; in-memory path is a
 * synchronous-via-Promise fast path with no IO.
 */
import { kv } from "@vercel/kv";
import { logger } from "./logger";

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const KV_AVAILABLE = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

type MemoryEntry = { count: number; resetAt: number };
const memoryStore = new Map<string, MemoryEntry>();

function memoryConsume(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, config.max - 1),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  return {
    allowed: existing.count <= config.max,
    remaining: Math.max(0, config.max - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

async function kvConsume(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const namespacedKey = `rl:${key}`;
  const ttlSec = Math.ceil(config.windowMs / 1000);

  try {
    // INCR is atomic; first hit sets count to 1 and we attach a TTL.
    const count = await kv.incr(namespacedKey);
    if (count === 1) {
      await kv.expire(namespacedKey, ttlSec);
    }

    const ttlRemaining = await kv.ttl(namespacedKey);
    const retryAfterSeconds =
      typeof ttlRemaining === "number" && ttlRemaining > 0 ? ttlRemaining : ttlSec;

    return {
      allowed: count <= config.max,
      remaining: Math.max(0, config.max - count),
      retryAfterSeconds,
    };
  } catch (error) {
    // Fail open rather than locking everyone out if KV blips.
    logger.error("Rate limit KV failure - failing open", error);
    return {
      allowed: true,
      remaining: config.max,
      retryAfterSeconds: ttlSec,
    };
  }
}

export async function consumeRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (KV_AVAILABLE) {
    return kvConsume(key, config);
  }
  return memoryConsume(key, config);
}

export async function clearRateLimit(key: string): Promise<void> {
  if (KV_AVAILABLE) {
    try {
      await kv.del(`rl:${key}`);
    } catch (error) {
      logger.error("Rate limit KV delete failed", error);
    }
    return;
  }
  memoryStore.delete(key);
}

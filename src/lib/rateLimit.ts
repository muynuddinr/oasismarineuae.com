/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on login endpoints
 */

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * @param identifier - IP address or user identifier
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const record = store[identifier];

  if (!record || now > record.resetTime) {
    // Create new record
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return true;
  }

  if (record.count < limit) {
    record.count++;
    return true;
  }

  return false;
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  delete store[identifier];
}

/**
 * Cleanup expired records (call periodically)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

// Cleanup every hour
setInterval(cleanupExpiredRecords, 60 * 60 * 1000);

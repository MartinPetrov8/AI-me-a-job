type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/upload': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  '/api/search': { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  '/api/stripe': { windowMs: 60 * 1000, maxRequests: 10 },
};

const EXEMPT_PATHS = ['/api/pipeline', '/api/health'];

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || 'unknown';
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(
  pathname: string,
  headers: Headers
): { allowed: true } | { allowed: false; retryAfter: number } {
  if (EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return { allowed: true };
  }

  const config = Object.entries(RATE_LIMITS).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  if (!config) {
    return { allowed: true };
  }

  const ip = getClientIp(headers);
  const key = `${pathname}:${ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 10 * 60 * 1000);
}

import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Request rate limiting.
 *
 * Written here rather than pulled from a package because the need is narrow
 * and the behaviour worth controlling exactly: the point is to make credential
 * stuffing and one-time-code guessing expensive, and to stop one caller from
 * monopolising the code-execution engine.
 *
 * The counters live in this process. That is the right scope for a single
 * instance and is honest about its limit: run more than one and each gets its
 * own allowance, so the effective limit multiplies by the instance count. If
 * this ever runs behind more than one container, move the counters to Redis —
 * `lib/redis.ts` is already here — rather than raising the numbers.
 */

interface Bucket {
  count: number;
  /** When the current window ends, in epoch milliseconds. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests permitted per key per window. */
  max: number;
  /** Shown to the caller when they run out. */
  message?: string;
  /**
   * Group requests. Defaults to the client address, which is what you want for
   * a login form; an authenticated expensive route is better keyed by user, so
   * that one office behind one address is not treated as one person.
   */
  keyOf?: (req: Request) => string;
  /** Skip counting requests that succeeded — used so a correct login is free. */
  skipSuccessful?: boolean;
}

/**
 * The caller's address.
 *
 * `req.ip` is only trustworthy once Express is told how many proxies sit in
 * front of it; see `trust proxy` in index.ts. Without that every request behind
 * a load balancer looks like it comes from the balancer, and one person could
 * exhaust everyone's allowance.
 */
const addressOf = (req: Request): string => req.ip ?? req.socket.remoteAddress ?? "unknown";

/** Bounded so a flood of distinct keys cannot grow the map without limit. */
const MAX_KEYS = 20_000;

export function rateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, max, message = "Too many requests. Please slow down and try again shortly.", keyOf = addressOf, skipSuccessful = false } = options;
  const buckets = new Map<string, Bucket>();

  const sweep = (now: number) => {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  };

  // Expired buckets are also cleared on a timer, not only once the cap is hit,
  // so a quiet process does not sit on thousands of dead entries. unref() so
  // the timer never holds a script or a test run open.
  setInterval(() => sweep(Date.now()), windowMs).unref();

  return function limiter(req: Request, res: Response, next: NextFunction): void {
    // A CORS preflight is the browser's question, not the caller's request,
    // and `cors` is mounted ahead of every limiter so one never gets here.
    // Kept as a guard in case that order ever changes.
    if (req.method === "OPTIONS") {
      next();
      return;
    }

    const now = Date.now();
    if (buckets.size > MAX_KEYS) sweep(now);

    const key = keyOf(req);
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));

    if (bucket.count > max) {
      res.setHeader("Retry-After", String(resetSeconds));
      res.status(429).json({ error: message });
      return;
    }

    // A correct password should not use up the budget meant for wrong ones,
    // so an allowed outcome can refund its own attempt.
    if (skipSuccessful) {
      res.on("finish", () => {
        if (res.statusCode < 400 && bucket!.count > 0) bucket!.count -= 1;
      });
    }

    next();
  };
}

/**
 * Guessing a password, a one-time code or a reset. Deliberately tight: a
 * person who genuinely forgot their password does not need ten tries a minute,
 * and an attacker needs thousands.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts from this address. Try again in a few minutes.",
  skipSuccessful: true,
});

/** Asking for a code by email, which also sends mail on our behalf. */
export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 6,
  message: "Too many verification codes requested. Try again later.",
});

/**
 * Running or judging code. Every call costs an external execution, so this is
 * keyed by account: one signed-in person cannot drain the engine, and people
 * sharing an address do not share a budget.
 */
export const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "You are running code very quickly. Give it a moment.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * Everything else. Loose enough that ordinary use never notices, tight enough
 * that a scraper walking the whole catalogue is slowed down.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
});

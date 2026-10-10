import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createHash } from "node:crypto";
import { isIP } from "node:net";

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
 * An address as a rate-limit key: an IPv4 address as itself, an IPv6 one by
 * its /64.
 *
 * The API answers on IPv6 since 2026-10-03, and a /64 is what one home or one
 * phone is handed: its owner may use any of 2^64 addresses inside it (privacy
 * addresses rotate on their own), so keying the whole address would give a
 * script a fresh allowance per request. An IPv4-mapped address (::ffff:1.2.3.4)
 * is its IPv4 address. Anything that is not an address comes back unchanged.
 */
export function addressKey(ip: string): string {
  const bare = ip.split("%")[0] ?? ip;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(bare);
  if (mapped?.[1]) return mapped[1];
  if (isIP(bare) !== 6) return ip;
  const split = (s: string | undefined) => (s ? s.split(":") : []);
  const [head, tail] = bare.split("::");
  const front = split(head);
  // An embedded IPv4 tail (…:1.2.3.4) is two groups' worth.
  const width = (groups: string[]) => groups.reduce((n, g) => n + (g.includes(".") ? 2 : 1), 0);
  const groups = tail === undefined ? front : [...front, ...Array<string>(8 - width(front) - width(split(tail))).fill("0"), ...split(tail)];
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}

/**
 * The caller's address, as a rate-limit key (`addressKey`).
 *
 * `req.ip` is only trustworthy once Express is told how many proxies sit in
 * front of it; see `trust proxy` in index.ts. Without that every request behind
 * a load balancer looks like it comes from the balancer, and one person could
 * exhaust everyone's allowance.
 */
export const addressOf = (req: Request): string => addressKey(req.ip ?? req.socket.remoteAddress ?? "unknown");

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

/**
 * The same budget again, per account rather than per address.
 *
 * `authLimiter` alone stops one machine from guessing; it does nothing about
 * a thousand machines each spending nineteen guesses on the same account,
 * which is what a credential-stuffing run looks like. Keyed on the
 * identifier the body names (lower-cased, as the route reads it), so the
 * account itself has a ceiling wherever the attempts come from. A correct
 * password refunds its attempt, and the window is short, so the worst a
 * stranger can do by spending it is keep the owner waiting a quarter of an
 * hour — not lock them out.
 *
 * Mounted after `express.json`, so the body is there to read; a request with
 * no identifier falls back to the address bucket and is refused by the route.
 */
export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many sign-in attempts for this account. Try again in a few minutes.",
  skipSuccessful: true,
  keyOf: (req) => {
    const raw = (req.body as { identifier?: unknown; email?: unknown } | undefined)?.identifier
      ?? (req.body as { email?: unknown } | undefined)?.email;
    return typeof raw === "string" && raw.trim() ? `u:${raw.trim().toLowerCase().slice(0, 254)}` : `a:${addressOf(req)}`;
  },
});

/**
 * Creating accounts, counted whether they succeed or not.
 *
 * `authLimiter` refunds a success, which is right for a login and wrong
 * here: every registration *is* a success for the one making them. Under it
 * alone one address could create accounts at the general limit — 300 a
 * minute — and each costs a cost-12 bcrypt (bcryptjs, ~250 ms of this
 * process's own thread, so a few a second starve every other request), a
 * verification mail against Brevo's 300-a-day plan, and an account that can
 * queue code on the shared engine. Thirty an hour still lets a computer lab
 * behind one NAT sign up together.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: "Too many accounts created from this address. Try again later.",
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
 *
 * Keyed by session where there is one, by address otherwise. This limiter
 * runs ahead of the auth middleware, so `req.user` is not available; the
 * bearer token itself is the key — hashed, since it is a credential. The
 * audience is Indian college students, and a computer lab is thirty people
 * behind one NAT address: a dashboard load is a dozen requests, and a class
 * opening the site together used to exhaust the address's allowance in
 * seconds and 429 everyone in the room. A forged token only buys the forger
 * a bucket of their own, which an address hop would have bought anyway.
 */
function sessionOrAddress(req: Request): string {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ") && auth.length > 20) {
    return `s:${createHash("sha256").update(auth.slice(7)).digest("base64url").slice(0, 24)}`;
  }
  return `a:${addressOf(req)}`;
}

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyOf: sessionOrAddress,
});

/**
 * Posting and commenting. Mounted after `requireAuth`, so keyed by account:
 * the feed had no per-person write limit at all, and one account could fill
 * it — and everyone's notification bell, through mentions — at the general
 * allowance of hundreds a minute.
 */
export const communityWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: "You are posting very quickly. Give it a few minutes.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * Unauthenticated writes that create rows — an application form that anyone
 * on the internet may post to. Tight per address: a person applies once.
 */
export const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many submissions from this address. Try again later.",
});

/**
 * Resume uploads. Each one parses a document and writes several rows, and
 * nobody uploads more than a few versions of their own resume in an hour.
 * Mounted after `requireAuth`, so keyed by account.
 */
export const resumeUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "You have uploaded a lot of resumes in the last hour. Give it a little while.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * Resume model calls — an analysis, a bullet rewrite, a whole-resume
 * optimisation. Each is a round trip to the shared free-tier model; a
 * person clicks these a few dozen times in a session, a script would not
 * stop. Keyed by account.
 */
export const resumeAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: "That is a lot of AI requests in one hour. Give it a little while before the next one.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * A written interview question read aloud (lib/polly.ts). The audio is cached
 * per question, so only a first read spends Polly characters; a round asks
 * ~7 questions and a person replays a few. The ceiling stops a script cycling
 * through question ids. Keyed by account.
 */
export const speechLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  message: "That is a lot of read-alouds in one hour. Give it a little while.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * Shareable win pictures. The share dialog uploads one when it opens; a
 * person shares a handful of wins in an hour. Each is a ~100 KB row, so the
 * ceiling is what keeps a script from filling the table. Keyed by account.
 */
/**
 * The content pages' link-preview cards (GET /api/seo/card.png). A render is
 * ~70 ms of CPU and the route is unsigned, ahead of the general limiter; a
 * platform fetches a preview once per share, so this only stops a script
 * walking all 3,229 pages to keep the one box busy drawing.
 */
export const contentCardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many preview images. Please slow down.",
});

export const shareCardLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: "You have made a lot of share cards in the last hour. Give it a little while.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * The account's own data: a full export (some forty reads over every table
 * the account touches) and deletion, whose confirmation checks a password.
 * Nobody needs more than a few of either in an hour; the ceiling stops a
 * stolen session from hammering the export or guessing the password through
 * the delete form. Keyed by account, mounted after `requireAuth`.
 */
export const accountDataLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "That is a lot of account requests in one hour. Give it a little while.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

/**
 * "Email me this link" from a phone (POST /api/me/send-link). It mails the
 * account's own address only, so the worst a script does is fill its own
 * inbox — but every send spends the Brevo free plan's 300 a day, shared
 * with the sign-in codes. Five a day per account is plenty for a person
 * saving a few problems for later. Keyed by account.
 */
export const sendLinkLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: "That is five links today — open the rest from your laptop's history, or try again tomorrow.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

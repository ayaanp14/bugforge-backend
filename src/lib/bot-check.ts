/**
 * Two cheap tells of a form filled by a script, read off the JSON body of
 * the public forms (register, forgot password, the campus application).
 *
 * - A honeypot: the SPA renders an input named HONEYPOT_FIELD off-screen,
 *   hidden from assistive technology and out of the tab order
 *   (frontend components/common/BotTrap). A person never sees it; a
 *   form-filling bot fills every input it finds. Anything in it is a bot.
 * - Fill time: the SPA sends FILL_TIME_FIELD, the milliseconds between the
 *   form appearing and its submit. A bot posts the moment the page loads;
 *   a person reads, types and waits for the username check.
 *
 * A request carrying neither passes — the mobile app, older SPA builds and
 * a direct API client send no such fields, and must keep working (the
 * backend is not changed to accommodate the app, and not against it
 * either). So this stops the generic form-spam bots that crawl for <form>s,
 * not a script written against this API: anyone reading the bundle can
 * send an empty honeypot and a plausible time. The per-IP limiters
 * (middleware/rate-limit) remain the cap on those, and email verification
 * keeps an account a script registers from ever signing in. A challenge
 * (Cloudflare Turnstile) is the next step if that stops being enough; it
 * would need a site key, a CSP entry and a way for the app to pass it.
 */

export const HONEYPOT_FIELD = "website";
export const FILL_TIME_FIELD = "formMs";

/**
 * The fastest a person fills one of these forms. Register needs an email, a
 * password and a username that has passed its live check (600 ms debounce
 * plus the request) — well over 1.5 s even with the first two autofilled.
 */
export const MIN_FILL_MS = 1500;

export type BotSignal = "honeypot" | "too-fast";

/** Why a submission looks automated, or null when it does not. */
export function botSignal(body: Record<string, unknown>, opts: { minFillMs?: number } = {}): BotSignal | null {
  const trap = body[HONEYPOT_FIELD];
  if (typeof trap === "string" ? trap.trim() !== "" : trap != null && trap !== false) return "honeypot";
  const elapsed = body[FILL_TIME_FIELD];
  const minFillMs = opts.minFillMs ?? MIN_FILL_MS;
  if (minFillMs > 0 && typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed < minFillMs) return "too-fast";
  return null;
}

/**
 * What a person who tripped a check is told. Too fast is the one a human
 * can actually hit (a form autofilled and sent at once), so it says what to
 * do; resending a second later passes. The honeypot's answer names nothing
 * a bot could learn from.
 */
export const BOT_SIGNAL_ERROR: Record<BotSignal, string> = {
  honeypot: "We couldn't send this form. Reload the page and try again.",
  "too-fast": "That was quick — check the form and send it again.",
};

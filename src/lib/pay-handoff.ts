import crypto from "node:crypto";
import { JWT_SECRET } from "./secrets.js";

/**
 * The desktop app's checkout hand-off (since 2026-11-19).
 *
 * The site pays through Cashfree's JS SDK, which opens checkout only from a
 * domain Cashfree has whitelisted — codekairo.com — and the Windows app has
 * no web view to run it in. Sending the member to sign in on the website to
 * pay was not an option either: one device at a time (lib/session-
 * revocation), so the browser's sign-in would end the app's session.
 *
 * So the app makes the order with its own session (POST /api/billing/checkout
 * `{ client: "desktop" }`) and opens only the payment step in the system
 * browser: the site's /pay page, which needs no account. What it carries is
 * this ticket — the order and the account it is for, signed and short-lived
 * — and with it the page reads what it is paying for and whose account
 * (GET /api/billing/pay/:ticket), runs the SDK on the order's own
 * payment_session_id, and after Cashfree sends the browser back, asks for
 * the order to be confirmed (POST /api/billing/pay/:ticket/verify). The app
 * meanwhile watches the order under its own session until it is paid.
 *
 * What a ticket is good for, and so what one leaked is worth: paying for
 * that order (which only ever gives its owner what they chose to buy) and
 * reading what the page shows — the product, the price, the account's name
 * and a masked address. It is never a session and grants nothing; a
 * payment still has to clear at Cashfree, and only the webhook or the
 * gateway's own answer to /verify grants access (routes/billing.ts).
 *
 * The page names the account before the member pays, because a pay link on
 * our own domain could otherwise be forwarded to someone else as "pay
 * here" — they would see whose order it is.
 *
 * The key is derived from JWT_SECRET under its own label (the GitHub link
 * tickets' pattern, lib/github.ts), so a ticket can never pass for a session
 * token, a GitHub ticket or a visitor pass, nor any of those for it.
 */
const PAY_KEY = crypto.createHmac("sha256", JWT_SECRET).update("pay-handoff:v1").digest();

/**
 * Long enough to pay by UPI with the phone in another room and come back,
 * short enough that a link left in a browser's history stops working the
 * same day. The app stops waiting well before this (it says so).
 */
export const PAY_TICKET_TTL_MS = 2 * 60 * 60_000;

/** Our order ids (routes/billing.ts): `ck_` + 24 hex. Nothing else is ever signed or accepted. */
const ORDER_ID = /^ck_[0-9a-f]{24}$/;

export interface PayTicket {
  orderId: string;
  userId: string;
  /** Epoch ms after which the ticket is refused. */
  expiresAt: number;
}

interface Sealed {
  o: string;
  u: string;
  e: number;
}

export function payTicket(orderId: string, userId: string, now = Date.now()): { ticket: string; expiresAt: number } {
  if (!ORDER_ID.test(orderId) || !userId) throw new Error("pay ticket: not an order of ours");
  const expiresAt = now + PAY_TICKET_TTL_MS;
  const body = Buffer.from(JSON.stringify({ o: orderId, u: userId, e: expiresAt } satisfies Sealed)).toString("base64url");
  const sig = crypto.createHmac("sha256", PAY_KEY).update(body).digest("base64url");
  return { ticket: `${body}.${sig}`, expiresAt };
}

/** The order and account a ticket names, or null for anything forged, rewritten, expired or malformed. */
export function readPayTicket(token: unknown, now = Date.now()): PayTicket | null {
  if (typeof token !== "string" || token.length > 512) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = crypto.createHmac("sha256", PAY_KEY).update(body).digest();
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) return null;
  try {
    const sealed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<Sealed>;
    if (typeof sealed.o !== "string" || !ORDER_ID.test(sealed.o)) return null;
    if (typeof sealed.u !== "string" || !sealed.u) return null;
    if (typeof sealed.e !== "number" || sealed.e <= now) return null;
    return { orderId: sealed.o, userId: sealed.u, expiresAt: sealed.e };
  } catch {
    return null;
  }
}

/**
 * Where the browser goes, and where Cashfree sends it back.
 *
 * The page's own link carries the ticket in the fragment, which the browser
 * never sends to a server (no Cloudflare log, no Referer). Cashfree's
 * return_url is a plain URL it redirects to, so there it rides in the query;
 * the page moves it back into the fragment the moment it loads.
 */
export function desktopCheckoutUrls(frontendUrl: string, ticket: string): { payUrl: string; returnUrl: string } {
  const base = frontendUrl.replace(/\/+$/, "");
  return {
    payUrl: `${base}/pay#${ticket}`,
    returnUrl: `${base}/pay?done=1&t=${encodeURIComponent(ticket)}`,
  };
}

/**
 * The address as the pay page shows it: enough for its owner to recognise
 * ("a•••n@gmail.com"), not enough to give it away to whoever holds the link.
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const shown = local.length <= 2 ? `${local[0]}•••` : `${local[0]}•••${local[local.length - 1]}`;
  return `${shown}@${domain}`;
}

/** Whether a checkout body asks for the desktop hand-off. Anything but the literal is the site's flow, as before. */
export const wantsDesktopHandoff = (body: unknown): boolean => (body as { client?: unknown } | null)?.client === "desktop";

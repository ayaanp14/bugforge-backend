import crypto from "node:crypto";

/**
 * Cashfree Payment Gateway, orders API `2023-08-01`.
 *
 * The flow is deliberately the boring one: we create an order server-side, hand
 * the browser only a `payment_session_id`, and let Cashfree's own checkout
 * collect the card. No card data ever touches this process, which is the whole
 * point of using a gateway.
 *
 * Access is granted from the *webhook*, not from the browser coming back to the
 * return URL. A return URL is a redirect the user controls and can forge or
 * simply never reach; the webhook is signed and arrives whether or not they
 * close the tab. The return URL only decides what they see next.
 *
 * Nothing above `PaymentProvider` is Cashfree-shaped, so a second gateway is a
 * second implementation rather than a rewrite of the billing routes.
 */

const API_VERSION = "2023-08-01";

/** Sandbox unless explicitly switched — production is opt-in, never a default. */
function baseUrl(): string {
  return process.env["CASHFREE_ENV"] === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

/**
 * Cashfree's dashboard labels the pair "App ID" and "Secret Key", but their own
 * SDKs read `CASHFREE_APP_SECRET`, so deployments end up with one name or the
 * other. Both are accepted rather than making an existing `.env` wrong.
 */
function secretKey(): string | undefined {
  return process.env["CASHFREE_SECRET_KEY"] || process.env["CASHFREE_APP_SECRET"];
}

function credentials() {
  const appId = process.env["CASHFREE_APP_ID"];
  const secret = secretKey();
  if (!appId || !secret) throw new PaymentsUnavailable("Payments are not configured on this deployment.");
  return { appId, secret };
}

export function isConfigured(): boolean {
  return Boolean(process.env["CASHFREE_APP_ID"] && secretKey());
}

/** Raised with a message the buyer is allowed to read verbatim. */
export class PaymentsUnavailable extends Error {
  readonly userFacing = true;
}

export interface CreateOrderArgs {
  orderId: string;
  amount: number;
  currency: string;
  customer: { id: string; name: string | null; email: string | null; phone: string | null };
  returnUrl: string;
  notifyUrl?: string;
}

export interface CreatedOrder {
  paymentSessionId: string;
  providerOrderId: string;
}

/**
 * Cashfree rejects an order with no contactable customer, and a fair number of
 * accounts here signed up through GitHub or Google with no phone number at all.
 * Sandbox accepts a placeholder, so one is supplied rather than blocking
 * checkout on a field the product never asked the user for.
 */
const FALLBACK_PHONE = process.env["CASHFREE_FALLBACK_PHONE"] || "9999999999";

export async function createOrder(args: CreateOrderArgs): Promise<CreatedOrder> {
  const { appId, secret } = credentials();

  const response = await fetch(`${baseUrl()}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secret,
    },
    body: JSON.stringify({
      order_id: args.orderId,
      order_amount: args.amount,
      order_currency: args.currency,
      customer_details: {
        // Cashfree requires this to be alphanumeric; cuids already are.
        customer_id: args.customer.id,
        customer_name: args.customer.name || "CodeKairo user",
        customer_email: args.customer.email || "billing@codekairo.com",
        customer_phone: args.customer.phone || FALLBACK_PHONE,
      },
      order_meta: {
        return_url: args.returnUrl,
        ...(args.notifyUrl ? { notify_url: args.notifyUrl } : {}),
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    payment_session_id?: string;
    cf_order_id?: string | number;
    order_id?: string;
    message?: string;
    code?: string;
  };

  if (!response.ok || !payload.payment_session_id) {
    // The upstream message can quote credentials and internal codes, so it is
    // logged rather than returned.
    console.error("[billing] Cashfree order failed:", response.status, payload.code, payload.message);
    throw new PaymentsUnavailable("Could not start checkout. Please try again in a moment.");
  }

  return {
    paymentSessionId: payload.payment_session_id,
    providerOrderId: String(payload.cf_order_id ?? payload.order_id ?? args.orderId),
  };
}

export interface FetchedOrder {
  status: string;
  amount: number | null;
  raw: unknown;
}

/**
 * The source of truth when the webhook has not arrived.
 *
 * The browser returning from checkout proves nothing, so the return handler
 * asks Cashfree directly rather than trusting the redirect it just received.
 */
export async function fetchOrder(orderId: string): Promise<FetchedOrder> {
  const { appId, secret } = credentials();

  const response = await fetch(`${baseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secret,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    order_status?: string;
    order_amount?: number;
  };

  if (!response.ok) {
    console.error("[billing] Cashfree order lookup failed:", response.status);
    throw new PaymentsUnavailable("Could not confirm your payment. It will be applied automatically if it went through.");
  }

  return {
    status: payload.order_status ?? "UNKNOWN",
    amount: payload.order_amount ?? null,
    raw: payload,
  };
}

/**
 * Webhook authenticity.
 *
 * Cashfree signs `timestamp + rawBody` with the account secret and sends the
 * base64 digest as `x-webhook-signature`. Two details matter and are easy to
 * get wrong:
 *
 *  - It must be the *raw* bytes. Re-serialising the parsed JSON changes key
 *    order and whitespace, and the signature then never matches.
 *  - The comparison is constant-time. A plain `===` leaks, byte by byte, how
 *    much of a guessed signature was correct, which is enough to forge one.
 *
 * The timestamp is part of the signed string, so replaying an old body with a
 * new timestamp invalidates it.
 */
export function verifyWebhook(rawBody: Buffer | string, signature: string, timestamp: string): boolean {
  if (!signature || !timestamp) return false;

  const secret = secretKey();
  if (!secret) return false;

  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}${body}`).digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // timingSafeEqual throws on a length mismatch, which is itself a rejection.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** The slice of a webhook body the billing routes act on. */
export interface WebhookEvent {
  type: string;
  orderId: string | null;
  paymentStatus: string | null;
  paymentId: string | null;
}

export function parseWebhook(body: unknown): WebhookEvent {
  const payload = body as {
    type?: string;
    data?: {
      order?: { order_id?: string };
      payment?: { payment_status?: string; cf_payment_id?: string | number };
    };
  };

  return {
    type: payload?.type ?? "UNKNOWN",
    orderId: payload?.data?.order?.order_id ?? null,
    paymentStatus: payload?.data?.payment?.payment_status ?? null,
    paymentId:
      payload?.data?.payment?.cf_payment_id !== undefined
        ? String(payload.data.payment.cf_payment_id)
        : null,
  };
}

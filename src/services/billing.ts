import type { PrismaClient } from "@prisma/client";
import { periodEnd, type BillingPeriod } from "../lib/plans.js";
import { trackServerEvent } from "../lib/telemetry.js";
import type { WebhookEvent } from "./cashfree.js";

/**
 * What a payment does to an account. Lifted out of routes/billing.ts so the
 * money path — the one place a bug costs someone real rupees or a paying
 * customer their access — can be exercised by a test with an in-memory
 * client rather than only by paying in sandbox and watching the logs. The
 * route stays a thin shell: verify the signature, parse, call in here.
 *
 * `db` is the slice of the Prisma client these functions touch; the route
 * passes the real client, the test passes a fake.
 */
export type BillingDb = Pick<PrismaClient, "paymentOrder" | "subscription">;

/**
 * Marks an order paid and extends the subscription.
 *
 * Idempotent by design. Cashfree may deliver the same webhook more than once,
 * and the return handler races it — so the first writer flips the row out of
 * "created" inside a transaction, and every later caller sees a row that is
 * already paid and does nothing. Without that, one payment could grant two
 * months.
 *
 * A period is *extended* rather than replaced when one is already running, so
 * renewing early never destroys time the user has paid for.
 *
 * "failed" is claimable too. A Cashfree order outlives a single payment
 * attempt: a declined card sends a FAILED webhook, the buyer retries on the
 * same order and pays, and a SUCCESS webhook follows. Claiming only from
 * "created" meant that second webhook matched nothing, no subscription was
 * written, and /verify — seeing the gateway say PAID — told the buyer their
 * plan was active. Paid, no access.
 */
export async function grantAccess(db: BillingDb, orderId: string, paymentId: string | null, raw: unknown): Promise<boolean> {
  const claimed = await db.paymentOrder.updateMany({
    where: { id: orderId, status: { in: ["created", "failed"] } },
    data: { status: "paid", providerPaymentId: paymentId, raw: (raw ?? {}) as object },
  });

  // Someone else already processed this order.
  if (claimed.count === 0) return false;

  const order = await db.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) return false;

  const now = new Date();
  const existing = await db.subscription.findFirst({
    where: { userId: order.userId, status: "active", currentPeriodEnd: { gt: now } },
    orderBy: { currentPeriodEnd: "desc" },
  });

  const period = order.period as BillingPeriod;

  if (existing && existing.planId === order.planId) {
    // Same plan again: add another period to the end of the current one.
    await db.subscription.update({
      where: { id: existing.id },
      data: { currentPeriodEnd: periodEnd(existing.currentPeriodEnd, period), orderId },
    });
    trackServerEvent("subscription_renewed", { planId: order.planId, period, amount: order.amount }, order.userId);
    return true;
  }

  // A different plan supersedes whatever is running. The remaining time on the
  // old one is not refunded here — an upgrade mid-period is a product decision,
  // and silently discarding it in a webhook is not the place to make it.
  if (existing) {
    await db.subscription.update({ where: { id: existing.id }, data: { status: "cancelled" } });
  }

  await db.subscription.create({
    data: {
      userId: order.userId,
      planId: order.planId,
      period,
      status: "active",
      startedAt: now,
      currentPeriodEnd: periodEnd(now, period),
      orderId,
    },
  });
  trackServerEvent("subscription_granted", { planId: order.planId, period, amount: order.amount, upgrade: Boolean(existing) }, order.userId);

  return true;
}

export type WebhookOutcome = "granted" | "duplicate" | "failed" | "refunded" | "ignored";

/**
 * What one verified webhook event does. Called after the response has been
 * sent (see the route), so it must never throw for an event it merely does
 * not care about — those are "ignored".
 */
export async function applyWebhookEvent(db: BillingDb, event: WebhookEvent): Promise<WebhookOutcome> {
  if (!event.orderId) return "ignored";

  if (event.paymentStatus === "SUCCESS") {
    const granted = await grantAccess(db, event.orderId, event.paymentId, event);
    return granted ? "granted" : "duplicate";
  }

  if (event.paymentStatus === "FAILED") {
    await db.paymentOrder.updateMany({
      where: { id: event.orderId, status: "created" },
      data: { status: "failed", raw: (event ?? {}) as object },
    });
    return "failed";
  }

  if (event.refundStatus === "SUCCESS") {
    // Money went back: whatever this order bought stops. These events were
    // logged and ignored, so a refunded month stayed active to its end.
    await Promise.all([
      db.paymentOrder.updateMany({
        where: { id: event.orderId, status: "paid" },
        data: { status: "refunded", raw: (event ?? {}) as object },
      }),
      db.subscription.updateMany({
        where: { orderId: event.orderId, status: "active" },
        data: { status: "cancelled" },
      }),
    ]);
    return "refunded";
  }

  return "ignored";
}

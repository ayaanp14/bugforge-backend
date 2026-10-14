import type { PrismaClient } from "@prisma/client";
import { CREDITS_PRODUCT, creditPackFor, offerFor, periodEnd, tierOf } from "../lib/plans.js";
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
export type BillingDb = Pick<PrismaClient, "paymentOrder" | "subscription" | "creditGrant">;

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
 * renewing early never destroys time the user has paid for — and an upgrade
 * pauses the lower plan rather than ending it.
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

  // A credit pack adds to the wallet and touches no plan. One grant per
  // order (`orderId` is unique), so this is idempotent on its own as well.
  if (order.planId === CREDITS_PRODUCT) {
    const pack = creditPackFor(order.period);
    if (!pack) {
      console.error(`[billing] paid order ${order.id} names no credit pack ("${order.period}")`);
      return false;
    }
    try {
      await db.creditGrant.create({ data: { userId: order.userId, credits: pack.credits, source: "purchase", orderId: order.id } });
    } catch (err) {
      if ((err as { code?: string })?.code !== "P2002") throw err;
    }
    trackServerEvent("credits_granted", { pack: pack.id, credits: pack.credits, amount: order.amount }, order.userId);
    return true;
  }

  // Pro Max pays its bonus credits into the wallet with the plan, under the
  // order's id — the same unique key that makes a pack's grant one-shot.
  const bonus = offerFor(order.period)?.bonusCredits ?? 0;
  if (bonus > 0) {
    try {
      await db.creditGrant.create({ data: { userId: order.userId, credits: bonus, source: "purchase", orderId: order.id } });
    } catch (err) {
      if ((err as { code?: string })?.code !== "P2002") throw err;
    }
  }

  const now = new Date();
  // The account's live rows (one, rarely two: a Pro paused under a Pro Max).
  const live = await db.subscription.findMany({
    where: { userId: order.userId, status: "active", currentPeriodEnd: { gt: now } },
    orderBy: { currentPeriodEnd: "desc" },
    take: 10,
  });

  // An offer id (lib/plans PLAN_OFFERS), or the legacy "monthly"/"yearly".
  const period = order.period;

  // Same plan again — or Pro on top of the old Starter, which holds Pro's
  // entitlements (lib/plans LEGACY_PLANS): add the time to the end.
  const same = live.find((row) => row.planId === order.planId || (row.planId === "starter" && order.planId === "pro"));
  if (same) {
    await db.subscription.update({
      where: { id: same.id },
      data: { planId: order.planId, currentPeriodEnd: periodEnd(same.currentPeriodEnd, period), orderId },
    });
    trackServerEvent("subscription_renewed", { planId: order.planId, period, amount: order.amount }, order.userId);
    return true;
  }

  // A higher plan (Pro → Pro Max): it starts now, and every lower plan still
  // running is *paused* under it — its end moves out by the time just
  // bought, so the days paid for are still there when the higher plan ends
  // (activePlan reads the highest tier first). Before 2026-10-15 an upgrade
  // cancelled the running plan and its remaining days were lost. Checkout
  // refuses a lower plan while a higher one runs, so a lower row is all
  // this can meet.
  const paused = live.filter((row) => tierOf(row.planId) < tierOf(order.planId));
  for (const row of paused) {
    await db.subscription.update({ where: { id: row.id }, data: { currentPeriodEnd: periodEnd(row.currentPeriodEnd, period) } });
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
  trackServerEvent("subscription_granted", { planId: order.planId, period, amount: order.amount, upgrade: paused.length > 0 }, order.userId);

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
      // A refunded credit pack takes its credits back; what was already
      // spent from it stays spent (the balance floors at zero).
      db.creditGrant.deleteMany({ where: { orderId: event.orderId } }),
    ]);
    return "refunded";
  }

  return "ignored";
}

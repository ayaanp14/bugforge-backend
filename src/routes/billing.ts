import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  PLANS,
  isPaidPlan,
  periodEnd,
  planFor,
  priceOf,
  type BillingPeriod,
} from "../lib/plans.js";
import { entitlementFor } from "../services/entitlements.js";
import {
  createOrder,
  fetchOrder,
  isConfigured,
  parseWebhook,
  PaymentsUnavailable,
  verifyWebhook,
} from "../services/cashfree.js";

/**
 * Subscriptions.
 *
 * The rule the whole file is arranged around: **only a verified gateway
 * response may grant access.** The browser is never trusted with the amount,
 * the plan, or whether the payment succeeded — it only says which plan it wants
 * and gets back a session id. Everything else is decided here or by Cashfree.
 */

const router = Router();

const FRONTEND_URL = (process.env["FRONTEND_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");

function asPeriod(value: unknown): BillingPeriod {
  return value === "yearly" ? "yearly" : "monthly";
}

/* ── catalogue ─────────────────────────────────────────────────────────── */

/**
 * @route   GET /api/billing/plans
 * @desc    The pricing table. Public — it is a marketing page.
 * @access  Public
 */
router.get("/plans", (_req, res) => {
  res.json({
    plans: PLANS,
    currency: "INR",
    /** False when no keys are set: the UI then shows plans without checkout. */
    checkoutEnabled: isConfigured(),
  });
});

/**
 * @route   GET /api/billing/me
 * @desc    The caller's plan, what it allows, and what they have used
 * @access  Private
 */
router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const entitlement = await entitlementFor(req.user.userId);
    res.json({
      planId: entitlement.plan.id,
      planName: entitlement.plan.name,
      entitlements: entitlement.plan.entitlements,
      currentPeriodEnd: entitlement.currentPeriodEnd,
      usage: entitlement.usage,
      remaining: {
        interviewsThisWeek:
          entitlement.plan.entitlements.interviewsPerWeek === null
            ? null
            : Math.max(0, entitlement.plan.entitlements.interviewsPerWeek - entitlement.usage.interviewsThisWeek),
        bugsToday:
          entitlement.plan.entitlements.bugsPerDay === null
            ? null
            : Math.max(0, entitlement.plan.entitlements.bugsPerDay - entitlement.usage.bugsToday),
      },
    });
  } catch (error: any) {
    console.error("[billing] entitlement lookup failed:", error?.message);
    res.status(500).json({ error: "Could not load your plan" });
  }
});

/* ── checkout ──────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/billing/checkout
 * @desc    Open a Cashfree order for a plan and return its session id
 * @access  Private
 *
 * The price comes from the catalogue, never from the request. A client that
 * posts `{ planId: "elite", amount: 1 }` gets charged the catalogue price for
 * elite, because `amount` is not read at all.
 */
router.post("/checkout", requireAuth, async (req: any, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({ error: "Payments are not configured on this deployment." });
    }

    const planId = String(req.body?.planId ?? "");
    const period = asPeriod(req.body?.period);

    if (!isPaidPlan(planId)) {
      return res.status(400).json({ error: "That plan cannot be purchased." });
    }

    const plan = planFor(planId);
    const amount = priceOf(plan, period);
    if (amount <= 0) return res.status(400).json({ error: "That plan cannot be purchased." });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: "Account not found" });

    // Our id, not the gateway's: the row exists before the gateway is told
    // anything, so a webhook for an unknown order is rejected rather than
    // creating a subscription out of thin air.
    const orderId = `ck_${crypto.randomBytes(12).toString("hex")}`;

    await prisma.paymentOrder.create({
      data: {
        id: orderId,
        userId: user.id,
        planId: plan.id,
        period,
        amount,
        currency: "INR",
        status: "created",
      },
    });

    const created = await createOrder({
      orderId,
      amount,
      currency: "INR",
      customer: { id: user.id, name: user.name, email: user.email, phone: null },
      returnUrl: `${FRONTEND_URL}/pricing?order=${orderId}`,
    });

    await prisma.paymentOrder.update({
      where: { id: orderId },
      data: { paymentSessionId: created.paymentSessionId },
    });

    res.json({
      orderId,
      paymentSessionId: created.paymentSessionId,
      // The browser SDK needs to know which Cashfree environment to open.
      mode: process.env["CASHFREE_ENV"] === "production" ? "production" : "sandbox",
      amount,
      period,
      planId: plan.id,
    });
  } catch (error: any) {
    if (error instanceof PaymentsUnavailable) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[billing] checkout failed:", error?.message);
    res.status(500).json({ error: "Could not start checkout" });
  }
});

/* ── granting access ───────────────────────────────────────────────────── */

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
 */
async function grantAccess(orderId: string, paymentId: string | null, raw: unknown): Promise<boolean> {
  const claimed = await prisma.paymentOrder.updateMany({
    where: { id: orderId, status: "created" },
    data: { status: "paid", providerPaymentId: paymentId, raw: (raw ?? {}) as object },
  });

  // Someone else already processed this order.
  if (claimed.count === 0) return false;

  const order = await prisma.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) return false;

  const now = new Date();
  const existing = await prisma.subscription.findFirst({
    where: { userId: order.userId, status: "active", currentPeriodEnd: { gt: now } },
    orderBy: { currentPeriodEnd: "desc" },
  });

  const period = order.period as BillingPeriod;

  if (existing && existing.planId === order.planId) {
    // Same plan again: add another period to the end of the current one.
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { currentPeriodEnd: periodEnd(existing.currentPeriodEnd, period), orderId },
    });
    return true;
  }

  // A different plan supersedes whatever is running. The remaining time on the
  // old one is not refunded here — an upgrade mid-period is a product decision,
  // and silently discarding it in a webhook is not the place to make it.
  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data: { status: "cancelled" } });
  }

  await prisma.subscription.create({
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

  return true;
}

/**
 * @route   POST /api/billing/webhook
 * @desc    Cashfree's signed notification. The only thing that grants access.
 * @access  Public — authenticated by signature, not by session
 *
 * Mounted with `express.raw` in index.ts: the signature covers the exact bytes
 * Cashfree sent, so the parsed-and-reserialised body would never match.
 */
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-webhook-signature"] as string | undefined;
  const timestamp = req.headers["x-webhook-timestamp"] as string | undefined;
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? ""));

  if (!verifyWebhook(raw, signature ?? "", timestamp ?? "")) {
    console.warn("[billing] rejected webhook with a bad signature");
    // 401, not 400: this is an authentication failure, and Cashfree retries.
    return res.status(401).json({ error: "invalid signature" });
  }

  let event;
  try {
    event = parseWebhook(JSON.parse(raw.toString("utf8")));
  } catch {
    return res.status(400).json({ error: "unparsable body" });
  }

  // Acknowledge before doing the work: a slow database must not make Cashfree
  // think delivery failed and retry a payment we have already accepted.
  res.json({ received: true });

  try {
    if (event.orderId && event.paymentStatus === "SUCCESS") {
      const granted = await grantAccess(event.orderId, event.paymentId, event);
      console.log(`[billing] webhook ${event.type} order=${event.orderId} granted=${granted}`);
    } else if (event.orderId && event.paymentStatus === "FAILED") {
      await prisma.paymentOrder.updateMany({
        where: { id: event.orderId, status: "created" },
        data: { status: "failed", raw: (event ?? {}) as object },
      });
    }
  } catch (error: any) {
    console.error("[billing] webhook processing failed:", error?.message);
  }
});

/**
 * @route   POST /api/billing/orders/:orderId/verify
 * @desc    Confirm an order when the buyer lands back from checkout
 * @access  Private
 *
 * Exists because the webhook can be slow, or unreachable entirely on localhost
 * where Cashfree cannot call back. It never trusts the redirect: it asks
 * Cashfree what the order's status actually is, and shares `grantAccess` with
 * the webhook so whichever arrives first wins and the second is a no-op.
 */
router.post("/orders/:orderId/verify", requireAuth, async (req: any, res) => {
  try {
    const order = await prisma.paymentOrder.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: "That order belongs to another account" });
    }

    if (order.status === "paid") {
      return res.json({ status: "paid", planId: order.planId, alreadyApplied: true });
    }

    const remote = await fetchOrder(order.id);

    if (remote.status === "PAID") {
      await grantAccess(order.id, null, remote.raw);
      return res.json({ status: "paid", planId: order.planId });
    }

    if (remote.status === "EXPIRED") {
      await prisma.paymentOrder.updateMany({
        where: { id: order.id, status: "created" },
        data: { status: "expired" },
      });
      return res.json({ status: "expired" });
    }

    // ACTIVE means the order exists but has not been paid yet.
    res.json({ status: remote.status.toLowerCase() });
  } catch (error: any) {
    if (error instanceof PaymentsUnavailable) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[billing] verify failed:", error?.message);
    res.status(500).json({ error: "Could not verify that payment" });
  }
});

export default router;

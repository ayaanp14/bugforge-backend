import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  CREDIT_COSTS,
  CREDIT_PACKS,
  CREDITS_PRODUCT,
  PLANS,
  PLAN_OFFERS,
  creditPackFor,
  freeForAll,
  offerFor,
  planFor,
  tierOf,
} from "../lib/plans.js";
import { applyWebhookEvent, grantAccess } from "../services/billing.js";
import { trackServerEvent } from "../lib/telemetry.js";
import { entitlementFor } from "../services/entitlements.js";
import { browserCache } from "../lib/http-cache.js";
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

/**
 * What a checkout body asks for, as the catalogue's own entry — never a
 * price. `{ offerId }` is a plan or a pass, `{ packId }` a credit pack; an
 * older client's `{ planId: "pro", period }` is read as the Pro offer of
 * that period. Anything else is null and refused.
 */
function productOf(body: any): { planId: string; period: string; amount: number; credits: number | null } | null {
  const pack = creditPackFor(body?.packId);
  if (pack) return { planId: CREDITS_PRODUCT, period: pack.id, amount: pack.price, credits: pack.credits };
  const offer = offerFor(body?.offerId ?? (body?.planId === "pro" ? (body?.period === "yearly" ? "pro-yearly" : "pro-monthly") : null));
  if (offer) return { planId: offer.planId, period: offer.id, amount: offer.price, credits: null };
  return null;
}

/* ── catalogue ─────────────────────────────────────────────────────────── */

/**
 * @route   GET /api/billing/plans
 * @desc    The catalogue. Public. The pricing page draws its own generated
 *          copy (frontend content/plans.ts) and reads this only for
 *          `checkoutEnabled` and the free-for-all flag; kept whole for any
 *          other client.
 * @access  Public
 */
router.get("/plans", browserCache(300, { shared: true }), (_req, res) => {
  res.json({
    plans: PLANS,
    offers: PLAN_OFFERS,
    creditPacks: CREDIT_PACKS,
    creditCosts: CREDIT_COSTS,
    currency: "INR",
    /** False when no keys are set: the UI then shows plans without checkout. */
    checkoutEnabled: isConfigured(),
    /** While active, every plan's limits are lifted for everyone (lib/plans). */
    freeForAll: freeForAll(),
  });
});

/**
 * @route   GET /api/billing/me
 * @desc    The caller's plan, every allowance as it stands (used, left, when
 *          the next free one opens), the credit wallet and bonus rounds
 * @access  Private
 */
router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const entitlement = await entitlementFor(req.user.userId, req.user.email);
    res.json({
      planId: entitlement.plan.id,
      planName: entitlement.plan.name,
      entitlements: entitlement.plan.entitlements,
      currentPeriodEnd: entitlement.currentPeriodEnd,
      allowances: entitlement.usage.allowances,
      credits: entitlement.usage.credits,
      /** Bonus rounds from the roadmap's chests, spent only once the interview allowance is. */
      bonusInterviews: entitlement.usage.interviewCredits,
      freeForAll: entitlement.freeForAll,
    });
  } catch (error: any) {
    console.error("[billing] entitlement lookup failed:", error?.message);
    res.status(500).json({ error: "Could not load your plan" });
  }
});

/* ── checkout ──────────────────────────────────────────────────────────── */

/**
 * @route   POST /api/billing/checkout   { offerId } | { packId }
 * @desc    Open a Cashfree order for a plan, a pass or a credit pack and
 *          return its session id
 * @access  Private
 *
 * The price comes from the catalogue, never from the request. A client that
 * posts `{ offerId: "pro-yearly", amount: 1 }` gets charged the catalogue
 * price, because `amount` is not read at all.
 */
router.post("/checkout", requireAuth, async (req: any, res) => {
  try {
    const product = productOf(req.body);
    if (!product) return res.status(400).json({ error: "That cannot be purchased." });

    // Checkout stays open during the free-for-all period (the owner's call,
    // 2026-10-12): nobody needs a plan until it ends, but anyone who wants
    // to pay may, and the plan runs from the payment like any other.
    if (!isConfigured()) {
      return res.status(503).json({ error: "Payments are not configured on this deployment." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: "Account not found" });

    // A lower plan is not sold while a higher one runs: it would tick away
    // underneath unused (grantAccess pauses a lower plan only when a higher
    // one is bought on top of it, not the other way round). The highest live
    // row decides — a Pro paused under a Pro Max ends later than the Max.
    // Credits sit beside any plan.
    if (product.credits === null) {
      const live = await prisma.subscription.findMany({
        where: { userId: user.id, status: "active", currentPeriodEnd: { gt: new Date() } },
        select: { planId: true, currentPeriodEnd: true },
        take: 10,
      });
      const running = [...live].sort((a, b) => tierOf(b.planId) - tierOf(a.planId))[0];
      if (running && tierOf(product.planId) < tierOf(running.planId)) {
        return res.status(409).json({
          error: `You are on ${planFor(running.planId).name} until ${running.currentPeriodEnd.toDateString()}. ${planFor(product.planId).name} can be bought once it ends.`,
          currentPlanId: running.planId,
          currentPeriodEnd: running.currentPeriodEnd,
        });
      }
    }

    // Our id, not the gateway's: the row exists before the gateway is told
    // anything, so a webhook for an unknown order is rejected rather than
    // creating a subscription out of thin air.
    const orderId = `ck_${crypto.randomBytes(12).toString("hex")}`;

    await prisma.paymentOrder.create({
      data: {
        id: orderId,
        userId: user.id,
        planId: product.planId,
        period: product.period,
        amount: product.amount,
        currency: "INR",
        status: "created",
      },
    });

    const created = await createOrder({
      orderId,
      amount: product.amount,
      currency: "INR",
      customer: { id: user.id, name: user.name, email: user.email, phone: null },
      returnUrl: `${FRONTEND_URL}/pricing?order=${orderId}`,
    });

    await prisma.paymentOrder.update({
      where: { id: orderId },
      data: { paymentSessionId: created.paymentSessionId },
    });

    trackServerEvent("checkout_order_created", { planId: product.planId, period: product.period, amount: product.amount }, user.id);

    res.json({
      orderId,
      paymentSessionId: created.paymentSessionId,
      // The browser SDK needs to know which Cashfree environment to open.
      mode: process.env["CASHFREE_ENV"] === "production" ? "production" : "sandbox",
      amount: product.amount,
      period: product.period,
      planId: product.planId,
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
// grantAccess and applyWebhookEvent live in services/billing.ts so the money
// path is testable without a database; this file only verifies and parses.

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
    const outcome = await applyWebhookEvent(prisma, event);
    console.log(`[billing] webhook ${event.type} order=${event.orderId} → ${outcome}`);
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
      const granted = await grantAccess(prisma, order.id, null, remote.raw);
      if (granted) return res.json({ status: "paid", planId: order.planId });
      // The gateway says paid but nothing here would take the claim: the row
      // is in a state grantAccess does not own (a concurrent webhook won the
      // race, or an operator marked it). Re-read rather than guess — telling
      // the buyer "your plan is active" on the redirect alone was the bug.
      const after = await prisma.paymentOrder.findUnique({ where: { id: order.id }, select: { status: true } });
      if (after?.status === "paid") {
        return res.json({ status: "paid", planId: order.planId, alreadyApplied: true });
      }
      console.error(`[billing] verify: gateway PAID but order ${order.id} is "${after?.status}" and was not granted`);
      return res.status(409).json({
        status: "unresolved",
        error: "The payment went through but could not be applied yet. Please contact support with your order id.",
        orderId: order.id,
      });
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

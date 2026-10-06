/**
 * Web Push subscriptions (lib/push.ts): the key a browser subscribes with,
 * and the switch on the profile, which adds or removes this browser's row.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { isPushEndpoint, pushPublicKey } from "../lib/push.js";

const router = Router();

// GET /api/push/key — { publicKey }, null when push is not configured (the profile then shows no switch).
router.get("/key", (_req, res) => {
  res.json({ publicKey: pushPublicKey() });
});

interface SubscriptionBody {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

/** base64url, the encoding PushSubscription.toJSON() gives its keys in. */
const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * POST /api/push/subscriptions — PushSubscription.toJSON() from this browser.
 * Upserted by endpoint: the same browser subscribing again (or for another
 * account after a sign-out and a sign-in) gets one row, owned by the last.
 */
router.post("/subscriptions", requireAuth, async (req, res) => {
  if (!pushPublicKey()) {
    res.status(503).json({ error: "Notifications are not available right now." });
    return;
  }
  const body = (req.body ?? {}) as SubscriptionBody;
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";
  if (endpoint.length > 700 || !isPushEndpoint(endpoint) || !B64URL.test(p256dh) || p256dh.length > 200 || !B64URL.test(auth) || auth.length > 64) {
    res.status(400).json({ error: "That is not a browser push subscription." });
    return;
  }
  const userId = req.user!.userId;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });
  res.status(204).end();
});

// DELETE /api/push/subscriptions { endpoint } — this browser off; only the caller's own row.
router.delete("/subscriptions", requireAuth, async (req, res) => {
  const endpoint = typeof (req.body as SubscriptionBody | undefined)?.endpoint === "string" ? String((req.body as SubscriptionBody).endpoint) : "";
  if (!endpoint) {
    res.status(400).json({ error: "Which subscription?" });
    return;
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user!.userId } });
  res.status(204).end();
});

export default router;

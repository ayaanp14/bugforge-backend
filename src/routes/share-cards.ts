import express, { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { shareCardLimiter } from "../middleware/rate-limit.js";
import { MAX_CARD_BYTES, ShareCardError, createShareCard, getShareCard, getShareImage } from "../services/share-cards.js";

/**
 * /api/share-cards — the shareable pictures of wins (models ShareCard).
 *
 *   POST /                 the picture as the raw body (image/jpeg), the win in
 *                          the query; verified, stored, answered with its id.
 *   GET  /:id              the card's facts and author, for /share/<id>.
 *
 * The picture itself (GET /:id/image.jpg) is `shareImage` below, mounted in
 * index.ts ahead of the rate limiter and outside the platform guard: link
 * crawlers (LinkedIn, WhatsApp, X, Slack) fetch it unsigned, a few addresses
 * at a time.
 */
const router = Router();

const ID = /^[a-z0-9]{10,40}$/;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

const rawBody = express.raw({ type: () => true, limit: MAX_CARD_BYTES + 1024 });
function readUpload(req: Request, res: Response, next: NextFunction): void {
  rawBody(req, res, (err?: unknown) => {
    if (err) {
      const status = (err as { status?: number }).status === 413 ? 413 : 400;
      res.status(status).json({ error: status === 413 ? "That picture is too large." : "The picture could not be read." });
      return;
    }
    next();
  });
}

router.post("/", requireAuth, shareCardLimiter, readUpload, async (req, res) => {
  const body = req.body as unknown;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    res.status(400).json({ error: "Send the picture as the request body." });
    return;
  }
  const q = req.query;
  const meta = { kind: str(q["kind"]), slug: str(q["slug"]), challengeId: str(q["challengeId"]), tier: str(q["tier"]), xp: str(q["xp"]) };
  try {
    const card = await createShareCard(req.user!.userId, meta, new Uint8Array(body));
    res.status(201).json({ id: card.id });
  } catch (err) {
    if (err instanceof ShareCardError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.get("/:id", async (req, res) => {
  const id = String(req.params["id"] ?? "");
  const card = ID.test(id) ? await getShareCard(id) : null;
  if (!card) {
    res.status(404).json({ error: "That share has gone" });
    return;
  }
  // The same for everyone and never edited.
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ card: { ...card, author: card.user, user: undefined } });
});

/**
 * GET /api/share-cards/:id/image.jpg — unsigned, for the crawlers. A card
 * never changes once written, so it is cached for a year everywhere. The
 * API's blanket `X-Robots-Tag: noindex` is lifted for it: this is the one
 * response meant to be picked up and shown on other sites.
 */
export async function shareImage(req: Request, res: Response): Promise<void> {
  const id = String(req.params["id"] ?? "");
  const bytes = ID.test(id) ? await getShareImage(id) : null;
  if (!bytes) {
    res.status(404).type("text/plain").send("No such picture");
    return;
  }
  res.removeHeader("X-Robots-Tag");
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Content-Length", String(bytes.length));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  // Other sites draw it; the API's cross-origin policy must not stop them.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.end(Buffer.from(bytes));
}

export default router;

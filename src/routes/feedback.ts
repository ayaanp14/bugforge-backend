import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { adminOnly, requireAuth } from "../middleware/auth.js";
import { parseFeedback, platformPromptDue } from "../services/feedback.js";

/**
 * Ratings and feedback.
 *
 * Two kinds share one table: "platform" — the periodic "how is CodeKairo
 * treating you?" prompt — and "interview", asked on every interview report.
 * The client decides *when* within a visit to ask; /status decides *whether*
 * this account should be asked at all (see services/feedback).
 */
const router = Router();

/**
 * GET /api/feedback/status?sessionId=
 *
 * Whether the platform prompt is due for this account, and — when a session
 * id is given — whether that interview has been rated already, along with its
 * mode so the dialog can ask the right questions.
 */
router.get("/status", requireAuth, async (req: any, res) => {
  try {
    const userId: string = req.user.userId;
    const sessionId = typeof req.query.sessionId === "string" && req.query.sessionId.trim() ? req.query.sessionId.trim() : null;

    const [user, lastPlatform, session, sessionFeedback] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
      prisma.feedback.findFirst({
        where: { userId, kind: "platform" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      sessionId
        ? prisma.mockInterviewSession.findFirst({ where: { id: sessionId, userId }, select: { mode: true, status: true } })
        : Promise.resolve(null),
      sessionId
        ? prisma.feedback.findFirst({ where: { userId, kind: "interview", sessionId }, select: { rating: true } })
        : Promise.resolve(null),
    ]);

    res.json({
      platformDue: platformPromptDue({
        accountCreatedAt: user?.createdAt ?? new Date(),
        lastPlatformAt: lastPlatform?.createdAt ?? null,
      }),
      lastPlatformAt: lastPlatform?.createdAt ?? null,
      session: session
        ? { mode: session.mode, status: session.status, rated: Boolean(sessionFeedback), rating: sessionFeedback?.rating ?? null }
        : null,
    });
  } catch (error: any) {
    console.error("Feedback status error:", error?.message);
    res.status(500).json({ error: "Could not load feedback status" });
  }
});

/**
 * POST /api/feedback
 *
 * Body: { kind, rating, comment?, tags?, sessionId?, path? }. An interview may
 * be rated once; sending again updates the earlier rating rather than adding a
 * second row, so a re-opened report cannot double-count.
 */
router.post("/", requireAuth, async (req: any, res) => {
  try {
    const userId: string = req.user.userId;
    const parsed = parseFeedback(req.body);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const input = parsed.value;

    if (input.kind === "interview") {
      const session = await prisma.mockInterviewSession.findFirst({
        where: { id: input.sessionId as string, userId },
        select: { id: true },
      });
      if (!session) return res.status(404).json({ error: "That interview was not found on this account" });

      const existing = await prisma.feedback.findFirst({
        where: { userId, kind: "interview", sessionId: session.id },
        select: { id: true },
      });
      const data = { rating: input.rating, comment: input.comment, tags: input.tags, path: input.path };
      const feedback = existing
        ? await prisma.feedback.update({ where: { id: existing.id }, data })
        : await prisma.feedback.create({ data: { ...data, userId, kind: "interview", sessionId: session.id } });
      return res.status(existing ? 200 : 201).json({ feedback });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        kind: "platform",
        rating: input.rating,
        comment: input.comment,
        tags: input.tags,
        path: input.path,
      },
    });
    return res.status(201).json({ feedback });
  } catch (error: any) {
    console.error("Feedback save error:", error?.message);
    return res.status(500).json({ error: "Could not save your feedback" });
  }
});

/**
 * GET /api/feedback?kind=&take=
 *
 * The creator's view: newest first with who said it, plus an average per kind.
 */
router.get("/", requireAuth, adminOnly, async (req: any, res) => {
  try {
    const kind = req.query.kind === "platform" || req.query.kind === "interview" ? (req.query.kind as string) : null;
    const take = Math.min(200, Math.max(1, Number(req.query.take) || 100));

    const [feedback, summary] = await Promise.all([
      prisma.feedback.findMany({
        where: kind ? { kind } : {},
        orderBy: { createdAt: "desc" },
        take,
        include: { user: { select: { username: true, name: true, email: true } } },
      }),
      prisma.feedback.groupBy({ by: ["kind"], _avg: { rating: true }, _count: { _all: true } }),
    ]);

    res.json({
      feedback,
      summary: summary.map((row) => ({ kind: row.kind, count: row._count._all, averageRating: row._avg.rating })),
    });
  } catch (error: any) {
    console.error("Feedback list error:", error?.message);
    res.status(500).json({ error: "Could not list feedback" });
  }
});

export default router;

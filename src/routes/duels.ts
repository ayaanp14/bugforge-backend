/**
 * Kumite — duels. Two warriors (or two pairs) get the same random problem and
 * the first accepted submission takes it.
 *
 * Matchmaking has no queue table: a duel row sitting at status "waiting" with a
 * free seat *is* the queue. Joining one is a single transaction, and the band it
 * was created with widens as it waits so nobody sits there forever.
 */
import { Router } from "express";
import crypto from "crypto";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { duelRoom, emitToRoom } from "../lib/realtime.js";
import { DUEL_INCLUDE, applyDuelResult, loadDuel, reconcileDuel } from "../lib/duels.js";

const router = Router();

/** Seats per mode — 2v2 fills teams 1,1,2,2 in join order. */
const capacityOf = (mode: string) => (mode === "2v2" ? 4 : 2);

type DuelWithParticipants = {
  id: string;
  mode: string;
  kind: string;
  status: string;
  visibility: string;
  ratingBand: number;
  startedAt: Date | null;
  participants: { userId: string; team: number }[];
};

/** Which side to put the next arrival on: the emptier one, ties go to team 1. */
function nextTeam(participants: { team: number }[], mode: string): number {
  if (mode !== "2v2") return participants.some((p) => p.team === 1) ? 2 : 1;
  const one = participants.filter((p) => p.team === 1).length;
  const two = participants.filter((p) => p.team === 2).length;
  return one <= two ? 1 : 2;
}

/**
 * A waiting duel accepts anyone within its band, and the band widens by 100
 * rating every 10 seconds it goes unmatched — a fair fight first, *a* fight
 * shortly after.
 */
function withinBand(duel: { ratingBand: number; createdAt: Date }, rating: number): boolean {
  const waitedSeconds = Math.max(0, (Date.now() - duel.createdAt.getTime()) / 1000);
  const tolerance = 200 + Math.floor(waitedSeconds / 10) * 100;
  return Math.abs(duel.ratingBand - rating) <= tolerance;
}

/** Pick the arena: a random published problem, or a random published hunt. */
async function pickTarget(kind: string): Promise<{ problemId?: string; challengeId?: string } | null> {
  if (kind === "bug") {
    const total = await prisma.bugChallenge.count({ where: { isPublished: true } });
    if (total === 0) return null;
    const [challenge] = await prisma.bugChallenge.findMany({
      where: { isPublished: true },
      skip: Math.floor(Math.random() * total),
      take: 1,
      select: { id: true },
    });
    return challenge ? { challengeId: challenge.id } : null;
  }
  // Problems need visible test cases to be solvable in a duel.
  const total = await prisma.problem.count({ where: { isPublished: true } });
  if (total === 0) return null;
  const [problem] = await prisma.problem.findMany({
    where: { isPublished: true },
    skip: Math.floor(Math.random() * total),
    take: 1,
    select: { id: true },
  });
  return problem ? { problemId: problem.id } : null;
}

/** Fill the arena and start the clock once every seat is taken. */
async function startIfFull(duel: DuelWithParticipants) {
  if (duel.status !== "waiting") return null;
  if (duel.participants.length < capacityOf(duel.mode)) return null;

  const target = await pickTarget(duel.kind);
  if (!target) return null;

  await prisma.duel.update({
    where: { id: duel.id },
    data: { ...target, status: "active", startedAt: new Date() },
  });
  const started = await loadDuel(duel.id);
  emitToRoom(duelRoom(duel.id), "duel-started", started);
  return started;
}

// POST /api/duels/queue — find a fair opponent, or wait as one
router.post("/queue", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const mode = (req.body as { mode?: string }).mode === "2v2" ? "2v2" : "1v1";
    const kind = (req.body as { kind?: string }).kind === "bug" ? "bug" : "problem";

    // Already in something live? Hand it back rather than double-queueing —
    // unless it turns out to be already decided, in which case it stops
    // standing between this warrior and the next fight.
    const existing = await prisma.duel.findFirst({
      where: { status: { in: ["waiting", "active"] }, participants: { some: { userId } } },
      include: DUEL_INCLUDE,
    });
    if (existing) {
      const settled = await reconcileDuel(existing);
      if (settled && settled.status !== "finished") {
        res.json(settled);
        return;
      }
    }

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { rating: true } });
    const rating = me?.rating ?? 1200;

    const open = await prisma.duel.findMany({
      where: { status: "waiting", visibility: "public", mode, kind, NOT: { participants: { some: { userId } } } },
      include: { participants: { select: { userId: true, team: true } } },
      orderBy: { createdAt: "asc" },
      take: 25,
    });

    const match = open.find(
      (d) => d.participants.length < capacityOf(d.mode) && withinBand(d, rating),
    );

    if (match) {
      await prisma.duelParticipant.create({
        data: { duelId: match.id, userId, team: nextTeam(match.participants, match.mode) },
      });
      // Keep the band honest as the seats fill.
      const seated = await prisma.duelParticipant.findMany({
        where: { duelId: match.id },
        select: { user: { select: { rating: true } } },
      });
      const band = Math.round(seated.reduce((n, p) => n + (p.user.rating ?? 1200), 0) / seated.length);
      await prisma.duel.update({ where: { id: match.id }, data: { ratingBand: band } });

      const joined = await loadDuel(match.id);
      emitToRoom(duelRoom(match.id), "duel-update", joined);
      const started = await startIfFull(joined as unknown as DuelWithParticipants);
      res.json(started ?? joined);
      return;
    }

    const created = await prisma.duel.create({
      data: {
        mode,
        kind,
        visibility: "public",
        createdBy: userId,
        ratingBand: rating,
        participants: { create: { userId, team: 1 } },
      },
      include: DUEL_INCLUDE,
    });
    res.json(created);
  } catch (err) {
    console.error("POST /api/duels/queue error:", err);
    res.status(500).json({ error: "Could not join the queue" });
  }
});

// DELETE /api/duels/queue — stop searching (only while still waiting)
router.delete("/queue", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const waiting = await prisma.duel.findFirst({
      where: { status: "waiting", participants: { some: { userId } } },
      include: { participants: { select: { id: true, userId: true } } },
    });
    if (!waiting) {
      res.json({ left: false });
      return;
    }
    await prisma.duelParticipant.deleteMany({ where: { duelId: waiting.id, userId } });
    // An empty room is litter; a room with people left in it stays open.
    if (waiting.participants.length <= 1) {
      await prisma.duel.delete({ where: { id: waiting.id } });
    } else {
      const rest = await loadDuel(waiting.id);
      emitToRoom(duelRoom(waiting.id), "duel-update", rest);
    }
    res.json({ left: true });
  } catch (err) {
    console.error("DELETE /api/duels/queue error:", err);
    res.status(500).json({ error: "Could not leave the queue" });
  }
});

// POST /api/duels/rooms — a private duel with an invite code
router.post("/rooms", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const mode = (req.body as { mode?: string }).mode === "2v2" ? "2v2" : "1v1";
    const kind = (req.body as { kind?: string }).kind === "bug" ? "bug" : "problem";

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { rating: true } });
    // Six characters, no vowels: short to type, and it cannot spell anything.
    const roomCode = Array.from(crypto.randomBytes(6))
      .map((b) => "BCDFGHJKLMNPQRSTVWXZ23456789"[b % 28])
      .join("");

    const duel = await prisma.duel.create({
      data: {
        mode,
        kind,
        visibility: "private",
        roomCode,
        createdBy: userId,
        ratingBand: me?.rating ?? 1200,
        participants: { create: { userId, team: 1 } },
      },
      include: DUEL_INCLUDE,
    });
    res.json(duel);
  } catch (err) {
    console.error("POST /api/duels/rooms error:", err);
    res.status(500).json({ error: "Could not open the room" });
  }
});

// POST /api/duels/rooms/join — walk into a private room with its code
router.post("/rooms/join", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const code = String((req.body as { code?: string }).code ?? "").trim().toUpperCase();
    if (!code) {
      res.status(400).json({ error: "Enter a room code" });
      return;
    }
    const duel = await prisma.duel.findUnique({
      where: { roomCode: code },
      include: { participants: { select: { userId: true, team: true } } },
    });
    if (!duel) {
      res.status(404).json({ error: "No room with that code" });
      return;
    }
    if (duel.status !== "waiting") {
      res.status(400).json({ error: "That duel has already started" });
      return;
    }
    const already = duel.participants.some((p) => p.userId === userId);
    if (!already) {
      if (duel.participants.length >= capacityOf(duel.mode)) {
        res.status(400).json({ error: "That room is full" });
        return;
      }
      await prisma.duelParticipant.create({
        data: { duelId: duel.id, userId, team: nextTeam(duel.participants, duel.mode) },
      });
    }
    const joined = await loadDuel(duel.id);
    emitToRoom(duelRoom(duel.id), "duel-update", joined);
    res.json(joined);
  } catch (err) {
    console.error("POST /api/duels/rooms/join error:", err);
    res.status(500).json({ error: "Could not join that room" });
  }
});

// POST /api/duels/:id/ready — private rooms start when everyone is ready
router.post("/:id/ready", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const ready = (req.body as { ready?: boolean }).ready !== false;

    const updated = await prisma.duelParticipant.updateMany({
      where: { duelId: id, userId },
      data: { ready },
    });
    if (updated.count === 0) {
      res.status(404).json({ error: "You're not in that duel" });
      return;
    }

    const duel = await loadDuel(id);
    if (!duel) {
      res.status(404).json({ error: "Duel not found" });
      return;
    }
    emitToRoom(duelRoom(id), "duel-update", duel);

    const full = duel.participants.length >= capacityOf(duel.mode);
    const allReady = duel.participants.every((p) => p.ready);
    if (duel.status === "waiting" && full && allReady) {
      const started = await startIfFull(duel as unknown as DuelWithParticipants);
      res.json(started ?? duel);
      return;
    }
    res.json(duel);
  } catch (err) {
    console.error("POST /api/duels/:id/ready error:", err);
    res.status(500).json({ error: "Could not update your readiness" });
  }
});

// GET /api/duels/:id — the whole duel, for the room screen
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const duel = await reconcileDuel(await loadDuel(String(req.params.id)));
    if (!duel) {
      res.status(404).json({ error: "Duel not found" });
      return;
    }
    res.json(duel);
  } catch (err) {
    console.error("GET /api/duels/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/duels/:id/solution — the code that took the duel.
 *
 * Losing should teach you something, so once a duel is over its participants
 * can read the winning submission: the accepted code for a kata, or the files
 * the winner actually changed for a hunt. Only participants, only after the
 * final bell.
 */
router.get("/:id/solution", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const duel = await loadDuel(id);
    if (!duel) {
      res.status(404).json({ error: "Duel not found" });
      return;
    }
    if (!duel.participants.some((p) => p.userId === userId)) {
      res.status(403).json({ error: "You're not in that duel" });
      return;
    }
    if (duel.status !== "finished" || !duel.startedAt) {
      res.status(400).json({ error: "That duel is still running" });
      return;
    }

    // Whoever actually landed the fix — not merely the winning side, since a
    // duel can also end on a forfeit, where there is nothing to show.
    const solver = duel.participants.find(
      (p) => p.verdict?.toUpperCase() === "ACCEPTED" && p.team === duel.winnerTeam,
    );
    if (!solver) {
      res.status(404).json({ error: "This duel ended without a winning submission" });
      return;
    }

    const author = {
      id: solver.user.id,
      name: solver.user.name,
      username: solver.user.username,
      avatar_url: solver.user.avatar_url,
    };

    if (duel.kind === "bug" && duel.challengeId) {
      const row = await prisma.bugSubmission.findFirst({
        where: {
          userId: solver.userId,
          challengeId: duel.challengeId,
          submittedAt: { gte: duel.startedAt },
          verdict: "ACCEPTED",
        },
        orderBy: { submittedAt: "asc" },
        select: { editedFiles: true, passedTests: true, totalTests: true, timeTakenSecs: true },
      });
      if (!row) {
        res.status(404).json({ error: "This duel ended without a winning submission" });
        return;
      }
      const edited = (row.editedFiles ?? {}) as Record<string, string>;
      res.json({
        kind: "bug",
        author,
        language: duel.challenge?.language ?? "javascript",
        passed: row.passedTests,
        total: row.totalTests,
        timeTakenSecs: row.timeTakenSecs,
        files: Object.entries(edited).map(([filePath, content]) => ({ filePath, content: String(content) })),
      });
      return;
    }

    if (duel.problemId) {
      const row = await prisma.submission.findFirst({
        where: {
          userId: solver.userId,
          problemId: duel.problemId,
          submittedAt: { gte: duel.startedAt },
          verdict: "ACCEPTED",
        },
        orderBy: { submittedAt: "asc" },
        select: { code: true, language: true, passedCases: true, totalCases: true, runtimeMs: true },
      });
      if (!row) {
        res.status(404).json({ error: "This duel ended without a winning submission" });
        return;
      }
      res.json({
        kind: "problem",
        author,
        language: row.language,
        passed: row.passedCases,
        total: row.totalCases,
        runtimeMs: row.runtimeMs,
        code: row.code,
      });
      return;
    }

    res.status(404).json({ error: "This duel ended without a winning submission" });
  } catch (err) {
    console.error("GET /api/duels/:id/solution error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/duels/:id/report — "I just submitted."
 *
 * The judges settle duels themselves the moment they write a verdict, so this
 * is the safety net: it re-reads the newest submission row for the duel's
 * target and applies it. The client never sends a verdict, so a win cannot be
 * claimed by posting a hopeful payload.
 */
router.post("/:id/report", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);

    const duel = await loadDuel(id);
    if (!duel) {
      res.status(404).json({ error: "Duel not found" });
      return;
    }
    const me = duel.participants.find((p) => p.userId === userId);
    if (!me) {
      res.status(403).json({ error: "You're not in that duel" });
      return;
    }
    if (duel.status !== "active" || !duel.startedAt) {
      res.json(duel);
      return;
    }

    let passed = 0;
    let total = 0;
    let verdict: string | null = null;

    if (duel.kind === "bug" && duel.challengeId) {
      const latest = await prisma.bugSubmission.findFirst({
        where: { userId, challengeId: duel.challengeId, submittedAt: { gte: duel.startedAt } },
        orderBy: { submittedAt: "desc" },
        select: { verdict: true, passedTests: true, totalTests: true },
      });
      if (latest) {
        verdict = latest.verdict;
        passed = latest.passedTests;
        total = latest.totalTests;
      }
    } else if (duel.problemId) {
      const latest = await prisma.submission.findFirst({
        where: { userId, problemId: duel.problemId, submittedAt: { gte: duel.startedAt } },
        orderBy: { submittedAt: "desc" },
        select: { verdict: true, passedCases: true, totalCases: true },
      });
      if (latest) {
        verdict = latest.verdict;
        passed = latest.passedCases;
        total = latest.totalCases;
      }
    }

    if (!verdict) {
      res.json(duel);
      return;
    }

    const settled = await applyDuelResult(id, userId, { verdict, passed, total });
    res.json(settled ?? duel);
  } catch (err) {
    console.error("POST /api/duels/:id/report error:", err);
    res.status(500).json({ error: "Could not report that submission" });
  }
});

/**
 * POST /api/duels/:id/forfeit — walk away; the other side takes it.
 *
 * `reason: "cheat"` is the room reporting its own player out after three
 * clipboard attempts: the duel ends the same way, but the record says
 * DISQUALIFIED rather than FORFEIT so the result screen can say why.
 */
router.post("/:id/forfeit", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const disqualified = (req.body as { reason?: string } | undefined)?.reason === "cheat";
    const duel = await loadDuel(id);
    if (!duel) {
      res.status(404).json({ error: "Duel not found" });
      return;
    }
    const me = duel.participants.find((p) => p.userId === userId);
    if (!me) {
      res.status(403).json({ error: "You're not in that duel" });
      return;
    }

    if (duel.status === "waiting") {
      await prisma.duelParticipant.deleteMany({ where: { duelId: id, userId } });
      if (duel.participants.length <= 1) await prisma.duel.delete({ where: { id } });
      res.json({ left: true });
      return;
    }

    if (duel.status === "active") {
      const opponentTeam = duel.participants.find((p) => p.team !== me.team)?.team ?? null;
      await prisma.duelParticipant.update({
        where: { id: me.id },
        data: { verdict: disqualified ? "DISQUALIFIED" : "FORFEIT", finishedAt: new Date() },
      });
      await prisma.duel.update({
        where: { id },
        data: { status: "finished", endedAt: new Date(), winnerTeam: opponentTeam },
      });
      const finished = await loadDuel(id);
      emitToRoom(duelRoom(id), "duel-finished", finished);
      res.json(finished);
      return;
    }

    res.json(duel);
  } catch (err) {
    console.error("POST /api/duels/:id/forfeit error:", err);
    res.status(500).json({ error: "Could not forfeit" });
  }
});

// GET /api/duels/me/state — what I'm in, my record, and my last duels
router.get("/me/state", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [liveRaw, history] = await Promise.all([
      prisma.duel.findFirst({
        where: { status: { in: ["waiting", "active"] }, participants: { some: { userId } } },
        include: DUEL_INCLUDE,
      }),
      prisma.duel.findMany({
        where: { status: "finished", participants: { some: { userId } } },
        include: DUEL_INCLUDE,
        orderBy: { endedAt: "desc" },
        take: 10,
      }),
    ]);

    // A duel that was won without anybody reporting it is finished, not live —
    // and it belongs at the top of the record rather than nowhere at all.
    const settled = await reconcileDuel(liveRaw);
    const justFinished = settled && settled.status === "finished" ? settled : null;
    const live = justFinished ? null : settled;
    if (justFinished && !history.some((d) => d.id === justFinished.id)) history.unshift(justFinished);

    let wins = 0;
    let losses = 0;
    for (const duel of history) {
      const mine = duel.participants.find((p) => p.userId === userId);
      if (!mine || duel.winnerTeam == null) continue;
      if (mine.team === duel.winnerTeam) wins += 1;
      else losses += 1;
    }

    res.json({ live, history, record: { wins, losses } });
  } catch (err) {
    console.error("GET /api/duels/me/state error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

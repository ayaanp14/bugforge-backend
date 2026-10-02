/**
 * Battles 1v1 knockouts: check-in, the bracket, the matches, the champion.
 * The rules — seeding, byes, where a winner goes, how a timed-out match is
 * decided — are pure and live in knockout-rules.ts; this file loads rows,
 * applies them and writes, every write guarded so two requests racing (two
 * accepted solutions in the same second, two readers settling the same
 * expired match) decide a match once.
 *
 * Nothing runs on a timer. The bracket is drawn, and expired matches are
 * settled, by `advanceKnockout`, which every read of a knockout calls — the
 * players' rooms and the bracket page poll every few seconds, so a match
 * whose clock ran out is decided within a poll of it. Attempts are ordinary
 * /api/submit calls (routes/execution.ts): the solve credits the player's
 * main profile as usual, and `recordKnockoutSubmission` is the one extra
 * step that feeds the match.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { isAdminEmail } from "../middleware/auth.js";
import { BattlesError } from "./battles-error.js";
import { codeHiddenReason, codeIsPublic, inMatchWindow, isStaff, mayRead, mayReadCode, type ViewerRole } from "./battles-view-rules.js";
import { VIEWED_TOURNAMENT_SELECT, managesOrg, roleOf, viewedTournament, type BattlesViewer } from "./battles-viewer.js";
import { VERDICTS } from "./contest.js";
import { isDuplicateKey } from "../lib/seat-claim.js";
import {
  CHECK_IN_MINUTES,
  MATCH_BREAK_SECONDS,
  bracketSize,
  firstRound,
  nextSlot,
  problemForRound,
  rosterStanding,
  roundName,
  roundsFor,
  timeoutWinner,
  type RosterStanding,
} from "./knockout-rules.js";

type Tx = Prisma.TransactionClient;

/** How often one tournament's bracket may be advanced by reads; every poll does not need its own settle. */
const ADVANCE_EVERY_MS = 2_000;
const lastAdvance = new Map<string, number>();

const PLAYER_SELECT = { id: true, username: true, name: true, avatar_url: true } as const;
const playerOut = (u: { id: string; username: string | null; name: string | null; avatar_url: string | null } | null) =>
  u ? { id: u.id, name: u.username || u.name || "Player", avatar: u.avatar_url } : null;

// ── Advancing the bracket ─────────────────────────────────────────────

/**
 * Draw the bracket if the start has passed, and decide every match whose
 * clock ran out. Cheap when there is nothing to do; throttled per tournament.
 */
export async function advanceKnockout(tournamentId: string, force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - (lastAdvance.get(tournamentId) ?? 0) < ADVANCE_EVERY_MS) return;
  lastAdvance.set(tournamentId, now);
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, format: true, status: true, startsAt: true, bracketAt: true, finishedAt: true, durationMinutes: true },
  });
  if (!t || t.format !== "knockout" || t.status !== "published" || t.finishedAt) return;
  if (!t.bracketAt) {
    if (t.startsAt.getTime() > now) return;
    await drawBracket(t.id, t.durationMinutes);
  }
  const expired = await prisma.tournamentMatch.findMany({
    where: { tournamentId, status: "live", endsAt: { lte: new Date() } },
    select: { id: true, seedA: true, seedB: true, aPassed: true, bPassed: true, aBestAt: true, bBestAt: true },
  });
  for (const m of expired) {
    const side = timeoutWinner({ seed: m.seedA ?? 999, passed: m.aPassed, bestAt: m.aBestAt }, { seed: m.seedB ?? 999, passed: m.bPassed, bestAt: m.bBestAt });
    await decide(m.id, side, "timeout");
  }
}

/**
 * Seed the checked-in players by rating and create every match of every
 * round in one transaction, claimed by setting `bracketAt` first so only one
 * request ever draws it. Round one starts now; byes go straight through.
 */
async function drawBracket(tournamentId: string, durationMinutes: number) {
  await prisma.$transaction(async (tx) => {
    const now = new Date();
    const { count } = await tx.tournament.updateMany({ where: { id: tournamentId, bracketAt: null }, data: { bracketAt: now } });
    if (count === 0) return;

    const entries = await tx.tournamentEntry.findMany({
      where: { tournamentId, status: "approved", checkedInAt: { not: null } },
      select: { id: true, userId: true, createdAt: true, user: { select: { rating: true } } },
    });
    entries.sort((a, b) => b.user.rating - a.user.rating || a.createdAt.getTime() - b.createdAt.getTime());
    if (entries.length < 2) {
      // Nobody to play: the tournament ends where it stands (a lone
      // checked-in player takes it).
      await tx.tournament.update({ where: { id: tournamentId }, data: { finishedAt: now, championId: entries[0]?.userId ?? null } });
      return;
    }
    for (const [i, e] of entries.entries()) await tx.tournamentEntry.update({ where: { id: e.id }, data: { seed: i + 1 } });

    const problems = await tx.tournamentProblem.findMany({ where: { tournamentId }, orderBy: { position: "asc" }, select: { problemId: true } });
    const size = bracketSize(entries.length);
    const rounds = roundsFor(size);
    const endsAt = new Date(now.getTime() + durationMinutes * 60_000);
    const rows: Prisma.TournamentMatchCreateManyInput[] = [];
    for (const m of firstRound(entries.map((e) => e.userId))) {
      const both = m.a && m.b;
      const lone = m.a ?? m.b;
      rows.push({
        tournamentId,
        round: 1,
        position: m.position,
        playerAId: m.a?.player ?? null,
        seedA: m.a?.seed ?? null,
        playerBId: m.b?.player ?? null,
        seedB: m.b?.seed ?? null,
        problemId: problemForRound(problems, 1)?.problemId ?? null,
        status: both ? "live" : "done",
        startedAt: both ? now : null,
        endsAt: both ? endsAt : null,
        winnerId: both ? null : lone!.player,
        decidedBy: both ? null : "bye",
        decidedAt: both ? null : now,
      });
    }
    for (let r = 2; r <= rounds; r++) {
      for (let p = 0; p < size / 2 ** r; p++) {
        rows.push({ tournamentId, round: r, position: p, problemId: problemForRound(problems, r)?.problemId ?? null });
      }
    }
    await tx.tournamentMatch.createMany({ data: rows });

    // Byes advance at once.
    const byes = rows.filter((r) => r.decidedBy === "bye");
    for (const b of byes) {
      const seed = b.playerAId ? b.seedA! : b.seedB!;
      await placeWinner(tx, tournamentId, 1, b.position, rounds, b.winnerId!, seed, durationMinutes, now);
    }
  });
}

/** Write a winner into the next round; start that match when both players are in; end the tournament after the final. */
async function placeWinner(tx: Tx, tournamentId: string, round: number, position: number, rounds: number, winnerId: string, seed: number, durationMinutes: number, now: Date) {
  const next = nextSlot(round, position, rounds);
  if (!next) {
    await tx.tournament.update({ where: { id: tournamentId }, data: { finishedAt: now, championId: winnerId } });
    return;
  }
  const where = { tournamentId_round_position: { tournamentId, round: next.round, position: next.position } };
  await tx.tournamentMatch.update({ where, data: next.side === "a" ? { playerAId: winnerId, seedA: seed } : { playerBId: winnerId, seedB: seed } });
  // Guarded: when two feeders finish together, only one of them starts it.
  const startsAt = new Date(now.getTime() + MATCH_BREAK_SECONDS * 1000);
  await tx.tournamentMatch.updateMany({
    where: { tournamentId, round: next.round, position: next.position, status: "waiting", playerAId: { not: null }, playerBId: { not: null } },
    data: { status: "live", startedAt: startsAt, endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000) },
  });
}

/** Decide a live match for one side, once, and carry the winner on. */
async function decide(matchId: string, side: "a" | "b", decidedBy: "solve" | "timeout"): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const m = await tx.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, tournamentId: true, round: true, position: true, playerAId: true, playerBId: true, seedA: true, seedB: true, tournament: { select: { durationMinutes: true } } },
    });
    if (!m) return false;
    const winnerId = side === "a" ? m.playerAId : m.playerBId;
    if (!winnerId) return false;
    const now = new Date();
    const { count } = await tx.tournamentMatch.updateMany({ where: { id: m.id, status: "live", winnerId: null }, data: { status: "done", winnerId, decidedBy, decidedAt: now } });
    if (count === 0) return false;
    const agg = await tx.tournamentMatch.aggregate({ where: { tournamentId: m.tournamentId }, _max: { round: true } });
    await placeWinner(tx, m.tournamentId, m.round, m.position, agg._max.round ?? m.round, winnerId, (side === "a" ? m.seedA : m.seedB) ?? 999, m.tournament.durationMinutes, now);
    return true;
  });
}

// ── The judge's step ──────────────────────────────────────────────────

/**
 * Called by the judge for every submission (routes/execution.ts): one
 * indexed read for a player in no live match. Otherwise the player's best
 * result in the match is raised, and an accepted solution wins it.
 */
export async function recordKnockoutSubmission(
  userId: string,
  problemId: string,
  submissionId: string,
  verdict: string,
  passed: number,
  total: number,
  at: Date,
): Promise<{ matchId: string; tournamentId: string; won: boolean } | null> {
  const m = await prisma.tournamentMatch.findFirst({
    where: {
      status: "live",
      problemId,
      startedAt: { lte: at },
      endsAt: { gt: at },
      OR: [{ playerAId: userId }, { playerBId: userId }],
      tournament: { status: "published" },
    },
    select: { id: true, tournamentId: true, playerAId: true },
  });
  if (!m) return null;
  const side = m.playerAId === userId ? "a" : "b";
  // The attempt on the tournament's record, as an ICPC attempt is (with no
  // team): the main site's "solved in a tournament" mark and profile read it.
  const contestVerdict = VERDICTS[verdict];
  if (contestVerdict) {
    await prisma.tournamentSubmission
      .create({ data: { tournamentId: m.tournamentId, teamId: null, userId, problemId, submissionId, verdict: contestVerdict, submittedAt: at } })
      .catch((err) => {
        if (!isDuplicateKey(err)) throw err;
      });
  }
  // Raised only, never lowered, and stamped when first reached.
  await prisma.tournamentMatch.updateMany({
    where: side === "a" ? { id: m.id, aPassed: { lt: passed } } : { id: m.id, bPassed: { lt: passed } },
    data: side === "a" ? { aPassed: passed, aBestAt: at, total } : { bPassed: passed, bBestAt: at, total },
  });
  const won = verdict === "ACCEPTED" ? await decide(m.id, side, "solve") : false;
  // The spectators' copy of the room is out of date: the next poll rebuilds it with this attempt.
  spectatorRooms.delete(m.id);
  return { matchId: m.id, tournamentId: m.tournamentId, won };
}

// ── Players ───────────────────────────────────────────────────────────

/** Confirm presence in the hour before the start; only checked-in players are seeded. */
export async function checkIn(userId: string, tournamentId: string) {
  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: { id: true, status: true, checkedInAt: true, tournament: { select: { format: true, status: true, startsAt: true } } },
  });
  if (!entry || entry.tournament.format !== "knockout" || entry.tournament.status !== "published") throw new BattlesError(404, "You are not registered for this knockout.");
  if (entry.status !== "approved") throw new BattlesError(409, "Your registration has not been approved yet.");
  const now = Date.now();
  const opens = entry.tournament.startsAt.getTime() - CHECK_IN_MINUTES * 60_000;
  if (now < opens) throw new BattlesError(409, `Check-in opens ${CHECK_IN_MINUTES} minutes before the start.`);
  if (now >= entry.tournament.startsAt.getTime()) throw new BattlesError(409, "Check-in has closed: the bracket has been drawn.");
  if (!entry.checkedInAt) await prisma.tournamentEntry.update({ where: { id: entry.id }, data: { checkedInAt: new Date() } });
  return { checkedIn: true };
}

/** The roster's order among players who got equally far: who is still in it before who is out. */
const STANDING_ORDER: Record<RosterStanding["state"], number> = { champion: 0, "runner-up": 1, playing: 2, through: 3, out: 4 };

/**
 * The bracket: every round, every match, the champion, every player and
 * how far they got, and the reader's own live match. Public once the
 * tournament is, to anyone signed in or not; its organizers and
 * CodeKairo's admins any time (battles-view-rules mayRead).
 */
export async function bracketView(tournamentId: string, viewer: BattlesViewer) {
  await advanceKnockout(tournamentId);
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      ...VIEWED_TOURNAMENT_SELECT,
      slug: true,
      title: true,
      bracketAt: true,
      org: { select: { name: true, verifiedAt: true } },
      _count: { select: { entries: { where: { status: "approved", checkedInAt: { not: null } } } } },
    },
  });
  if (!t || t.format !== "knockout") throw new BattlesError(404, "No such knockout.");
  const role = await roleOf(viewer, t.orgId, false);
  if (!mayRead(viewedTournament(t), role)) throw new BattlesError(404, "No such knockout.");

  const [matches, champion, seeded, registered] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: { tournamentId: t.id },
      orderBy: [{ round: "asc" }, { position: "asc" }],
      select: {
        id: true,
        round: true,
        position: true,
        seedA: true,
        seedB: true,
        status: true,
        startedAt: true,
        endsAt: true,
        winnerId: true,
        decidedBy: true,
        aPassed: true,
        bPassed: true,
        total: true,
        playerA: { select: PLAYER_SELECT },
        playerB: { select: PLAYER_SELECT },
      },
    }),
    t.finishedAt ? prisma.tournament.findUnique({ where: { id: t.id }, select: { championId: true } }) : Promise.resolve(null),
    // The players the draw seeded — the bracket's field. Before the draw
    // there is none, and the page shows the counts alone.
    t.bracketAt ? prisma.tournamentEntry.findMany({ where: { tournamentId: t.id, seed: { not: null } }, select: { seed: true, user: { select: PLAYER_SELECT } } }) : Promise.resolve([]),
    prisma.tournamentEntry.count({ where: { tournamentId: t.id, status: "approved" } }),
  ]);
  const rounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0;
  const championUser = champion?.championId ? await prisma.user.findUnique({ where: { id: champion.championId }, select: PLAYER_SELECT }) : null;
  const viewerId = viewer?.userId ?? null;
  const mine = viewerId
    ? matches.filter((m) => (m.playerA?.id === viewerId || m.playerB?.id === viewerId) && m.status !== "done").sort((a, b) => b.round - a.round)[0]
    : undefined;
  const roster = matches.map((m) => ({ round: m.round, status: m.status, winnerId: m.winnerId, a: m.playerA?.id ?? null, b: m.playerB?.id ?? null }));
  const players = seeded
    .map((e) => ({ ...playerOut(e.user)!, seed: e.seed!, ...rosterStanding(e.user.id, roster, rounds) }))
    .sort((x, y) => y.reached - x.reached || STANDING_ORDER[x.state] - STANDING_ORDER[y.state] || x.seed - y.seed);

  return {
    tournament: {
      id: t.id,
      slug: t.slug,
      title: t.title,
      orgName: t.org.name,
      startsAt: t.startsAt,
      drawn: t.bracketAt !== null,
      finished: t.finishedAt !== null,
      registered,
      checkedIn: t._count.entries,
      durationMinutes: t.durationMinutes,
    },
    champion: playerOut(championUser),
    rounds: Array.from({ length: rounds }, (_, i) => ({
      round: i + 1,
      name: roundName(i + 1, rounds),
      matches: matches
        .filter((m) => m.round === i + 1)
        .map(({ playerA, playerB, ...m }) => ({ ...m, a: playerOut(playerA), b: playerOut(playerB) })),
    })),
    players,
    myMatchId: mine?.id ?? null,
    // Staff watch the players' code live in a match room; everyone else follows the attempts.
    viewer: { staff: isStaff(role) },
    serverNow: new Date(),
  };
}

/** A spectator's copy of a room is the same for every spectator: built once per match per window, however many are watching. */
const SPECTATOR_ROOM_TTL_MS = 2_000;
const MAX_SPECTATOR_ROOMS = 500;
type Room = Awaited<ReturnType<typeof buildRoom>>;

/**
 * The spectators' shared copies of each room, fresh for SPECTATOR_ROOM_TTL_MS
 * and never served past it — not lib/cache's `cached`, whose
 * stale-while-revalidate would hand the first reader after a quiet spell a
 * room minutes old (a decided match still live). The promise is what is
 * kept, so a burst of pollers shares one build; an attempt drops its
 * match's copy (recordKnockoutSubmission), so its verdict shows on the next
 * poll.
 */
const spectatorRooms = new Map<string, { at: number; room: Promise<Room> }>();

function spectatorRoom(matchId: string, build: () => Promise<Room>): Promise<Room> {
  const now = Date.now();
  const hit = spectatorRooms.get(matchId);
  if (hit && now - hit.at < SPECTATOR_ROOM_TTL_MS) return hit.room;
  const entry = { at: now, room: build() };
  spectatorRooms.set(matchId, entry);
  entry.room.catch(() => {
    if (spectatorRooms.get(matchId) === entry) spectatorRooms.delete(matchId);
  });
  if (spectatorRooms.size > MAX_SPECTATOR_ROOMS) for (const [id, e] of spectatorRooms) if (now - e.at >= SPECTATOR_ROOM_TTL_MS) spectatorRooms.delete(id);
  return entry.room;
}
/** More attempts than a match of any length sees; a cap, not a page. */
const MAX_MATCH_ATTEMPTS = 200;

const MATCH_ROOM_SELECT = {
  id: true,
  round: true,
  position: true,
  seedA: true,
  seedB: true,
  status: true,
  startedAt: true,
  endsAt: true,
  winnerId: true,
  decidedBy: true,
  aPassed: true,
  bPassed: true,
  total: true,
  playerA: { select: PLAYER_SELECT },
  playerB: { select: PLAYER_SELECT },
  problemId: true,
  tournament: { select: { ...VIEWED_TOURNAMENT_SELECT, slug: true, title: true, org: { select: { name: true, verifiedAt: true } } } },
} as const;
type MatchRow = Prisma.TournamentMatchGetPayload<{ select: typeof MATCH_ROOM_SELECT }>;

/**
 * A match room: the two players, the clock, each side's best result, the
 * problem (once the match is live), every attempt so far, the winner, and
 * where the winner plays next. Its two players play it; anyone else may
 * open a public tournament's match to follow it, read-only (user request
 * 2026-10-02) — signed in or not. Each attempt says whether this reader
 * may open its code (battles-attempts.ts serves it): its author and the
 * staff always, everyone once the tournament is over.
 */
export async function matchRoom(viewer: BattlesViewer, matchId: string) {
  const first = await prisma.tournamentMatch.findUnique({ where: { id: matchId }, select: { tournamentId: true } });
  if (!first) throw new BattlesError(404, "No such match.");
  await advanceKnockout(first.tournamentId);
  const m = await prisma.tournamentMatch.findUnique({ where: { id: matchId }, select: MATCH_ROOM_SELECT });
  if (!m) throw new BattlesError(404, "No such match.");
  const viewerId = viewer?.userId ?? null;
  const side = viewerId && m.playerA?.id === viewerId ? "a" : viewerId && m.playerB?.id === viewerId ? "b" : null;
  const role = await roleOf(viewer, m.tournament.orgId, side !== null);
  // A player always reaches their own match; the rest only a tournament they may read.
  if (!side && !mayRead(viewedTournament(m.tournament), role)) throw new BattlesError(404, "No such match.");

  const room = role === "spectator" ? await spectatorRoom(m.id, () => buildRoom(m, "spectator", null, new Date())) : await buildRoom(m, role, viewerId, new Date());
  // Outside the shared copy: the room's clock runs on this, so it must be this answer's.
  return { ...room, serverNow: new Date() };
}

async function buildRoom(m: MatchRow, role: ViewerRole, viewerId: string | null, now: Date) {
  const t = viewedTournament(m.tournament);
  const side = role === "player" ? (m.playerA?.id === viewerId ? "a" : "b") : null;
  const started = m.status !== "waiting" && m.startedAt !== null && m.startedAt <= now;
  const codePublic = codeIsPublic(t, now);
  const [problem, agg, next, attempts] = await Promise.all([
    started && m.problemId ? prisma.problem.findUnique({ where: { id: m.problemId }, select: { id: true, slug: true, title: true, difficulty: true } }) : Promise.resolve(null),
    prisma.tournamentMatch.aggregate({ where: { tournamentId: m.tournament.id }, _max: { round: true } }),
    // The winner's next match, for the "on to the next round" link.
    viewerId && m.winnerId === viewerId ? prisma.tournamentMatch.findFirst({ where: { tournamentId: m.tournament.id, round: m.round + 1, position: Math.floor(m.position / 2) }, select: { id: true } }) : Promise.resolve(null),
    started ? matchAttempts(m) : Promise.resolve([]),
  ]);
  const rounds = agg._max.round ?? m.round;
  const { playerA, playerB, tournament, problemId: _problemId, ...rest } = m;
  return {
    match: { ...rest, roundName: roundName(m.round, rounds), a: playerOut(playerA), b: playerOut(playerB) },
    tournament: { id: tournament.id, slug: tournament.slug, title: tournament.title, orgName: tournament.org.name, finished: tournament.finishedAt !== null },
    you: side,
    role,
    problem,
    nextMatchId: next?.id ?? null,
    attempts: attempts.map(({ userId, ...a }) => ({ ...a, side: userId === playerA?.id ? ("a" as const) : ("b" as const), readable: mayReadCode(role, userId === viewerId, codePublic) })),
    code: { public: codePublic, hiddenReason: codePublic ? null : codeHiddenReason(t, now) },
  };
}

/**
 * Every attempt of a match, oldest first, without its code: the two
 * players' tournament attempts on its problem inside its clock. A
 * knockout attempt is not tied to its match by a column; the judge counts
 * one only while its player's match is being played, so the clock alone
 * says which (battles-view-rules inMatchWindow) — even when a later round
 * comes back to the same problem.
 */
async function matchAttempts(m: MatchRow) {
  const players = [m.playerA?.id, m.playerB?.id].filter((id): id is string => !!id);
  if (!m.problemId || !m.startedAt || players.length === 0) return [];
  const rows = await prisma.tournamentSubmission.findMany({
    where: { tournamentId: m.tournament.id, problemId: m.problemId, userId: { in: players }, submittedAt: { gte: m.startedAt, ...(m.endsAt ? { lt: m.endsAt } : {}) } },
    orderBy: { submittedAt: "asc" },
    take: MAX_MATCH_ATTEMPTS,
    select: { id: true, userId: true, verdict: true, submittedAt: true, submission: { select: { language: true, passedCases: true, totalCases: true, runtimeMs: true } } },
  });
  return rows
    .filter((r) => inMatchWindow(r.submittedAt, m))
    .map((r) => ({
      id: r.id,
      userId: r.userId,
      verdict: r.verdict,
      at: r.submittedAt,
      language: r.submission.language,
      passed: r.submission.passedCases,
      total: r.submission.totalCases,
      runtimeMs: r.submission.runtimeMs,
    }));
}

/**
 * Who a socket's account is to one match, for the live code relay
 * (services/match-watch.ts): one of its two players, an organizer or a
 * CodeKairo admin (neither of them a player of it), or nobody — and the
 * match's clock, so a player's code is relayed only while the match is
 * being played.
 */
export async function matchSeat(userId: string, matchId: string) {
  const [m, user] = await Promise.all([
    prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { status: true, startedAt: true, endsAt: true, playerAId: true, playerBId: true, tournament: { select: { orgId: true, status: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);
  if (!m || m.tournament.status !== "published") return null;
  const side = m.playerAId === userId ? ("a" as const) : m.playerBId === userId ? ("b" as const) : null;
  return {
    side,
    // A player never watches: an organizer or admin who also plays sees only their own editor.
    manager: side ? false : await managesOrg(userId, m.tournament.orgId),
    admin: !side && isAdminEmail(user?.email),
    status: m.status,
    startedAt: m.startedAt,
    endsAt: m.endsAt,
  };
}

/** Whether anyone may spectate a match (match-watch-rules spectate-match): a published knockout's, of a verified organizer. */
export async function matchIsPublic(matchId: string): Promise<boolean> {
  const m = await prisma.tournamentMatch.findUnique({ where: { id: matchId }, select: { tournament: { select: { status: true, org: { select: { verifiedAt: true } } } } } });
  return !!m && m.tournament.status === "published" && m.tournament.org.verifiedAt !== null;
}

/** The reader's standing in a knockout, for its public page: checked in, and the match to go to. */
export async function knockoutViewer(tournamentId: string, userId: string) {
  const [entry, match] = await Promise.all([
    prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId, userId } }, select: { checkedInAt: true, seed: true } }),
    prisma.tournamentMatch.findFirst({
      where: { tournamentId, status: { in: ["live", "waiting"] }, OR: [{ playerAId: userId }, { playerBId: userId }] },
      orderBy: { round: "desc" },
      select: { id: true },
    }),
  ]);
  return { checkedIn: !!entry?.checkedInAt, seed: entry?.seed ?? null, matchId: match?.id ?? null };
}

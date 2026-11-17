import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { countersOfMe } from "../lib/badges.js";
import {
  FRAME_GOODIES,
  LIMITED_FRAMES,
  NO_FRAME,
  frameCards,
  limitedWindow,
  parseFrameId,
  wearableFrames,
  type FrameCard,
  type FrameFacts,
} from "../lib/frames.js";
import { getMePayload, invalidateMe } from "./me.js";
import { invalidateDashboard, loadProblemState } from "./dashboard.js";
import { forgetPublicUser } from "./public-profile.js";
import { topicPlanTargets } from "./problem-hubs.js";
import { simulationProgress } from "./simulations.js";
import { trackList } from "./study-plans.js";

/**
 * Profile-picture frames (lib/frames.ts has the rules and the why): the
 * picker's read and the wear write.
 *
 * The facts are ten reads on the account's own rows, every one by an index
 * that starts with its userId, run together; most ride caches the dashboard
 * already keeps (the /api/me payload, the problem state, the topic plans,
 * the study tracks). Held a minute per account: the picker is opened on a
 * visit, and a solve that earns a frame shows on the next one. A wear or a
 * purchase drops it.
 */

const factsKey = (userId: string) => `frames:v1:${userId}`;
const FACTS_TTL_MS = 60_000;

export function forgetFrames(userId: string): void {
  invalidate(factsKey(userId));
}

/** Hard problems first accepted outside a pair room with no help on screen before the accept (lib/frames UNASSISTED_HARD). */
async function unassistedHardCount(userId: string): Promise<number> {
  const [state, firsts] = await Promise.all([
    loadProblemState(userId),
    prisma.submission.groupBy({ by: ["problemId"], where: { userId, verdict: "ACCEPTED", roomId: null }, _min: { submittedAt: true } }),
  ]);
  const hard = new Set(state.catalogue.filter((p) => p.difficulty.toUpperCase() === "HARD").map((p) => p.id));
  const acceptedAt = new Map<string, Date>();
  for (const r of firsts) if (hard.has(r.problemId) && r._min.submittedAt) acceptedAt.set(r.problemId, r._min.submittedAt);
  if (acceptedAt.size === 0) return 0;
  const engagements = await prisma.problemEngagement.findMany({
    where: { userId, problemId: { in: [...acceptedAt.keys()] } },
    select: { problemId: true, openedAt: true, hintsAt: true, editorialAt: true, tutorHintAt: true, tutorSolutionAt: true },
  });
  let n = 0;
  for (const e of engagements) {
    const at = acceptedAt.get(e.problemId);
    if (!at || e.openedAt > at) continue;
    const helped = [e.hintsAt, e.editorialAt, e.tutorHintAt, e.tutorSolutionAt].some((t) => t !== null && t <= at);
    if (!helped) n++;
  }
  return n;
}

/** Daily problems solved on their own day, by month. */
async function kataMonths(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.dailyContestEntry.findMany({ where: { userId, solvedAt: { not: null } }, select: { date: true } });
  const months: Record<string, number> = {};
  for (const r of rows) {
    const m = r.date.slice(0, 7);
    months[m] = (months[m] ?? 0) + 1;
  }
  return months;
}

/** The limited editions whose window has started and saw an accepted coding or SQL solve. No read at all before a window opens. */
async function limitedEarned(userId: string, now: Date): Promise<string[]> {
  const started = LIMITED_FRAMES.filter((l) => limitedWindow(l, now).started);
  const hits = await Promise.all(
    started.map(async (l): Promise<string | null> => {
      const { start, end } = limitedWindow(l, now);
      const range = { gte: start, lt: end };
      const [coding, sql] = await Promise.all([
        prisma.submission.findFirst({ where: { userId, verdict: "ACCEPTED", submittedAt: range }, select: { id: true } }),
        prisma.sqlSubmission.findFirst({ where: { userId, verdict: "ACCEPTED", submittedAt: range }, select: { id: true } }),
      ]);
      return coding || sql ? l.id : null;
    }),
  );
  return hits.filter((id): id is string => id !== null);
}

async function gatherFacts(userId: string): Promise<FrameFacts> {
  const now = new Date();
  const [me, unassisted, kata, credentials, trackRows, finished, plans, state, referrals, simulations, limited, owned] = await Promise.all([
    getMePayload(userId),
    unassistedHardCount(userId),
    kataMonths(userId),
    prisma.skillCredential.count({ where: { userId, revokedAt: null, expiresAt: { gt: now } } }),
    trackList().catch(() => []),
    prisma.studyEnrollment.findMany({ where: { userId, completedAt: { not: null } }, select: { trackKey: true } }),
    topicPlanTargets().catch(() => []),
    loadProblemState(userId),
    prisma.referral.count({ where: { referrerId: userId, rewardedAt: { not: null }, referrerCredits: { gt: 0 } } }),
    simulationProgress(userId).catch(() => []),
    limitedEarned(userId, now),
    prisma.redemption.findMany({ where: { userId, itemId: { in: FRAME_GOODIES.map((g) => g.id) }, grantId: { not: null } }, select: { itemId: true } }),
  ]);
  const counters = countersOfMe(me ?? {});
  const done = new Set(finished.map((f) => f.trackKey));
  return {
    solved: counters.problemsSolved + counters.sqlSolved,
    unassistedHard: unassisted,
    bestStreak: counters.longestStreak,
    chests: counters.chestsOpened,
    credentials,
    honours: (me?.honours ?? []).map((h: { kind: string }) => h.kind),
    kataMonths: kata,
    tracks: trackRows.map((t) => ({ key: t.key, title: t.title, finished: done.has(t.key) })),
    topics: plans.map((p) => ({ slug: p.slug, label: p.label, total: p.ids.length, solved: p.ids.filter((id) => state.solved.has(id)).length })),
    referrals,
    simulations,
    limited,
    owned: owned.map((o) => o.itemId),
  };
}

function factsFor(userId: string, fresh = false): Promise<FrameFacts> {
  if (fresh) forgetFrames(userId);
  return cached(factsKey(userId), FACTS_TTL_MS, () => gatherFacts(userId));
}

export interface FramesPage {
  /** The id worn, or null for Auto. */
  worn: string | null;
  cards: FrameCard[];
}

export async function framesPage(userId: string): Promise<FramesPage> {
  const [facts, user] = await Promise.all([factsFor(userId), prisma.user.findUnique({ where: { id: userId }, select: { wornFrame: true } })]);
  return { worn: user?.wornFrame ?? null, cards: frameCards(facts) };
}

export type WearOutcome = { ok: true; worn: string | null } | { ok: false; status: 400 | 409; error: string };

/**
 * Puts a frame on (or Auto, or none). An earned frame is checked against
 * facts read fresh — a frame earned a minute ago is wearable now — and the
 * skill-credential frame wears the newest valid credential when none is
 * worn, since that frame is drawn from the worn one. Every reader of the
 * frame reads it off a cached payload, so the holder's /api/me, dashboard
 * and public profile are dropped; the community feeds catch up as their
 * short caches turn, as they do for a worn credential.
 */
export async function setWornFrame(userId: string, raw: unknown): Promise<WearOutcome> {
  const id = parseFrameId(raw);
  if (id === undefined) return { ok: false, status: 400, error: "That is not a frame." };
  if (id !== null && id !== NO_FRAME) {
    const wearable = wearableFrames(await factsFor(userId, true));
    if (!wearable.has(id)) return { ok: false, status: 409, error: "You haven't earned this frame yet." };
  }
  if (id === "credential") await wearNewestCredentialIfNone(userId);
  await prisma.user.update({ where: { id: userId }, data: { wornFrame: id }, select: { id: true } });
  invalidateMe(userId);
  invalidateDashboard(userId);
  forgetPublicUser(userId);
  return { ok: true, worn: id };
}

async function wearNewestCredentialIfNone(userId: string): Promise<void> {
  const now = new Date();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { wornCredential: { select: { expiresAt: true, revokedAt: true } } } });
  const worn = user?.wornCredential;
  if (worn && !worn.revokedAt && worn.expiresAt > now) return;
  const newest = await prisma.skillCredential.findFirst({
    where: { userId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { issuedAt: "desc" },
    select: { id: true },
  });
  if (newest) await prisma.user.update({ where: { id: userId }, data: { wornCredentialId: newest.id }, select: { id: true } });
}

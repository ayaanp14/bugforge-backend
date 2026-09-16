import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { createNotificationOnce } from "./notifications.js";
import { invalidateDashboard } from "./dashboard.js";

/**
 * The roadmap, for one account.
 *
 * Two sources: the road as seeded (RoadmapTier / RoadmapStage /
 * RoadmapStageProblem — authored in scripts/roadmap-data.ts, written by
 * scripts/seed-roadmap.ts) and the account's accepted submissions. The road
 * is read once and cached — it changes on a seed, not between requests —
 * and the per-user part is a single `Submission` query over the road's
 * problem ids. Standing is never written: "cleared" is a fact about
 * submissions, so it can never disagree with the judge or need a backfill,
 * and a solve made from the catalogue, a duel or a pair room counts on the
 * road too.
 *
 * The one thing written is a tier's chest. Every tier ends in one, worth
 * the tier's `rewardXp`, and it opens when every stage of the tier is
 * cleared: the XP is paid to the account once, the row (RoadmapReward) is
 * the badge on the profile and the claim a shared win is checked against.
 * Claimed wherever the clearing is noticed — after the solve that did it,
 * and on any read of the road — so a tier cleared before chests existed,
 * or whose post-solve hook failed, pays out on the next visit.
 */

export type StageStatus = "locked" | "open" | "cleared";

/** A stage as seeded, with its problems resolved to catalogue rows. */
export interface StageDefinition {
  id: string;
  key: string;
  title: string;
  blurb: string;
  tier: string;
  icon: string;
  required: number;
  problems: Array<{ id: string; slug: string; title: string; difficulty: string }>;
}

export interface TierDefinition {
  id: string;
  title: string;
  blurb: string;
  /** What the chest at the tier's end pays, to XP and rating alike. */
  rewardXp: number;
  /** Bonus mock-interview sessions the chest holds. */
  interviewCredits: number;
}

export interface RoadDefinition {
  tiers: TierDefinition[];
  stages: StageDefinition[];
}

export interface RoadmapProblem {
  slug: string;
  title: string;
  difficulty: string;
  solved: boolean;
}

export interface RoadmapStage {
  id: string;
  title: string;
  blurb: string;
  tier: string;
  icon: string;
  /** 1-based position on the road. */
  number: number;
  required: number;
  solved: number;
  total: number;
  status: StageStatus;
  /** Only sent for a stage the reader may see into (open or cleared). */
  problems: RoadmapProblem[] | null;
}

/** A tier as the reader sees it: the definition plus whether its chest is open. */
export interface RoadmapTierStanding extends TierDefinition {
  /** When the chest was opened and its XP paid; null while any stage is uncleared. */
  earnedAt: Date | null;
}

export interface RoadmapPayload {
  tiers: RoadmapTierStanding[];
  stages: RoadmapStage[];
  summary: {
    stages: number;
    cleared: number;
    problems: number;
    solved: number;
    /** The first stage that is open and not yet cleared; null once the road is done. */
    currentId: string | null;
  };
}

/** One chest as the profile lists it: every tier, opened or not. */
export interface RoadmapBadge {
  tier: string;
  title: string;
  xp: number;
  interviewCredits: number;
  earnedAt: Date | null;
}

const DEFINITION_KEY = "roadmap:definition";

/**
 * The seeded road, published stages only, in order. Cached: it changes on a
 * seed, not between requests. An empty road is not kept — a process that
 * boots before the seed has run (a fresh deploy, a local restart) would
 * otherwise serve "no stages" for the cache's whole life.
 */
export async function roadDefinition(): Promise<RoadDefinition> {
  const road = await cached(DEFINITION_KEY, 5 * 60 * 1000, async () => {
    const [tiers, stages] = await Promise.all([
      prisma.roadmapTier.findMany({ orderBy: { position: "asc" }, select: { key: true, title: true, blurb: true, rewardXp: true, interviewCredits: true } }),
      prisma.roadmapStage.findMany({
        where: { isPublished: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          key: true,
          title: true,
          blurb: true,
          icon: true,
          required: true,
          tier: { select: { key: true } },
          problems: {
            orderBy: { position: "asc" },
            // An unpublished problem drops out of its stage rather than
            // showing a link the workbench would refuse; `required` is
            // capped to what is left when standing is computed.
            where: { problem: { isPublished: true } },
            select: { problem: { select: { id: true, slug: true, title: true, difficulty: true } } },
          },
        },
      }),
    ]);
    return {
      tiers: tiers.map((t) => ({ id: t.key, title: t.title, blurb: t.blurb, rewardXp: t.rewardXp, interviewCredits: t.interviewCredits })),
      stages: stages.map((s) => ({
        id: s.key,
        key: s.key,
        title: s.title,
        blurb: s.blurb,
        tier: s.tier.key,
        icon: s.icon,
        required: s.required,
        problems: s.problems.map((p) => p.problem),
      })),
    };
  });
  if (road.stages.length === 0) invalidate(DEFINITION_KEY);
  return road;
}

/** After a seed on this instance (tests, scripts that import the service). */
export function invalidateRoadDefinition(): void {
  invalidate(DEFINITION_KEY);
}

/** At boot: an empty road is a missing seed, and worth a line in the log. */
export async function checkRoadmapSeeded(): Promise<void> {
  const road = await roadDefinition();
  if (road.stages.length === 0) {
    console.error("roadmap: no stages are seeded — run `npx tsx scripts/seed-roadmap.ts --seed` (see scripts/roadmap-data.ts).");
  }
}

/** Problem ids the account has an ACCEPTED submission on, among a set. */
async function solvedIds(userId: string, problemIds: string[]): Promise<Set<string>> {
  if (problemIds.length === 0) return new Set();
  const rows = await prisma.submission.findMany({
    where: { userId, verdict: "ACCEPTED", problemId: { in: problemIds } },
    distinct: ["problemId"],
    select: { problemId: true },
  });
  return new Set(rows.map((r) => r.problemId));
}

/** The stages with their standing, given which problems are solved. Pure, so it is testable. */
export function walk(road: RoadDefinition, solved: Set<string>): RoadmapStage[] {
  let previousCleared = true;
  return road.stages.map((def, index) => {
    const solvedCount = def.problems.filter((p) => solved.has(p.id)).length;
    const cleared = def.problems.length > 0 && solvedCount >= Math.min(def.required, def.problems.length);
    const status: StageStatus = cleared ? "cleared" : previousCleared ? "open" : "locked";
    previousCleared = cleared;
    return {
      id: def.id,
      title: def.title,
      blurb: def.blurb,
      tier: def.tier,
      icon: def.icon,
      number: index + 1,
      required: Math.min(def.required, def.problems.length),
      solved: solvedCount,
      total: def.problems.length,
      status,
      problems: status === "locked" ? null : def.problems.map((p) => ({ slug: p.slug, title: p.title, difficulty: p.difficulty, solved: solved.has(p.id) })),
    };
  });
}

/**
 * The tiers whose every stage is cleared — the chests that are open. Pure,
 * like `walk`. A tier with no published stages is not "cleared" by
 * vacuity: a chest with nothing behind it would pay out at once.
 */
export function clearedTiers(road: RoadDefinition, stages: RoadmapStage[]): string[] {
  return road.tiers
    .filter((tier) => {
      const own = stages.filter((s) => s.tier === tier.id);
      return own.length > 0 && own.every((s) => s.status === "cleared");
    })
    .map((tier) => tier.id);
}

/**
 * Opens every chest the account has earned and not yet been paid for.
 *
 * The row and the XP land in one transaction, and the (user, tier) unique
 * is the lock: two solves clearing the same tier at once — two tabs, or the
 * post-solve hook racing a page load — both reach here, one insert wins,
 * the other's P2002 is the signal to pay nothing. Returns what was opened
 * this call, so a caller can say so.
 */
export async function claimTierRewards(
  userId: string,
  road: RoadDefinition,
  stages: RoadmapStage[],
  /** Tier keys already paid, when the caller has just read them — saves the lookup. */
  paidKeys?: readonly string[],
) {
  const earned = clearedTiers(road, stages);
  if (earned.length === 0) return [];

  const paid =
    paidKeys ??
    (
      await prisma.roadmapReward.findMany({
        where: { userId, tierKey: { in: earned } },
        select: { tierKey: true },
      })
    ).map((p) => p.tierKey);
  const owed = earned.filter((key) => !paid.includes(key));
  if (owed.length === 0) return [];

  const opened: Array<{ tier: string; title: string; xp: number; interviewCredits: number }> = [];
  for (const key of owed) {
    const tier = road.tiers.find((t) => t.id === key)!;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.roadmapReward.create({ data: { userId, tierKey: key, xp: tier.rewardXp, interviewCredits: tier.interviewCredits } });
        // `xp` (the leaderboard and the profile total) and `rating` (the
        // rank ladder — the Novice → Apprentice bar on the home hero), the
        // way a first solve pays both. Not the per-source buckets
        // (questionsXp, bugsXp): those are what the solves themselves pay,
        // and a chest is neither. The interview credits are on the reward
        // row, not the user: the balance is derived by counting
        // (services/entitlements.ts), so there is nothing to keep in step.
        await tx.user.update({ where: { id: userId }, data: { xp: { increment: tier.rewardXp }, rating: { increment: tier.rewardXp } } });
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
    opened.push({ tier: key, title: tier.title, xp: tier.rewardXp, interviewCredits: tier.interviewCredits });
  }
  if (opened.length === 0) return [];

  // The XP just moved; the home hero and the profile read it from the
  // cached aggregate.
  invalidateDashboard(userId);

  const last = road.tiers[road.tiers.length - 1]?.id;
  await Promise.all(
    opened.map((reward) => {
      const sessions = reward.interviewCredits > 0
        ? ` and ${reward.interviewCredits} bonus mock interview${reward.interviewCredits === 1 ? "" : "s"}`
        : "";
      return createNotificationOnce(userId, {
        type: `roadmap_tier_cleared:${reward.tier}`,
        title: reward.tier === last ? `The road is yours 🏆 +${reward.xp} XP` : `Chest opened: ${reward.title} 🎁 +${reward.xp} XP`,
        body:
          reward.tier === last
            ? `Every stage of the DSA roadmap is cleared. The last chest held ${reward.xp} XP${sessions} — your certificate and the win to share are on the road.`
            : `Every ${reward.title} stage is cleared. The chest held ${reward.xp} XP${sessions}, and the road ahead is revealed a tier further. Open it on the road to share the win.`,
        href: "/roadmap",
      });
    }),
  );
  return opened;
}

/** The chests this account has opened: what the badges, the claim and the standing all read. */
function rewardRows(userId: string) {
  return prisma.roadmapReward.findMany({ where: { userId }, select: { tierKey: true, earnedAt: true } });
}

export async function roadmapFor(userId: string): Promise<RoadmapPayload> {
  const road = await roadDefinition();
  // The solves and the chests already opened are independent reads, so they
  // go out together; the claim below reuses the second rather than asking
  // again, and only a chest opened on this very read costs a re-read.
  const [solved, before] = await Promise.all([
    solvedIds(userId, road.stages.flatMap((s) => s.problems.map((p) => p.id))),
    rewardRows(userId),
  ]);
  const stages = walk(road, solved);
  const cleared = stages.filter((s) => s.status === "cleared").length;

  // A read that pays: a chest earned before chests existed, or whose
  // post-solve hook failed, opens on the next look at the road. Idempotent
  // and normally a no-op.
  const opened = await claimTierRewards(userId, road, stages, before.map((r) => r.tierKey));
  const rewards = opened.length > 0 ? await rewardRows(userId) : before;

  return {
    tiers: road.tiers.map((tier) => ({ ...tier, earnedAt: rewards.find((r) => r.tierKey === tier.id)?.earnedAt ?? null })),
    stages,
    summary: {
      stages: stages.length,
      cleared,
      problems: stages.reduce((n, s) => n + s.total, 0),
      solved: stages.reduce((n, s) => n + s.solved, 0),
      currentId: stages.find((s) => s.status === "open")?.id ?? null,
    },
  };
}

/**
 * The chests as the profile shows them: every tier, with the date it was
 * opened or null. Rides on the dashboard aggregate (services/dashboard.ts)
 * rather than a call of its own.
 */
export async function roadmapBadgesFor(userId: string): Promise<RoadmapBadge[]> {
  const [road, rewards] = await Promise.all([roadDefinition(), rewardRows(userId)]);
  return road.tiers.map((tier) => ({
    tier: tier.id,
    title: tier.title,
    xp: tier.rewardXp,
    interviewCredits: tier.interviewCredits,
    earnedAt: rewards.find((r) => r.tierKey === tier.id)?.earnedAt ?? null,
  }));
}

/**
 * After a first accepted solve: if it was the one that cleared its stage,
 * say so — and name what it unlocked. Called from the judge after the
 * response has gone out; a failure here is logged, never surfaced.
 *
 * "Cleared" is decided by recounting, not by trusting the caller: the solve
 * is already in the table by the time this runs, so the count is the truth.
 * One-shot per (user, stage) through the notification type, so a second
 * solve in an already-cleared stage says nothing.
 */
export async function announceStageIfCleared(userId: string, problemId: string): Promise<void> {
  const road = await roadDefinition();
  const index = road.stages.findIndex((s) => s.problems.some((p) => p.id === problemId));
  if (index === -1) return;
  const stage = road.stages[index];

  // One query over the whole road: the stage's count is a subset of it, and
  // the chest check below needs all of it anyway. This used to be two.
  const all = await solvedIds(userId, road.stages.flatMap((s) => s.problems.map((p) => p.id)));
  const solvedInStage = stage.problems.filter((p) => all.has(p.id)).length;
  if (solvedInStage < Math.min(stage.required, stage.problems.length)) return;

  const next = road.stages[index + 1] ?? null;
  await createNotificationOnce(userId, {
    type: `roadmap_stage_cleared:${stage.key}`,
    title: `Stage cleared: ${stage.title} ✅`,
    body: next
      ? `${solvedInStage} of ${stage.problems.length} solved — that clears it. ${next.title} is unlocked on your roadmap.`
      : `${solvedInStage} of ${stage.problems.length} solved. That was the last stage — the whole DSA roadmap is yours. 🏆`,
    href: "/roadmap",
  });

  // A cleared stage may have been its tier's last: the chest opens now, not
  // on the next visit to the road.
  await claimTierRewards(userId, road, walk(road, all));
}

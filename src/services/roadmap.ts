import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { createNotificationOnce } from "./notifications.js";

/**
 * The roadmap, for one account.
 *
 * Two sources: the road as seeded (RoadmapTier / RoadmapStage /
 * RoadmapStageProblem — authored in scripts/roadmap-data.ts, written by
 * scripts/seed-roadmap.ts) and the account's accepted submissions. The road
 * is read once and cached — it changes on a seed, not between requests —
 * and the per-user part is a single `Submission` query over the road's
 * problem ids. Nothing is written: "cleared" is a fact about submissions,
 * so it can never disagree with the judge or need a backfill, and a solve
 * made from the catalogue, a duel or a pair room counts on the road too.
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

export interface RoadDefinition {
  tiers: Array<{ id: string; title: string; blurb: string }>;
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

export interface RoadmapPayload {
  tiers: RoadDefinition["tiers"];
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
      prisma.roadmapTier.findMany({ orderBy: { position: "asc" }, select: { key: true, title: true, blurb: true } }),
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
      tiers: tiers.map((t) => ({ id: t.key, title: t.title, blurb: t.blurb })),
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

export async function roadmapFor(userId: string): Promise<RoadmapPayload> {
  const road = await roadDefinition();
  const solved = await solvedIds(userId, road.stages.flatMap((s) => s.problems.map((p) => p.id)));
  const stages = walk(road, solved);
  const cleared = stages.filter((s) => s.status === "cleared").length;
  return {
    tiers: road.tiers,
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
  const solved = await solvedIds(userId, stage.problems.map((p) => p.id));
  if (solved.size < Math.min(stage.required, stage.problems.length)) return;

  const next = road.stages[index + 1] ?? null;
  await createNotificationOnce(userId, {
    type: `roadmap_stage_cleared:${stage.key}`,
    title: `Stage cleared: ${stage.title} ✅`,
    body: next
      ? `${solved.size} of ${stage.problems.length} solved — that clears it. ${next.title} is unlocked on your roadmap.`
      : `${solved.size} of ${stage.problems.length} solved. That was the last stage — the whole DSA roadmap is yours. 🏆`,
    href: "/roadmap",
  });
}

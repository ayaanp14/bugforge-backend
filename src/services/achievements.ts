import { prisma } from "../lib/prisma.js";

/**
 * A win someone wants to show off, checked against the records.
 *
 * An achievement is a claim about the judge's rows, and the card built from
 * it — title, difficulty, XP — used to be stored as the client sent it:
 * anyone could post "Solved <hard problem> +30 XP" with no submission
 * behind it. The solve (or the fixed hunt, or the opened chest) is looked up
 * here and the card's facts are taken from the row, not the request.
 *
 * Shared by the community's achievement posts (routes/community.ts) and the
 * shareable win pictures (services/share-cards.ts), which both put a claim in
 * front of other people and so must hold it to the same rule.
 */

export interface VerifiedAchievement {
  kind: "problem" | "bug" | "roadmap";
  title: string;
  difficulty?: string;
  slug?: string;
  challengeId?: string;
  tier?: string;
  xp?: number;
}

export type AchievementCheck = { ok: true; achievement: VerifiedAchievement } | { ok: false; error: string };

export async function verifyAchievement(userId: string, meta: Record<string, unknown>): Promise<AchievementCheck> {
  const kind = meta["kind"] === "bug" ? "bug" : meta["kind"] === "roadmap" ? "roadmap" : "problem";

  if (kind === "roadmap") {
    // A tier's chest: the claim is the RoadmapReward row the road wrote when
    // the tier was cleared; its name and what it paid come from that row and
    // the seeded tier.
    const tierKey = typeof meta["tier"] === "string" ? meta["tier"] : "";
    const [reward, tier] = tierKey
      ? await Promise.all([
          prisma.roadmapReward.findUnique({ where: { userId_tierKey: { userId, tierKey } }, select: { xp: true } }),
          prisma.roadmapTier.findUnique({ where: { key: tierKey }, select: { title: true } }),
        ])
      : [null, null];
    if (!reward || !tier) return { ok: false, error: "You can only share a chest you have opened" };
    return { ok: true, achievement: { kind, tier: tierKey, title: tier.title, xp: reward.xp } };
  }

  let achievement: VerifiedAchievement;
  if (kind === "bug") {
    const challengeId = typeof meta["challengeId"] === "string" ? meta["challengeId"] : "";
    const solved = challengeId
      ? await prisma.bugSubmission.findFirst({
          where: { userId, challengeId, verdict: "ACCEPTED" },
          select: { challenge: { select: { title: true, difficulty: true } } },
        })
      : null;
    if (!solved) return { ok: false, error: "You can only share a hunt you have fixed" };
    achievement = { kind, challengeId, title: solved.challenge.title, difficulty: solved.challenge.difficulty };
  } else {
    const slug = typeof meta["slug"] === "string" ? meta["slug"] : "";
    const solved = slug
      ? await prisma.submission.findFirst({
          where: { userId, verdict: "ACCEPTED", problem: { slug } },
          select: { problem: { select: { title: true, difficulty: true } } },
        })
      : null;
    if (!solved) return { ok: false, error: "You can only share a problem you have solved" };
    achievement = { kind, slug, title: solved.problem.title, difficulty: solved.problem.difficulty };
  }
  // XP is display only, and bounded so the card cannot boast a number the
  // catalogue never pays. A chest's XP is already the row's, not the request's.
  const xp = Number(meta["xp"]);
  if (Number.isFinite(xp) && xp > 0 && xp <= 100) achievement.xp = Math.round(xp);
  return { ok: true, achievement };
}

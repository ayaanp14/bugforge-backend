import { prisma } from "../lib/prisma.js";
import { GOODIES, goodieFor, pointsOf, redeemRefusal, type Goodie, type PointsBalance } from "../lib/goodies.js";
import { sqlProblem } from "../lib/sql-problems/index.js";
import { freeForAll, type FreeForAll } from "../lib/plans.js";
import { trackServerEvent } from "../lib/telemetry.js";
import { CREDENTIAL_XP } from "./skill-credentials.js";
import { TRACK_BONUS_XP } from "./study-plans.js";
import { creditBalance } from "./credits.js";
import { FRAME_GOODIES, frameGoodieFor, type FrameGoodie } from "../lib/frames.js";
import { isDuplicateKey } from "../lib/seat-claim.js";
import { forgetFrames } from "./frames.js";

/**
 * Goodies (lib/goodies.ts): the points balance and its redemption.
 *
 * No cache. The page is read on a visit, not on every request, and its
 * reads are indexed lookups on the account's own rows: ProblemSolve and
 * SqlSolve by their (userId, …) unique keys, the rest by userId. The one
 * that grows is ProblemSolve — one short row per problem solved, bounded by
 * the catalogue (~1,600) — and only the difficulty comes back with it.
 */

export interface GoodieView extends Goodie {
  /** Why it cannot be redeemed now, as a sentence; null = it can. */
  refusal: string | null;
}

/**
 * A profile-picture frame bought with points (lib/frames.ts FRAME_GOODIES):
 * redeemed like a goodie, but it adds no credits — `owned` instead, once.
 */
export interface FrameGoodieView {
  id: string;
  name: string;
  blurb: string;
  points: number;
  owned: boolean;
  /** Why it cannot be bought now; null = it can (or it is owned). */
  refusal: string | null;
}

export interface RedemptionRow {
  id: string;
  itemId: string;
  name: string;
  points: number;
  credits: number;
  createdAt: Date;
}

export interface GoodiesPage {
  points: PointsBalance;
  credits: number;
  items: GoodieView[];
  /** The frames for sale, after the credits. */
  frames: FrameGoodieView[];
  redemptions: RedemptionRow[];
  /** While every limit is lifted (lib/plans FREE_FOR_ALL_UNTIL), credits wait in the wallet; the page says so. */
  freeForAll: FreeForAll;
}

/** The newest redemptions the page lists. The balance counts every one; the list does not need to. */
const HISTORY_LIMIT = 20;

/** How long a redemption without its grant still holds its points (see balanceOf). A redeem takes well under a second. */
const IN_FLIGHT_MS = 5 * 60_000;

/**
 * A frame's redemption is paid by a grantId that names the frame and the
 * account instead of a CreditGrant (a frame is not credits). The column is
 * unique, so of two purchases of one frame racing past the balance check
 * only one can be stamped; the other is taken back (see redeem).
 */
const frameGrantKey = (userId: string, frameId: string) => `frame:${frameId}:${userId}`;

/** A frame as the redemption path prices it: a goodie that adds no credits. */
const asGoodie = (f: FrameGoodie): Goodie => ({ id: f.id, name: f.name, blurb: f.blurb, points: f.points, credits: 0 });

/** The frames this account has bought. */
async function ownedFrames(userId: string): Promise<Set<string>> {
  const rows = await prisma.redemption.findMany({ where: { userId, itemId: { in: FRAME_GOODIES.map((g) => g.id) }, grantId: { not: null } }, select: { itemId: true } });
  return new Set(rows.map((r) => r.itemId));
}

/** The rows that hold points: paid ones, and ones still in flight. A getter, because "in flight" is relative to now. */
const LIVE_WHERE = () => ({ OR: [{ grantId: { not: null } }, { createdAt: { gt: new Date(Date.now() - IN_FLIGHT_MS) } }] });

async function balanceOf(userId: string): Promise<PointsBalance> {
  const [coding, sql, chests, credentials, tracks, spent] = await Promise.all([
    prisma.problemSolve.findMany({ where: { userId }, select: { problem: { select: { difficulty: true } } } }),
    prisma.sqlSolve.findMany({ where: { userId }, select: { slug: true } }),
    prisma.roadmapReward.findMany({ where: { userId }, select: { xp: true } }),
    prisma.skillCredential.findMany({ where: { userId, revokedAt: null }, select: { level: true } }),
    prisma.studyEnrollment.count({ where: { userId, completedAt: { not: null } } }),
    // A paid row, or one still in flight. A row whose grant never came — the
    // process died between the check and the grant — stops holding the
    // points after IN_FLIGHT_MS rather than costing them for good.
    prisma.redemption.aggregate({ where: { userId, ...LIVE_WHERE() }, _sum: { points: true } }),
  ]);
  return pointsOf({
    codingSolves: coding.map((s) => s.problem.difficulty),
    // A slug the module no longer ships pays nothing — the same rule as `stats.sqlSolved`.
    sqlSolves: sql.flatMap((s) => {
      const spec = sqlProblem(s.slug);
      return spec ? [spec.difficulty] : [];
    }),
    chests: chests.map((c) => c.xp),
    credentials: credentials.map((c) => CREDENTIAL_XP[c.level as keyof typeof CREDENTIAL_XP] ?? 0),
    tracks: Array.from({ length: tracks }, () => TRACK_BONUS_XP),
    spent: spent._sum.points ?? 0,
  });
}

async function standingOf(userId: string): Promise<{ emailVerified: boolean; createdAt: Date } | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, createdAt: true } });
  return user ? { emailVerified: user.emailVerified !== null, createdAt: user.createdAt } : null;
}

export async function goodiesPage(userId: string): Promise<GoodiesPage | null> {
  const [points, credits, standing, owned, rows] = await Promise.all([
    balanceOf(userId),
    creditBalance(userId),
    standingOf(userId),
    ownedFrames(userId),
    prisma.redemption.findMany({
      // A row without its grant is a redemption being taken back (see redeem), never one that paid.
      where: { userId, grantId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
      select: { id: true, itemId: true, points: true, credits: true, createdAt: true },
    }),
  ]);
  if (!standing) return null;
  return {
    points,
    credits,
    items: GOODIES.map((item) => ({ ...item, refusal: redeemRefusal({ ...standing, balance: points.balance, item }) })),
    frames: FRAME_GOODIES.map((f) => ({
      id: f.id,
      name: f.name,
      blurb: f.blurb,
      points: f.points,
      owned: owned.has(f.id),
      refusal: owned.has(f.id) ? null : redeemRefusal({ ...standing, balance: points.balance, item: asGoodie(f) }),
    })),
    redemptions: rows.map((r) => ({ ...r, name: goodieFor(r.itemId)?.name ?? frameGoodieFor(r.itemId)?.name ?? r.itemId })),
    freeForAll: freeForAll(),
  };
}

export type RedeemOutcome =
  | { ok: true; redemption: RedemptionRow; balance: number; credits: number }
  | { ok: false; status: 404 | 409; error: string };

/**
 * Redeem `itemId` for the account: automatic, by the owner's call.
 *
 * "Write, then count, then undo if it does not fit" — services/credits'
 * spend pattern — rather than a lock on the User row: the Redemption row is
 * written first, then the account's live rows are read in a fixed order
 * (createdAt, id) and this row keeps its points only if everything up to and
 * including it fits what was earned. Rows after it are not charged to it;
 * each of them runs the same check and sees this one ahead. So of two
 * requests racing for the last points (a double-click), exactly the earlier
 * pays and the later is refused — the plain "both undo" version refused both,
 * measured in scratch/goodies-smoke.mts.
 *
 * The grant is written after the check, not with the row: a grant that
 * existed before the check could be spent in the moment before it was
 * taken back. If the grant's write fails, the row goes too, so a failure
 * anywhere leaves nothing spent.
 */
export async function redeem(userId: string, itemId: unknown): Promise<RedeemOutcome> {
  const frame = frameGoodieFor(itemId);
  const item = goodieFor(itemId) ?? (frame ? asGoodie(frame) : null);
  if (!item) return { ok: false, status: 404, error: "That goodie does not exist." };
  const ALREADY_OWNED = "You already own this frame — wear it from your profile.";
  if (frame && (await ownedFrames(userId)).has(frame.id)) return { ok: false, status: 409, error: ALREADY_OWNED };

  const [standing, before] = await Promise.all([standingOf(userId), balanceOf(userId)]);
  if (!standing) return { ok: false, status: 404, error: "Account not found." };
  const refusal = redeemRefusal({ ...standing, balance: before.balance, item });
  if (refusal) return { ok: false, status: 409, error: refusal };

  const row = await prisma.redemption.create({
    data: { userId, itemId: item.id, points: item.points, credits: item.credits },
    select: { id: true, createdAt: true },
  });

  const [after, live] = await Promise.all([
    balanceOf(userId),
    prisma.redemption.findMany({
      where: { userId, ...LIVE_WHERE() },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, points: true },
    }),
  ]);
  let ahead = 0;
  for (const r of live) {
    ahead += r.points;
    if (r.id === row.id) break;
  }
  if (ahead > after.earned) {
    await prisma.redemption.deleteMany({ where: { id: row.id } });
    return { ok: false, status: 409, error: "Not enough points for this any more — check your balance and try again." };
  }

  if (frame) {
    try {
      await prisma.redemption.update({ where: { id: row.id }, data: { grantId: frameGrantKey(userId, frame.id) }, select: { id: true } });
    } catch (err) {
      await prisma.redemption.deleteMany({ where: { id: row.id } }).catch(() => undefined);
      if (isDuplicateKey(err)) return { ok: false, status: 409, error: ALREADY_OWNED };
      throw err;
    }
    forgetFrames(userId);
    trackServerEvent("goodie_redeemed", { item: item.id, points: item.points, credits: 0 }, userId);
    return {
      ok: true,
      redemption: { id: row.id, itemId: item.id, name: item.name, points: item.points, credits: 0, createdAt: row.createdAt },
      balance: Math.max(0, after.earned - after.spent),
      credits: await creditBalance(userId),
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const grant = await tx.creditGrant.create({ data: { userId, credits: item.credits, source: "goodies" }, select: { id: true } });
      await tx.redemption.update({ where: { id: row.id }, data: { grantId: grant.id }, select: { id: true } });
    });
  } catch (err) {
    await prisma.redemption.deleteMany({ where: { id: row.id } }).catch(() => undefined);
    throw err;
  }

  trackServerEvent("goodie_redeemed", { item: item.id, points: item.points, credits: item.credits }, userId);
  return {
    ok: true,
    redemption: { id: row.id, itemId: item.id, name: item.name, points: item.points, credits: item.credits, createdAt: row.createdAt },
    balance: Math.max(0, after.earned - after.spent),
    credits: await creditBalance(userId),
  };
}

import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import type { MeteredAction } from "../lib/plans.js";

/**
 * The credit wallet (lib/plans CREDIT_PACKS / CREDIT_COSTS).
 *
 * Derived like every quota in services/entitlements: the balance is the sum
 * of the account's `CreditGrant` rows less the sum of its `CreditSpend`
 * rows. No balance column — a counter beside the ledger is a second truth,
 * and the bugs in that class all end with someone charged for, or refused,
 * something the ledger says did not happen.
 *
 * Spending is "write, then count, then undo if it does not fit" — the
 * pattern satRoundFits uses for the last interview slot — rather than a
 * lock on the User row: two spends racing for the last credits both write,
 * both see the total below zero and the later one is taken back. A lock on
 * the user's row was removed from the mock-test start for being a mutex
 * every other write to that user waited on (routes/mock-tests.ts).
 */

/** An id for a row created on credits, minted before the row so the spend can name it. */
export function newMeteredId(): string {
  return `c${crypto.randomBytes(12).toString("hex")}`;
}

export async function creditBalance(userId: string): Promise<number> {
  const [granted, spent] = await Promise.all([
    prisma.creditGrant.aggregate({ where: { userId }, _sum: { credits: true } }),
    prisma.creditSpend.aggregate({ where: { userId }, _sum: { credits: true } }),
  ]);
  return Math.max(0, (granted._sum.credits ?? 0) - (spent._sum.credits ?? 0));
}

const isDuplicateKey = (err: unknown) => (err as { code?: string })?.code === "P2002";

/**
 * Charge `credits` for one use of `action`, the use being the row `ref`.
 * True when charged (or already charged for this very ref — a retried
 * request is not charged twice); false when the balance does not cover it,
 * in which case nothing is left behind.
 */
export async function spendCredits(userId: string, action: MeteredAction, ref: string, credits: number): Promise<boolean> {
  let spendId: string;
  try {
    const row = await prisma.creditSpend.create({ data: { userId, action, ref, credits }, select: { id: true } });
    spendId = row.id;
  } catch (err) {
    if (isDuplicateKey(err)) return true;
    throw err;
  }
  const [granted, spent] = await Promise.all([
    prisma.creditGrant.aggregate({ where: { userId }, _sum: { credits: true } }),
    prisma.creditSpend.aggregate({ where: { userId }, _sum: { credits: true } }),
  ]);
  if ((spent._sum.credits ?? 0) <= (granted._sum.credits ?? 0)) return true;
  await prisma.creditSpend.deleteMany({ where: { id: spendId } });
  return false;
}

/** Give back a charge whose use never came to exist (the row's create failed, or an existing row was handed back). */
export async function refundSpend(action: MeteredAction, ref: string): Promise<void> {
  await prisma.creditSpend.deleteMany({ where: { action, ref } });
}

/** The refs of `action` uses paid with credits since `since` — the plan's window skips them. */
export async function creditRefsSince(userId: string, action: MeteredAction, since: Date): Promise<Set<string>> {
  // A spend is written at (or just before) its row, so a day's slack keeps
  // a row at the window's edge from being counted against the plan.
  const rows = await prisma.creditSpend.findMany({
    where: { userId, action, createdAt: { gte: new Date(since.getTime() - 86_400_000) } },
    select: { ref: true },
  });
  return new Set(rows.map((r) => r.ref));
}

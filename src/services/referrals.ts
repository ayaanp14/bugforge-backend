import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { isDuplicateKey } from "../lib/seat-claim.js";
import { emailVerificationRequired } from "../lib/auth-mail.js";
import { freeForAll, type FreeForAll } from "../lib/plans.js";
import { trackServerEvent } from "../lib/telemetry.js";
import {
  CLAIM_WINDOW_DAYS,
  REFERRAL_CAP,
  REFERRAL_REWARDS,
  claimRefusal,
  inviterName,
  mailboxKey,
  nextSlotAt,
  normalizeReferralCode,
  randomReferralCode,
  rewardSplit,
  rewardsInWindow,
  type WithheldReason,
} from "../lib/referrals.js";
import { USERNAME_RE } from "../lib/identity.js";
import { createNotification } from "./notifications.js";

/**
 * Invite links (lib/referrals.ts holds the rules and why): the member's code,
 * the invite page's figures, a new account counted as invited, and the
 * payout on that account's first solve.
 *
 * No cache. /invite is read on a visit; its reads are the account's own
 * rows by indexed keys (ReferralCode by userId, Referral by referrerId), and
 * the list is capped at FRIENDS_LIMIT. The one call on a hot path is
 * `rewardReferral` after a first solve, which is a primary-key read that
 * finds nothing for almost every account and stops there.
 */

export interface RewardTerms {
  referrer: number;
  invitee: number;
  cap: { rewards: number; days: number };
  claimWindowDays: number;
}

const TERMS: RewardTerms = {
  referrer: REFERRAL_REWARDS.referrer,
  invitee: REFERRAL_REWARDS.invitee,
  cap: { rewards: REFERRAL_CAP.rewards, days: REFERRAL_CAP.days },
  claimWindowDays: CLAIM_WINDOW_DAYS,
};

/** The newest invitees /invite lists. The figures count every one. */
const FRIENDS_LIMIT = 50;

/* ── the code ──────────────────────────────────────────────────────── */

/**
 * The member's code, made on first ask: their username when it is free as a
 * code (it is, unless someone who once held the name made a link with it),
 * else a random one. A duplicate key on the code means "taken, try another";
 * on the userId it means a second request made it first — read that one.
 */
async function ensureCode(userId: string, username: string | null): Promise<string> {
  const existing = await prisma.referralCode.findUnique({ where: { userId }, select: { code: true } });
  if (existing) return existing.code;
  const candidates = [
    ...(username && USERNAME_RE.test(username) ? [username] : []),
    ...Array.from({ length: 5 }, () => randomReferralCode(crypto.randomBytes(8))),
  ];
  for (const code of candidates) {
    try {
      await prisma.referralCode.create({ data: { code, userId }, select: { code: true } });
      return code;
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
      const mine = await prisma.referralCode.findUnique({ where: { userId }, select: { code: true } });
      if (mine) return mine.code;
    }
  }
  throw new Error("referral code: no free code after six tries");
}

/* ── the invite page ───────────────────────────────────────────────── */

export interface FriendRow {
  name: string;
  joinedAt: Date;
  rewardedAt: Date | null;
  /** What this invite paid the member — 0 while waiting, or when the cap or a repeated inbox held it back. */
  credits: number;
}

export interface InvitePage {
  code: string;
  /** The link's path; the client puts its own origin in front. */
  path: string;
  terms: RewardTerms;
  joined: number;
  rewarded: number;
  /** Credits these invites have paid the member, in all. */
  creditsEarned: number;
  /** Paid rewards in the cap's window, and when the next slot frees if it is full. */
  window: { used: number; nextSlotAt: Date | null };
  friends: FriendRow[];
  /** Who invited this account, when someone did. */
  invitedBy: { name: string; rewardedAt: Date | null; credits: number } | null;
  freeForAll: FreeForAll;
}

const PERSON = { name: true, username: true, profileHidden: true } as const;

export async function invitePage(userId: string): Promise<InvitePage | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (!user) return null;
  const [code, joined, rewarded, earned, paid, friends, invitedBy] = await Promise.all([
    ensureCode(userId, user.username),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, rewardedAt: { not: null } } }),
    prisma.referral.aggregate({ where: { referrerId: userId }, _sum: { referrerCredits: true } }),
    prisma.referral.findMany({
      where: { referrerId: userId, referrerCredits: { gt: 0 }, rewardedAt: { gt: new Date(Date.now() - REFERRAL_CAP.days * 86_400_000) } },
      select: { rewardedAt: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: FRIENDS_LIMIT,
      select: { createdAt: true, rewardedAt: true, referrerCredits: true, invitee: { select: PERSON } },
    }),
    prisma.referral.findUnique({ where: { inviteeId: userId }, select: { rewardedAt: true, inviteeCredits: true, referrer: { select: PERSON } } }),
  ]);
  const paidAt = paid.flatMap((p) => (p.rewardedAt ? [p.rewardedAt] : []));
  return {
    code,
    path: `/r/${code}`,
    terms: TERMS,
    joined,
    rewarded,
    creditsEarned: earned._sum.referrerCredits ?? 0,
    window: { used: rewardsInWindow(paidAt), nextSlotAt: nextSlotAt(paidAt) },
    friends: friends.map((f) => ({
      // The member invited them, but a hidden profile stays hidden here too.
      name: f.invitee.profileHidden ? "A friend" : f.invitee.name?.trim() || f.invitee.username || "A friend",
      joinedAt: f.createdAt,
      rewardedAt: f.rewardedAt,
      credits: f.referrerCredits,
    })),
    invitedBy: invitedBy ? { name: inviterName(invitedBy.referrer), rewardedAt: invitedBy.rewardedAt, credits: invitedBy.inviteeCredits } : null,
    freeForAll: freeForAll(),
  };
}

/* ── what a link shows before sign-up ──────────────────────────────── */

export interface InvitePreview {
  code: string;
  inviter: string;
  terms: RewardTerms;
}

/** /r/<code> for anyone: who sent it and what it pays. Null for a code nobody holds. */
export async function previewInvite(raw: unknown): Promise<InvitePreview | null> {
  const code = normalizeReferralCode(raw);
  if (!code) return null;
  const row = await prisma.referralCode.findUnique({ where: { code }, select: { user: { select: PERSON } } });
  return row ? { code, inviter: inviterName(row.user), terms: TERMS } : null;
}

/* ── counting a new account as invited ─────────────────────────────── */

export type ClaimOutcome =
  | { ok: true; inviter: string; terms: RewardTerms; rewarded: boolean }
  | { ok: false; status: 404 | 409; error: string };

/**
 * The SPA sends the code it kept from /r/<code> once the new account holds a
 * session (lib/referral.ts there) — one path for a password sign-up and a
 * Google or GitHub one, whose redirect would otherwise have to carry it.
 */
export async function claimInvite(userId: string, raw: unknown): Promise<ClaimOutcome> {
  const code = normalizeReferralCode(raw);
  const owner = code ? await prisma.referralCode.findUnique({ where: { code }, select: { userId: true, user: { select: { ...PERSON, email: true } } } }) : null;
  if (!code || !owner) return { ok: false, status: 404, error: "That invite link doesn't work." };

  const [invitee, alreadyInvited, coding, sql] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true, email: true, name: true, username: true, profileHidden: true } }),
    prisma.referral.findUnique({ where: { inviteeId: userId }, select: { inviteeId: true } }),
    prisma.problemSolve.findFirst({ where: { userId }, select: { id: true } }),
    prisma.sqlSolve.findFirst({ where: { userId }, select: { id: true } }),
  ]);
  if (!invitee) return { ok: false, status: 404, error: "Account not found." };
  const refusal = claimRefusal({
    inviteeId: userId,
    referrerId: owner.userId,
    accountCreatedAt: invitee.createdAt,
    alreadyInvited: alreadyInvited !== null,
    hasSolved: coding !== null || sql !== null,
    inviteeEmail: invitee.email,
    referrerEmail: owner.user.email,
  });
  if (refusal) return { ok: false, ...refusal };

  try {
    await prisma.referral.create({ data: { inviteeId: userId, referrerId: owner.userId, code }, select: { inviteeId: true } });
  } catch (err) {
    // Two tabs claiming at once: the primary key let one in.
    if (isDuplicateKey(err)) return { ok: false, status: 409, error: "Your account already joined from an invite." };
    throw err;
  }

  const name = invitee.profileHidden ? "A friend" : invitee.name?.trim() || invitee.username || "A friend";
  void createNotification(owner.userId, {
    // Per invitee, so each friend is its own line and none repeats.
    type: `referral_joined:${userId}`,
    title: `${name} joined from your invite`,
    body: `When they solve their first problem, you get ${REFERRAL_REWARDS.referrer} credits and they get ${REFERRAL_REWARDS.invitee}.`,
    href: "/invite",
  });
  trackServerEvent("referral_joined", { code }, userId);
  return { ok: true, inviter: inviterName(owner.user), terms: TERMS, rewarded: false };
}

/* ── the payout ────────────────────────────────────────────────────── */

const WITHHELD_LINE: Record<WithheldReason, string> = {
  cap: `You've had ${REFERRAL_CAP.rewards} invite rewards in the last ${REFERRAL_CAP.days} days, so this one paid them but not you.`,
  mailbox: "That email inbox was already counted for one of your invites, so this one paid them but not you.",
};

/**
 * After a first accepted solve (routes/execution.ts, routes/sql.ts): pay the
 * invite this account joined from, if it has one and it has not paid yet.
 * Fire and forget — the solve has already been answered — and safe to call
 * on every first solve: the flip of `rewardedAt` from null is the claim, in
 * one transaction with both grants, so however many solves race here the
 * invite pays once, and a failure leaves it unpaid for the next solve to
 * settle.
 */
export async function rewardReferral(inviteeId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { inviteeId },
    select: { referrerId: true, rewardedAt: true, invitee: { select: { email: true, emailVerified: true, name: true, username: true, profileHidden: true } } },
  });
  if (!referral || referral.rewardedAt) return;
  // A password account cannot sign in, let alone solve, before confirming its
  // address; this is the same rule kept where the money is.
  if (emailVerificationRequired() && !referral.invitee.emailVerified) return;

  const [referrer, earlier] = await Promise.all([
    prisma.user.findUnique({ where: { id: referral.referrerId }, select: { email: true } }),
    prisma.referral.findMany({
      where: { referrerId: referral.referrerId, rewardedAt: { not: null } },
      select: { rewardedAt: true, referrerCredits: true, invitee: { select: { email: true } } },
    }),
  ]);
  if (!referrer) return;
  const known = new Set<string>();
  const own = mailboxKey(referrer.email);
  if (own) known.add(own);
  for (const r of earlier) {
    const box = r.referrerCredits > 0 ? mailboxKey(r.invitee.email) : null;
    if (box) known.add(box);
  }
  const split = rewardSplit({
    referrerPaidAt: earlier.flatMap((r) => (r.rewardedAt && r.referrerCredits > 0 ? [r.rewardedAt] : [])),
    knownMailboxes: known,
    inviteeEmail: referral.invitee.email,
  });

  const paid = await prisma.$transaction(async (tx) => {
    const flipped = await tx.referral.updateMany({
      where: { inviteeId, rewardedAt: null },
      data: { rewardedAt: new Date(), referrerCredits: split.referrerCredits, inviteeCredits: split.inviteeCredits },
    });
    if (flipped.count !== 1) return false;
    await tx.creditGrant.createMany({
      data: [
        { userId: inviteeId, credits: split.inviteeCredits, source: "referral" },
        ...(split.referrerCredits > 0 ? [{ userId: referral.referrerId, credits: split.referrerCredits, source: "referral" }] : []),
      ],
    });
    return true;
  });
  if (!paid) return;

  const name = referral.invitee.profileHidden ? "A friend" : referral.invitee.name?.trim() || referral.invitee.username || "A friend";
  void createNotification(referral.referrerId, {
    type: `referral_rewarded:${inviteeId}`,
    title: split.referrerCredits > 0 ? `${name} solved their first problem — +${split.referrerCredits} credits` : `${name} solved their first problem`,
    body: split.withheld ? WITHHELD_LINE[split.withheld] : `Your invite paid you ${split.referrerCredits} credits and them ${split.inviteeCredits}. Thanks for bringing them.`,
    href: "/invite",
  });
  void createNotification(inviteeId, {
    type: "referral_welcome_credits",
    title: `+${split.inviteeCredits} credits for joining from an invite`,
    body: "They're in your wallet for an extra mock test or interview, and they never expire.",
    href: "/invite",
  });
  trackServerEvent("referral_rewarded", { referrerCredits: split.referrerCredits, inviteeCredits: split.inviteeCredits, withheld: split.withheld }, inviteeId);
}

/* ── the account's own data ────────────────────────────────────────── */

/** For GET /api/me/export: the member's code, the invites they sent and the one they joined from — names only, never anyone's address. */
export async function referralExport(userId: string) {
  const [code, sent, joinedFrom] = await Promise.all([
    prisma.referralCode.findUnique({ where: { userId }, select: { code: true, createdAt: true } }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, rewardedAt: true, referrerCredits: true },
    }),
    prisma.referral.findUnique({ where: { inviteeId: userId }, select: { code: true, createdAt: true, rewardedAt: true, inviteeCredits: true } }),
  ]);
  return {
    code: code?.code ?? null,
    codeCreatedAt: code?.createdAt ?? null,
    invitesSent: sent.map((s) => ({ joinedAt: s.createdAt, rewardedAt: s.rewardedAt, creditsToYou: s.referrerCredits })),
    joinedFrom: joinedFrom ? { code: joinedFrom.code, joinedAt: joinedFrom.createdAt, rewardedAt: joinedFrom.rewardedAt, creditsToYou: joinedFrom.inviteeCredits } : null,
  };
}

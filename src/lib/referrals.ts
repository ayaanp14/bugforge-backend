/**
 * Invite links: a member shares codekairo.com/r/<code>; a friend who signs
 * up from it and solves a first problem pays both of them credits.
 *
 * The owner's call (2026-11-17): college WhatsApp groups are the channel that
 * brings students, and no free automation reaches them, so the members carry
 * the link. What it pays is credits in the wallet (services/credits), not
 * XP: XP is also the rank, and an invite is no evidence of skill.
 *
 * **When it pays.** On the invitee's first accepted solve — coding or SQL,
 * both judged server-side — not on sign-up. A sign-up costs a stranger an
 * email address; a judged solve costs a real attempt, which is what makes a
 * farm of fake invitees slow (the goodies rule: only what the server decided
 * counts). The invitee is paid whatever happens; the referrer's side is capped
 * at REFERRAL_CAP rewards in any 30 days, and is withheld when the invitee's
 * mailbox is the referrer's own or one an earlier invitee of theirs already
 * used (`mailboxKey`: Gmail ignores dots and everyone delivers +tags, so
 * "a.b+2@gmail.com" is the same inbox as "ab@gmail.com").
 *
 * **When an invite counts.** The account must be new (CLAIM_WINDOW_DAYS since
 * it was made), never invited before, not the inviter, and without a solve
 * yet — an invite is a reason to start, and an account that had already
 * started was not brought by it.
 *
 * Pure: services/referrals.ts reads the rows and writes the outcome.
 */

/** Credits paid on the invitee's first solve. Sized to one use each (lib/plans CREDIT_COSTS: voice interview 40, placement mock 20). */
export const REFERRAL_REWARDS = { referrer: 40, invitee: 20 } as const;

/** The referrer is paid for at most this many invites in any `days`-long window. A brake on farming, not on sharing: invites past it still pay the friend. */
export const REFERRAL_CAP = { rewards: 10, days: 30 } as const;

/** How long after sign-up an account may still be counted as invited. Covers a password account confirming its email days later. */
export const CLAIM_WINDOW_DAYS = 7;

/** A code as it appears in /r/<code>: a username (3–20 of [a-z0-9_]) or a random one. */
export const REFERRAL_CODE_RE = /^[a-z0-9_]{3,24}$/;

const DAY_MS = 86_400_000;

/** The code a link or a request carries, lower-cased and trimmed; null when it cannot be one. */
export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase();
  return REFERRAL_CODE_RE.test(code) ? code : null;
}

/** Letters and digits that cannot be misread for one another (no 0/o, 1/l/i, u/v). */
const CODE_ALPHABET = "abcdefghjkmnpqrstwxyz23456789";

/** A random 8-character code from `bytes` (at least 8 of them): for a member with no username, or whose username is taken as a code. */
export function randomReferralCode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

const GMAIL = new Set(["gmail.com", "googlemail.com"]);

/**
 * The inbox an address delivers to, as far as can be told from the address:
 * lower-cased, a "+tag" dropped, and for Gmail the dots in the name too.
 * Null for something that is not an address.
 */
export function mailboxKey(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  let name = email.slice(0, at).trim().toLowerCase();
  let domain = email.slice(at + 1).trim().toLowerCase();
  const plus = name.indexOf("+");
  if (plus >= 0) name = name.slice(0, plus);
  if (GMAIL.has(domain)) {
    name = name.replace(/\./g, "");
    domain = "gmail.com";
  }
  return name ? `${name}@${domain}` : null;
}

export interface ClaimFacts {
  inviteeId: string;
  referrerId: string;
  accountCreatedAt: Date;
  /** The account already has a Referral row. */
  alreadyInvited: boolean;
  /** The account already has a first solve (coding or SQL). */
  hasSolved: boolean;
  inviteeEmail: string | null;
  referrerEmail: string | null;
  now?: Date;
}

export interface Refusal {
  status: 409;
  error: string;
}

/** Why this account cannot be counted as invited by this code, as a sentence — or null when it can. */
export function claimRefusal(f: ClaimFacts): Refusal | null {
  const now = f.now ?? new Date();
  const mine = mailboxKey(f.inviteeEmail);
  if (f.inviteeId === f.referrerId || (mine !== null && mine === mailboxKey(f.referrerEmail))) {
    return { status: 409, error: "That's your own invite link — share it with a friend instead." };
  }
  if (f.alreadyInvited) return { status: 409, error: "Your account already joined from an invite." };
  if (now.getTime() - f.accountCreatedAt.getTime() > CLAIM_WINDOW_DAYS * DAY_MS) {
    return { status: 409, error: `Invites count for accounts in their first ${CLAIM_WINDOW_DAYS} days.` };
  }
  if (f.hasSolved) return { status: 409, error: "Invites count for accounts that haven't solved a problem yet." };
  return null;
}

export interface RewardFacts {
  /** When each of the referrer's paid rewards (referrerCredits > 0) was paid. */
  referrerPaidAt: readonly Date[];
  /** Mailbox keys of the referrer and of the invitees they were already paid for. */
  knownMailboxes: ReadonlySet<string>;
  inviteeEmail: string | null;
  now?: Date;
}

export type WithheldReason = "cap" | "mailbox";

export interface RewardSplit {
  referrerCredits: number;
  inviteeCredits: number;
  /** Why the referrer's side is 0, when it is. */
  withheld: WithheldReason | null;
}

/** The rewards in the cap's window ending `now`. */
export function rewardsInWindow(paidAt: readonly Date[], now: Date = new Date()): number {
  const since = now.getTime() - REFERRAL_CAP.days * DAY_MS;
  return paidAt.filter((d) => d.getTime() > since).length;
}

/**
 * What each side is paid for one invitee's first solve. The cap is soft at
 * its edge: two invitees solving in the same instant can both pay the 10th
 * reward, which is one invite's credits once, not a way through it.
 */
export function rewardSplit(f: RewardFacts): RewardSplit {
  const inviteeCredits = REFERRAL_REWARDS.invitee;
  const box = mailboxKey(f.inviteeEmail);
  if (box !== null && f.knownMailboxes.has(box)) return { referrerCredits: 0, inviteeCredits, withheld: "mailbox" };
  if (rewardsInWindow(f.referrerPaidAt, f.now) >= REFERRAL_CAP.rewards) return { referrerCredits: 0, inviteeCredits, withheld: "cap" };
  return { referrerCredits: REFERRAL_REWARDS.referrer, inviteeCredits, withheld: null };
}

/** When the next reward slot frees, for a referrer at the cap; null when one is free now. */
export function nextSlotAt(paidAt: readonly Date[], now: Date = new Date()): Date | null {
  const since = now.getTime() - REFERRAL_CAP.days * DAY_MS;
  const inWindow = paidAt.map((d) => d.getTime()).filter((t) => t > since).sort((a, b) => a - b);
  if (inWindow.length < REFERRAL_CAP.rewards) return null;
  // The oldest reward that keeps the window full leaves it first.
  return new Date(inWindow[inWindow.length - REFERRAL_CAP.rewards] + REFERRAL_CAP.days * DAY_MS);
}

/** The name an invite shows for its sender: their name, else the username, else a neutral phrase — never more than the profile already shows. */
export function inviterName(u: { name: string | null; username: string | null; profileHidden: boolean }): string {
  if (u.profileHidden) return "A CodeKairo member";
  return u.name?.trim() || u.username || "A CodeKairo member";
}

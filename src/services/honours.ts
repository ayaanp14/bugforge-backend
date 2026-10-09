import { prisma } from "../lib/prisma.js";
import { brevoConfigured, isReservedAddress, sendTransactional } from "../lib/brevo.js";
import { HONOURS, grantsLifetimeAccess, honourDef, type HonourShareAction } from "../lib/honours.js";
import { honourHtml, honourSubject, honourText } from "../lib/honour-mail.js";
import { invalidateMe } from "./me.js";
import { invalidateDashboard } from "./dashboard.js";
import { forgetPublicUser } from "./public-profile.js";

/**
 * Honours given by hand (lib/honours.ts has the why and the template).
 *
 * A grant is idempotent per (account, kind): granting again names the
 * account in the answer as already holding it and changes nothing — the
 * celebration does not replay, the mail is not resent unless asked for
 * (`resendMail`). Every reader of the frame reads `honours` off a cached
 * payload, so a grant drops the holder's /api/me, dashboard and public
 * profile; the community feeds catch up as their short caches turn.
 */

export interface GrantResult {
  /** The identifier as given. */
  who: string;
  status: "granted" | "already" | "not_found";
  userId?: string;
  username?: string | null;
  email?: string | null;
  /** Whether the honour mail was accepted this time; null when none was attempted. */
  mailed?: boolean | null;
}

function forgetHolder(userId: string): void {
  invalidateMe(userId);
  invalidateDashboard(userId);
  forgetPublicUser(userId);
}

/**
 * Sends the honour's mail to a holder and stamps `mailedAt` when the provider
 * took it. Never throws (lib/brevo); false with no key, a reserved address or
 * a refusal — the reason is in the log.
 */
export async function mailHonour(honourId: string): Promise<boolean> {
  const row = await prisma.honour.findUnique({
    where: { id: honourId },
    select: { id: true, kind: true, user: { select: { email: true, name: true, username: true } } },
  });
  const email = row?.user.email;
  if (!row || !email || isReservedAddress(email)) return false;
  if (!brevoConfigured()) {
    console.log(`[honours] mail for ${email} not sent (BREVO_API_KEY is not set)`);
    return false;
  }
  const person = { email, name: row.user.name, username: row.user.username };
  const sent = await sendTransactional({
    to: email,
    subject: honourSubject(row.kind, person),
    html: honourHtml(row.kind, person),
    text: honourText(row.kind, person),
    tags: ["honour", row.kind],
  });
  if (sent) await prisma.honour.update({ where: { id: row.id }, data: { mailedAt: new Date() } });
  return sent;
}

export async function grantHonour(
  kind: string,
  identifiers: string[],
  opts: { grantedBy: string; mail: boolean; resendMail?: boolean },
): Promise<GrantResult[]> {
  if (!honourDef(kind)) throw new Error(`Unknown honour "${kind}"`);
  const results: GrantResult[] = [];
  for (const who of identifiers) {
    const user = await prisma.user.findFirst({
      where: who.includes("@") ? { email: who } : { username: who },
      select: { id: true, username: true, email: true },
    });
    if (!user) {
      results.push({ who, status: "not_found" });
      continue;
    }
    const existing = await prisma.honour.findUnique({ where: { userId_kind: { userId: user.id, kind } }, select: { id: true, mailedAt: true } });
    const row = existing ?? (await prisma.honour.create({ data: { userId: user.id, kind, grantedBy: opts.grantedBy.slice(0, 191) }, select: { id: true, mailedAt: true } }));
    forgetHolder(user.id);
    // One at a time, not in parallel: Brevo's free plan is 300 a day and a
    // burst of a few dozen is fine, but the order of the log is worth keeping.
    const wantMail = opts.mail && (!row.mailedAt || opts.resendMail);
    const mailed = wantMail ? await mailHonour(row.id) : null;
    results.push({ who, status: existing ? "already" : "granted", userId: user.id, username: user.username, email: user.email, mailed });
  }
  return results;
}

export async function revokeHonour(id: string): Promise<boolean> {
  const row = await prisma.honour.findUnique({ where: { id }, select: { userId: true } });
  if (!row) return false;
  await prisma.honour.delete({ where: { id } });
  forgetHolder(row.userId);
  return true;
}

/** Whether the account holds an honour that lifts every quota (services/entitlements). */
export async function hasLifetimeAccess(userId: string): Promise<boolean> {
  const rows = await prisma.honour.findMany({ where: { userId }, select: { kind: true } });
  return grantsLifetimeAccess(rows.map((r) => r.kind));
}

/** The holder's own view: what the celebration needs, and nothing the admin keeps. */
export async function myHonours(userId: string) {
  const rows = await prisma.honour.findMany({
    where: { userId },
    orderBy: { grantedAt: "asc" },
    select: { kind: true, grantedAt: true, celebratedAt: true, linkedinPostAt: true, linkedinProfileAt: true },
  });
  const notes = rows.length
    ? await prisma.feedback.findMany({ where: { userId, kind: "honour" }, select: { path: true } })
    : [];
  const noted = new Set(notes.map((n) => n.path));
  return rows
    .filter((r) => honourDef(r.kind))
    .map((r) => ({
      kind: r.kind,
      grantedAt: r.grantedAt,
      celebrated: r.celebratedAt !== null,
      sharedOnLinkedIn: r.linkedinPostAt !== null || r.linkedinProfileAt !== null,
      feedbackGiven: noted.has(`honour:${r.kind}`),
    }));
}

/** The celebration opened: stamped once, the first time, on whichever device. */
export async function markCelebrated(userId: string, kind: string): Promise<boolean> {
  const { count } = await prisma.honour.updateMany({ where: { userId, kind, celebratedAt: null }, data: { celebratedAt: new Date() } });
  if (count) invalidateMe(userId);
  const held = count > 0 || (await prisma.honour.count({ where: { userId, kind } })) > 0;
  return held;
}

/** A LinkedIn click: the first one's time, and a running count. */
export async function recordHonourShare(userId: string, kind: string, action: HonourShareAction): Promise<boolean> {
  const now = new Date();
  const row = await prisma.honour.findUnique({ where: { userId_kind: { userId, kind } }, select: { id: true, linkedinPostAt: true, linkedinProfileAt: true } });
  if (!row) return false;
  await prisma.honour.update({
    where: { id: row.id },
    data:
      action === "linkedin_post"
        ? { linkedinPosts: { increment: 1 }, ...(row.linkedinPostAt ? {} : { linkedinPostAt: now }) }
        : { linkedinProfiles: { increment: 1 }, ...(row.linkedinProfileAt ? {} : { linkedinProfileAt: now }) },
  });
  return true;
}

/**
 * The holder's note from the celebration — a Feedback row of kind "honour"
 * (path `honour:<kind>`), so it sits in /admin's Feedback tab beside the
 * platform ratings. One per honour: sending again replaces the earlier note.
 */
export async function saveHonourFeedback(userId: string, kind: string, comment: string, rating: number | null) {
  const held = await prisma.honour.count({ where: { userId, kind } });
  if (!held) return null;
  const path = `honour:${kind}`;
  const existing = await prisma.feedback.findFirst({ where: { userId, kind: "honour", path }, select: { id: true } });
  return existing
    ? prisma.feedback.update({ where: { id: existing.id }, data: { comment, rating }, select: { id: true } })
    : prisma.feedback.create({ data: { userId, kind: "honour", path, comment, rating, tags: [] }, select: { id: true } });
}

/** The admin's view: every holder, what has happened since the grant, and their note. */
export async function adminHonours() {
  const rows = await prisma.honour.findMany({
    orderBy: { grantedAt: "desc" },
    take: 500,
    select: {
      id: true,
      kind: true,
      grantedAt: true,
      grantedBy: true,
      celebratedAt: true,
      mailedAt: true,
      linkedinPostAt: true,
      linkedinPosts: true,
      linkedinProfileAt: true,
      linkedinProfiles: true,
      user: { select: { id: true, name: true, username: true, email: true, avatar_url: true } },
    },
  });
  const notes = rows.length
    ? await prisma.feedback.findMany({
        where: { kind: "honour", userId: { in: [...new Set(rows.map((r) => r.user.id))] } },
        select: { userId: true, path: true, comment: true, rating: true, updatedAt: true },
      })
    : [];
  const noteOf = new Map(notes.map((n) => [`${n.userId}|${n.path}`, n]));
  return {
    kinds: Object.values(HONOURS).map((d) => ({ kind: d.kind, name: d.name })),
    holders: rows.map((r) => {
      const note = noteOf.get(`${r.user.id}|honour:${r.kind}`);
      return {
        ...r,
        name: honourDef(r.kind)?.name ?? r.kind,
        feedback: note ? { comment: note.comment, rating: note.rating, at: note.updatedAt } : null,
      };
    }),
  };
}

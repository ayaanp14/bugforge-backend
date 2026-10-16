import { prisma } from "../lib/prisma.js";
import { cachedShared, invalidate } from "../lib/cache.js";
import { firstName, summariseColleges, type CollegeSummary } from "../lib/social-proof.js";
import { experienceList } from "./interview-experiences.js";

/**
 * The landing page's social proof (GET /api/proof): only things that are
 * true and already public, so a first-time visitor can see that real
 * students use the site (the owner's ask, 2026-10-16).
 *
 *  - members: verified accounts — an unverified sign-up is not a member.
 *  - solvesThisWeek: first accepted solves of coding problems in the last
 *    seven days (ProblemSolve), the same "a solve counts once" rule the
 *    profile and the community bulletin use.
 *  - colleges: lib/social-proof's floor — named only at 3+ members.
 *  - results: members' own public interview experiences that ended
 *    "selected", newest first, from authors whose profile is not hidden.
 *  - quotes: platform feedback whose author ticked "you may quote this" AND
 *    an admin approved (routes/feedback.ts PATCH /:id/quote), signed with a
 *    first name and the college they typed.
 *
 * Hidden profiles and unverified accounts are left out of every list. One
 * composed payload, cached 10 minutes; a quote approval drops it.
 */
const KEY = "proof:v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RESULTS = 6;
const MAX_QUOTES = 6;

export interface SocialProof {
  members: number;
  solvesThisWeek: number;
  colleges: CollegeSummary;
  results: Array<{ company: string; role: string; year: number | null; path: string; by: string | null }>;
  quotes: Array<{ text: string; name: string; college: string | null; rating: number | null }>;
}

async function loadProof(): Promise<SocialProof> {
  const weekAgo = new Date(Date.now() - WEEK_MS);
  const visible = { emailVerified: { not: null }, profileHidden: false } as const;
  const [members, solvesThisWeek, colleges, selected, quotes] = await Promise.all([
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.problemSolve.count({ where: { submittedAt: { gte: weekAgo } } }),
    prisma.user.groupBy({ by: ["instituteName"], where: { ...visible, instituteName: { not: null } }, _count: { _all: true } }),
    experienceList({ outcome: "selected", take: 20 }),
    prisma.feedback.findMany({
      where: { kind: "platform", quoteConsent: true, quoteApprovedAt: { not: null }, comment: { not: null }, user: visible },
      orderBy: { quoteApprovedAt: "desc" },
      take: MAX_QUOTES,
      select: { comment: true, rating: true, user: { select: { name: true, username: true, instituteName: true } } },
    }),
  ]);

  // experienceList does not read profileHidden; drop hidden authors here.
  const authorIds = [...new Set(selected.rows.map((r) => r.author.id))];
  const hidden = new Set(
    authorIds.length
      ? (await prisma.user.findMany({ where: { id: { in: authorIds }, OR: [{ profileHidden: true }, { emailVerified: null }] }, select: { id: true } })).map((u) => u.id)
      : [],
  );

  return {
    members,
    solvesThisWeek,
    colleges: summariseColleges(colleges.map((c) => ({ name: c.instituteName ?? "", members: c._count._all }))),
    results: selected.rows
      .filter((r) => !hidden.has(r.author.id))
      .slice(0, MAX_RESULTS)
      .map((r) => ({ company: r.experience.company, role: r.experience.role, year: r.experience.year ?? null, path: r.path, by: firstName(r.author.name) ?? r.author.username })),
    quotes: quotes.flatMap((q) => {
      const name = firstName(q.user.name);
      return name && q.comment ? [{ text: q.comment, name, college: q.user.instituteName?.trim() || null, rating: q.rating }] : [];
    }),
  };
}

export function socialProof(): Promise<SocialProof> {
  return cachedShared(KEY, 600, loadProof);
}

export async function forgetSocialProof(): Promise<void> {
  invalidate(KEY);
}

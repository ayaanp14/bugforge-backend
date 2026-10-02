/**
 * Who is reading a Battles tournament, from the rows: the caller (signed
 * in or not, and whether they are a CodeKairo admin — routes/battles.ts
 * reads that off the session's email), and whether they manage the org
 * hosting it. The rules about what each role may read are pure and live
 * in battles-view-rules.ts.
 */
import { prisma } from "../lib/prisma.js";
import { viewerRole, type ViewedTournament, type ViewerRole } from "./battles-view-rules.js";

/** A signed-in caller; null for a visitor. */
export type BattlesViewer = { userId: string; isAdmin: boolean } | null;

const MANAGER_ROLES = ["owner", "admin"];

/** Whether this account manages the org (owner or admin member). */
export async function managesOrg(userId: string | null | undefined, orgId: string): Promise<boolean> {
  if (!userId) return false;
  const m = await prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId, userId } }, select: { role: true } });
  return !!m && MANAGER_ROLES.includes(m.role);
}

/** The caller's role to one tournament, given whether they play the thing being read. */
export async function roleOf(viewer: BattlesViewer, orgId: string, player: boolean): Promise<ViewerRole> {
  if (!viewer) return "spectator";
  // An admin who plays is a player; one who does not need not be looked up as an organizer.
  const organizer = player ? false : await managesOrg(viewer.userId, orgId);
  return viewerRole({ player, organizer, admin: viewer.isAdmin });
}

/** The tournament columns battles-view-rules reads, as a Prisma select (with the org's verification). */
export const VIEWED_TOURNAMENT_SELECT = {
  id: true,
  orgId: true,
  format: true,
  status: true,
  startsAt: true,
  durationMinutes: true,
  freezeMinutes: true,
  finishedAt: true,
  resultsRevealedAt: true,
  org: { select: { verifiedAt: true } },
} as const;

export function viewedTournament(t: {
  format: string;
  status: string;
  startsAt: Date;
  durationMinutes: number;
  freezeMinutes: number;
  finishedAt: Date | null;
  resultsRevealedAt: Date | null;
  org: { verifiedAt: Date | null };
}): ViewedTournament {
  return {
    format: t.format,
    status: t.status,
    startsAt: t.startsAt,
    durationMinutes: t.durationMinutes,
    freezeMinutes: t.freezeMinutes,
    finishedAt: t.finishedAt,
    resultsRevealedAt: t.resultsRevealedAt,
    orgVerified: t.org.verifiedAt !== null,
  };
}

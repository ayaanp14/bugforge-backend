/**
 * CodeKairo Battles (battles.codekairo.com): organizations, their
 * tournaments, and who is entered. The pure rules — eligibility, phases,
 * validation, the team list — are in battles-rules.ts; this file loads rows,
 * applies them and writes.
 *
 * Access: an org's owner and admins manage everything under it; anyone else
 * sees a tournament only once it is published by a verified org. A draft,
 * an edit waiting for the admin's approval (`review`), or anything of an
 * unverified org, answers 404 to outsiders — the same answer as a slug that
 * does not exist, so none is confirmed.
 *
 * Edits after the fact (user decision 2026-09-29): what players see is what a
 * person at CodeKairo checked. A verified org that edits its details goes back
 * to the verification queue, and its tournaments leave public view until it
 * is verified again; a published tournament that edits its settings goes to
 * `review`, hidden, until the admin approves the new version. Each keeps a
 * snapshot of what was last approved so the admin reads a diff, not the whole
 * thing again. A tournament can be deleted until it has run; after that only
 * cancelled, since its results are on players' profiles.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { newId } from "../lib/db-ids.js";
import { isDuplicateKey, withLockRetry } from "../lib/seat-claim.js";
import { uniqueSlug } from "../lib/slug.js";
import {
  LIMITS,
  ORG_KINDS,
  approveBlocker,
  deleteBlocker,
  describeOrg,
  describeTournament,
  isHiddenStatus,
  orgChanged,
  orgSnapshot,
  parseTeamList,
  publishBlocker,
  readTournamentFields,
  registrationDecision,
  tournamentChanged,
  tournamentPhase,
  tournamentSnapshot,
  type OrgKind,
  type OrgSnapshot,
  type TournamentFields,
  type TournamentSnapshot,
} from "./battles-rules.js";

import { BattlesError } from "./battles-error.js";
import { forgetBracket, knockoutViewer } from "./knockout.js";
import { forgetContest } from "./contest.js";
import { CHECK_IN_MINUTES } from "./knockout-rules.js";
import { forgetBattlesHeads, orgSeo, seoOf, tournamentSeo } from "./battles-seo.js";
import { offersReminder } from "./tournament-reminders.js";
import { cached, invalidate } from "../lib/cache.js";
import { invalidateDashboard } from "./dashboard.js";

export { BattlesError };

// ── What a write makes stale ───────────────────────────────────────────

/** The public list (listTournaments). */
const LIST_KEY = "battles:list:v1";

/**
 * Every cached read that a write to these tournaments' rows — settings,
 * status, visibility, their organizer's name or verification — makes stale:
 * the Worker's heads (battles-seo), the public list, an ICPC contest's row
 * (contest.ts) and a knockout's shared bracket (knockout.ts). One call at
 * every such write, drafts included: a draft is in no list, but its
 * organizers read its contest and bracket like anyone reads a public one.
 */
function forgetTournaments(tournaments: readonly { id: string; slug: string }[], org?: string): void {
  forgetBattlesHeads({ tournaments: tournaments.map((t) => t.slug), org });
  invalidate(LIST_KEY);
  for (const t of tournaments) {
    forgetContest(t.id);
    forgetBracket(t.id);
  }
}

/**
 * After entries change — a registration, a withdrawal, an organizer's
 * decision, a team list uploaded or a team removed: the entry counts on the
 * public list and the bracket, and each entrant's dashboard, whose
 * Tournaments slice lists their approved entries (tournament-record.ts) and
 * otherwise kept the old answer for the dashboard's five-minute TTL — a
 * player approved for a tournament did not see it on their profile.
 */
function forgetEntries(tournamentId: string, userIds: readonly string[]): void {
  invalidate(LIST_KEY);
  forgetBracket(tournamentId);
  for (const userId of userIds) invalidateDashboard(userId);
}

/** Unverified orgs one account may hold at once — a brake on throwaway orgs. */
const UNVERIFIED_ORGS_PER_USER = 3;
/** Slugs the site's own routes use. */
const RESERVED_SLUGS = new Set(["new", "edit", "manage", "admin"]);

const MANAGER_ROLES = ["owner", "admin"];

type Body = Record<string, unknown>;
const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

// ── Organizations ──────────────────────────────────────────────────────

const ORG_PUBLIC = { id: true, slug: true, name: true, kind: true, website: true, city: true, about: true, verifiedAt: true } satisfies Prisma.BattleOrgSelect;

function readOrgFields(body: Body, current?: { name: string; kind: string }) {
  const name = text(body["name"] ?? current?.name, 120);
  if (!name || name.length < 3) throw new BattlesError(400, "The organization's name must be at least 3 characters.");
  const kind = (body["kind"] ?? current?.kind) as OrgKind;
  if (!ORG_KINDS.includes(kind)) throw new BattlesError(400, "Choose what kind of organization this is.");
  const website = body["website"] === undefined ? undefined : text(body["website"], 300);
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) throw new BattlesError(400, "The website must be a full address, like https://college.edu.");
  return {
    name,
    kind,
    ...(website !== undefined ? { website } : {}),
    ...(body["city"] !== undefined ? { city: text(body["city"], 80) } : {}),
    ...(body["about"] !== undefined ? { about: text(body["about"], 4000) } : {}),
  };
}

export async function createOrg(userId: string, body: Body) {
  const fields = readOrgFields(body);
  const pending = await prisma.battleOrg.count({ where: { createdById: userId, verifiedAt: null } });
  if (pending >= UNVERIFIED_ORGS_PER_USER) {
    throw new BattlesError(429, `You have ${pending} organizations waiting for verification. Wait for those before adding another.`);
  }
  const slug = await uniqueSlug(fields.name, async (s) => !!(await prisma.battleOrg.findUnique({ where: { slug: s }, select: { id: true } })), RESERVED_SLUGS);
  return prisma.battleOrg.create({
    data: { ...fields, slug, createdById: userId, members: { create: { userId, role: "owner" } } },
    select: ORG_PUBLIC,
  });
}

/** The caller's role in the org, or a 404 — outsiders are not told it exists. */
async function requireOrgManager(userId: string, orgId: string): Promise<string> {
  const member = await prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId, userId } }, select: { role: true } });
  if (!member || !MANAGER_ROLES.includes(member.role)) throw new BattlesError(404, "No such organization.");
  return member.role;
}

/** A stored snapshot, or null for a row from before snapshots (or anything that is not one). */
const snapshotOf = <T>(json: Prisma.JsonValue | null): T | null => (json && typeof json === "object" && !Array.isArray(json) ? (json as T) : null);

/**
 * Edit an organization. A verified one that changes anything goes back to the
 * admin's queue — the badge was earned by the details the admin read, not
 * these — and until it is verified again its page and tournaments are hidden,
 * as for a new org. Refused while one of its tournaments is running: hiding a
 * live contest would lock its players out mid-round.
 */
export async function updateOrg(userId: string, orgId: string, body: Body) {
  await requireOrgManager(userId, orgId);
  const current = await prisma.battleOrg.findUniqueOrThrow({
    where: { id: orgId },
    select: { slug: true, name: true, kind: true, website: true, city: true, about: true, verifiedAt: true, verifiedSnapshot: true },
  });
  const fields = readOrgFields(body, current);
  const before = orgSnapshot(current);
  if (!orgChanged(before, orgSnapshot({ ...before, ...fields }))) {
    return prisma.battleOrg.findUniqueOrThrow({ where: { id: orgId }, select: ORG_PUBLIC });
  }
  if (!current.verifiedAt) {
    const org = await prisma.battleOrg.update({ where: { id: orgId }, data: fields, select: ORG_PUBLIC });
    // Public nowhere yet, but its managers read its contests and brackets, which carry its name.
    forgetTournaments(await prisma.tournament.findMany({ where: { orgId }, select: { id: true, slug: true } }), current.slug);
    return org;
  }

  const now = new Date();
  const started = await prisma.tournament.findMany({
    where: { orgId, status: "published", startsAt: { lte: now } },
    select: { status: true, format: true, registrationClosesAt: true, startsAt: true, durationMinutes: true, finishedAt: true },
  });
  if (started.some((t) => tournamentPhase(t, now) === "live")) {
    throw new BattlesError(409, "A tournament of this organization is running. Edit the organization after it ends — the change hides its tournaments until CodeKairo verifies it again.");
  }
  const org = await prisma.battleOrg.update({
    where: { id: orgId },
    // The snapshot is what was verified; an org verified before snapshots
    // existed was verified as it stood until now.
    data: { ...fields, verifiedAt: null, verifiedSnapshot: (snapshotOf<OrgSnapshot>(current.verifiedSnapshot) ?? before) as unknown as Prisma.InputJsonValue },
    select: ORG_PUBLIC,
  });
  forgetTournaments(await prisma.tournament.findMany({ where: { orgId }, select: { id: true, slug: true } }), current.slug);
  return org;
}

/** An org's public page: its details and its published tournaments (drafts too, for its managers). */
export async function orgPage(slug: string, viewerId: string | null) {
  const org = await prisma.battleOrg.findUnique({ where: { slug }, select: ORG_PUBLIC });
  if (!org) throw new BattlesError(404, "No such organization.");
  const listOf = (all: boolean) =>
    prisma.tournament.findMany({
      where: { orgId: org.id, ...(all ? {} : { status: "published" }) },
      orderBy: { startsAt: "desc" },
      take: 100,
      select: TOURNAMENT_CARD,
    });
  // The reader's role and a verified org's public list do not wait on each
  // other. Only a manager — the rare reader — also sees drafts, and reads
  // the list again for them; an unverified org shows nothing but to its
  // managers, so nothing is read for it on the chance.
  const [role, publicList] = await Promise.all([
    viewerId
      ? prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId: org.id, userId: viewerId } }, select: { role: true } }).then((m) => m?.role ?? null)
      : Promise.resolve(null),
    org.verifiedAt ? listOf(false) : Promise.resolve(null),
  ]);
  const manages = role !== null && MANAGER_ROLES.includes(role);
  if (!org.verifiedAt && !manages) throw new BattlesError(404, "No such organization.");
  const tournaments = manages || !publicList ? await listOf(true) : publicList;
  const now = new Date();
  // The page's head, from the published tournaments only (a manager also
  // sees drafts here, which are nobody else's business). services/battles-seo.
  return { org, role, tournaments: tournaments.map((t) => cardOf(t, now)), seo: seoOf(orgSeo(org, tournaments, now)) };
}

/** The host dashboard: every org the caller manages, with its tournaments. */
export async function hostDashboard(userId: string) {
  const memberships = await prisma.battleOrgMember.findMany({
    where: { userId, role: { in: MANAGER_ROLES } },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      org: { select: { ...ORG_PUBLIC, verifiedSnapshot: true, tournaments: { orderBy: { createdAt: "desc" }, take: 50, select: TOURNAMENT_CARD } } },
    },
  });
  const now = new Date();
  return {
    orgs: memberships.map(({ role, org: { tournaments, verifiedSnapshot, ...org } }) => ({
      ...org,
      role,
      // Verified before and not now: an edit (or a revocation) is waiting on the admin, and its tournaments are hidden.
      reverify: org.verifiedAt === null && verifiedSnapshot !== null,
      tournaments: tournaments.map((t) => cardOf(t, now)),
    })),
  };
}

// ── Tournaments ────────────────────────────────────────────────────────

const TOURNAMENT_CARD = {
  id: true,
  slug: true,
  title: true,
  format: true,
  status: true,
  teamSize: true,
  capacity: true,
  registrationClosesAt: true,
  startsAt: true,
  durationMinutes: true,
  finishedAt: true,
  org: { select: { slug: true, name: true, verifiedAt: true } },
  _count: { select: { entries: { where: { status: { in: ["pending", "approved"] } } } } },
} satisfies Prisma.TournamentSelect;

type CardRow = {
  id: string;
  slug: string;
  title: string;
  format: string;
  status: string;
  teamSize: number;
  capacity: number | null;
  registrationClosesAt: Date;
  startsAt: Date;
  durationMinutes: number;
  finishedAt: Date | null;
  org: { slug: string; name: string; verifiedAt: Date | null };
  _count: { entries: number };
};

function cardOf({ _count, org, ...t }: CardRow, now: Date) {
  return { ...t, org: { slug: org.slug, name: org.name, verified: org.verifiedAt !== null }, entries: _count.entries, phase: tournamentPhase(t, now) };
}

/** A tournament and the caller's right to manage it, or a 404. */
async function managedTournament(userId: string, tournamentId: string) {
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!t) throw new BattlesError(404, "No such tournament.");
  await requireOrgManager(userId, t.orgId).catch(() => {
    throw new BattlesError(404, "No such tournament.");
  });
  return t;
}

const fieldsOf = (t: TournamentFields & { allowedDomains: unknown }): TournamentFields => ({
  title: t.title,
  description: t.description,
  format: t.format,
  teamSize: t.teamSize,
  capacity: t.capacity,
  registrationClosesAt: t.registrationClosesAt,
  startsAt: t.startsAt,
  durationMinutes: t.durationMinutes,
  allowedDomains: Array.isArray(t.allowedDomains) ? (t.allowedDomains as string[]) : [],
  inviteCode: t.inviteCode,
  requiresApproval: t.requiresApproval,
  freezeMinutes: t.freezeMinutes,
});

export async function createTournament(userId: string, orgId: string, body: Body) {
  await requireOrgManager(userId, orgId);
  const read = readTournamentFields(body, null, { formatLocked: false });
  if ("error" in read) throw new BattlesError(400, read.error);
  const slug = await uniqueSlug(read.fields.title, async (s) => !!(await prisma.tournament.findUnique({ where: { slug: s }, select: { id: true } })), RESERVED_SLUGS);
  const t = await prisma.tournament.create({ data: { ...read.fields, orgId, slug, createdById: userId }, select: { id: true, slug: true } });
  return t;
}

/**
 * Edit the settings. A draft just saves. A published tournament that changes
 * goes to `review`: hidden like a draft, registrations kept, until the site
 * admin approves the new version (approveTournament) — players see nothing an
 * organizer wrote that a person has not read. A save that changes nothing
 * leaves it where it is. The problem set is not part of this: it is catalogue
 * problems, hidden from players until the start, so it needs no review.
 */
export async function updateTournament(userId: string, tournamentId: string, body: Body) {
  const t = await managedTournament(userId, tournamentId);
  if (t.status === "cancelled") throw new BattlesError(409, "A cancelled tournament cannot be edited.");
  if (t.status === "published" && t.startsAt <= new Date()) throw new BattlesError(409, "The tournament has started; its settings are fixed.");
  const current = fieldsOf(t as TournamentFields & { allowedDomains: unknown });
  const read = readTournamentFields(body, current, { formatLocked: t.status !== "draft" });
  if ("error" in read) throw new BattlesError(400, read.error);
  const before = tournamentSnapshot(current);
  if (!tournamentChanged(before, tournamentSnapshot(read.fields))) return manageView(userId, t.id);

  if (t.status === "published") {
    // Guarded on "published": a publish, cancel or the start racing this
    // edit wins, and the organizer reloads rather than hiding the wrong thing.
    const { count } = await prisma.tournament.updateMany({
      where: { id: t.id, status: "published", startsAt: { gt: new Date() } },
      data: {
        ...read.fields,
        status: "review",
        reviewRequestedAt: new Date(),
        // A tournament published before snapshots existed was approved as it stood until now.
        approvedSnapshot: (snapshotOf<TournamentSnapshot>(t.approvedSnapshot) ?? before) as unknown as Prisma.InputJsonValue,
      },
    });
    if (count === 0) throw new BattlesError(409, "The tournament changed while you were editing it. Reload the page and try again.");
  } else {
    await prisma.tournament.update({ where: { id: t.id }, data: read.fields });
  }
  forgetTournaments([t]);
  return manageView(userId, t.id);
}

/** Replace the problem set, in order. Catalogue problems only; until the tournament starts. */
export async function setProblems(userId: string, tournamentId: string, problemIds: unknown) {
  const t = await managedTournament(userId, tournamentId);
  if (t.status === "cancelled" || (t.status === "published" && t.startsAt <= new Date())) {
    throw new BattlesError(409, "The problem set is fixed once the tournament starts.");
  }
  if (!Array.isArray(problemIds) || !problemIds.every((p) => typeof p === "string")) throw new BattlesError(400, "problemIds must be a list.");
  const ids = [...new Set(problemIds as string[])];
  if (ids.length > LIMITS.problemsMax) throw new BattlesError(400, `At most ${LIMITS.problemsMax} problems.`);
  if (t.status !== "draft" && ids.length === 0) throw new BattlesError(400, "A published tournament needs at least one problem.");
  const found = await prisma.problem.count({ where: { id: { in: ids }, isPublished: true } });
  if (found !== ids.length) throw new BattlesError(400, "Some of those problems are not in the catalogue.");
  await prisma.$transaction([
    prisma.tournamentProblem.deleteMany({ where: { tournamentId: t.id } }),
    prisma.tournamentProblem.createMany({ data: ids.map((problemId, position) => ({ tournamentId: t.id, problemId, position })) }),
  ]);
  return manageView(userId, t.id);
}

export async function publishTournament(userId: string, tournamentId: string) {
  const t = await managedTournament(userId, tournamentId);
  const [problems, org] = await Promise.all([
    prisma.tournamentProblem.count({ where: { tournamentId: t.id } }),
    prisma.battleOrg.findUniqueOrThrow({ where: { id: t.orgId }, select: { verifiedAt: true } }),
  ]);
  const blocker = publishBlocker(t, problems, org.verifiedAt !== null, new Date());
  if (blocker) throw new BattlesError(409, blocker);
  // Guarded on "draft": two clicks publish once. What goes public is what a
  // later edit is compared with.
  await prisma.tournament.updateMany({
    where: { id: t.id, status: "draft" },
    data: { status: "published", publishedAt: new Date(), approvedSnapshot: tournamentSnapshot(fieldsOf(t as TournamentFields & { allowedDomains: unknown })) as unknown as Prisma.InputJsonValue },
  });
  forgetTournaments([t]);
  return manageView(userId, t.id);
}

/**
 * Call off a public tournament; players see that it was. A draft, or an edit
 * waiting for approval, was never public in that form — cancelling would
 * publish it as "cancelled" — so those are deleted instead.
 */
export async function cancelTournament(userId: string, tournamentId: string) {
  const t = await managedTournament(userId, tournamentId);
  if (t.status === "cancelled") return manageView(userId, t.id);
  if (t.status !== "published") {
    throw new BattlesError(409, t.status === "draft" ? "A draft is not public. Delete it instead." : "It is waiting for approval and not public. Delete it instead.");
  }
  if (tournamentPhase(t, new Date()) === "finished") throw new BattlesError(409, "A finished tournament cannot be cancelled.");
  await prisma.tournament.update({ where: { id: t.id }, data: { status: "cancelled" } });
  forgetTournaments([t]);
  return manageView(userId, t.id);
}

/** Why the tournament cannot be deleted now, or null (battles-rules `deleteBlocker`). */
async function deleteBlockerFor(t: { id: string; status: string; startsAt: Date; bracketAt: Date | null }) {
  const [attempts, matches] = await Promise.all([
    prisma.tournamentSubmission.count({ where: { tournamentId: t.id } }),
    prisma.tournamentMatch.count({ where: { tournamentId: t.id } }),
  ]);
  return deleteBlocker(t, { attempts, drawn: t.bracketAt !== null || matches > 0 }, new Date());
}

/**
 * Delete a tournament that never ran — a draft, or one still to start. Its
 * problem set, registrations and teams go with it (onDelete: Cascade); the
 * players who had registered simply no longer have it in their list.
 */
export async function deleteTournament(userId: string, tournamentId: string) {
  const t = await managedTournament(userId, tournamentId);
  const blocker = await deleteBlockerFor(t);
  if (blocker) throw new BattlesError(409, blocker);
  const org = await prisma.battleOrg.findUnique({ where: { id: t.orgId }, select: { slug: true } });
  await prisma.tournament.delete({ where: { id: t.id } });
  forgetTournaments([t], org?.slug);
  return { ok: true };
}

/** Everything an organizer sees: settings, invite code, problems, entries and teams. */
export async function manageView(userId: string, tournamentId: string) {
  const t = await managedTournament(userId, tournamentId);
  const [org, problems, entries, teams, cannotDelete] = await Promise.all([
    prisma.battleOrg.findUniqueOrThrow({ where: { id: t.orgId }, select: { slug: true, name: true, verifiedAt: true } }),
    prisma.tournamentProblem.findMany({
      where: { tournamentId: t.id },
      orderBy: { position: "asc" },
      select: { problem: { select: { id: true, slug: true, title: true, difficulty: true } } },
    }),
    prisma.tournamentEntry.findMany({
      where: { tournamentId: t.id },
      orderBy: { createdAt: "asc" },
      take: 5000,
      select: { id: true, status: true, teamId: true, createdAt: true, checkedInAt: true, seed: true, user: { select: { username: true, name: true, email: true, avatar_url: true } } },
    }),
    prisma.tournamentTeam.findMany({ where: { tournamentId: t.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    deleteBlockerFor(t),
  ]);
  return {
    tournament: {
      ...fieldsOf(t as TournamentFields & { allowedDomains: unknown }),
      id: t.id,
      slug: t.slug,
      status: t.status,
      orgId: t.orgId,
      publishedAt: t.publishedAt,
      resultsRevealedAt: t.resultsRevealedAt,
      reviewRequestedAt: t.reviewRequestedAt,
      phase: tournamentPhase(t, new Date()),
      /** Why Delete is not offered, or null when it is. */
      deleteBlocker: cannotDelete,
    },
    org: { slug: org.slug, name: org.name, verified: org.verifiedAt !== null },
    problems: problems.map((p) => p.problem),
    // An organizer sees each entrant's email *domain*, which is what an
    // eligibility decision needs, not the address itself: anyone may create
    // an org, and a list of students' addresses is not theirs to collect.
    entries: entries.map(({ user: { email, ...user }, ...e }) => ({ ...e, user: { ...user, emailDomain: email ? email.slice(email.lastIndexOf("@") + 1) : null } })),
    teams,
  };
}

/**
 * How long the public list's rows are kept. It is the same for every
 * caller — the route reads no session — and every visitor to the site's
 * home and /tournaments asks for it, two joined reads with a filtered count
 * each time. What changes it calls forgetTournaments or forgetEntries;
 * what moves with the clock (each card's phase) is worked out from the
 * rows on every read, so a tournament opening or starting shows at once.
 * Only a knockout's final (`finishedAt`, knockout.ts) reaches the list by
 * the TTL alone.
 */
const LIST_TTL_MS = 30_000;

/** The public list: published tournaments of verified orgs that have not finished. */
export async function listTournaments() {
  // Memory only (lib/cache `cached`): the rows keep their Dates, which the
  // phase rules read, and one instance's copy costs nothing to keep.
  const { rows, past } = await cached(LIST_KEY, LIST_TTL_MS, async () => {
    const at = Date.now();
    const verified = { status: "published", org: { verifiedAt: { not: null } } } as const;
    const [rows, past] = await Promise.all([
      prisma.tournament.findMany({
        where: { ...verified, startsAt: { gte: new Date(at - 2 * 24 * 3600_000) } },
        orderBy: { startsAt: "asc" },
        take: 60,
        select: TOURNAMENT_CARD,
      }),
      // Recently finished, newest first: where a visitor finds a tournament's
      // results, players and published code once it is over (the list above
      // drops it the moment it finishes). A knockout's end is its final, so
      // a few more rows than shown are read and the unfinished dropped.
      prisma.tournament.findMany({
        where: { ...verified, startsAt: { gte: new Date(at - RECENT_DAYS * 24 * 3600_000), lte: new Date(at) } },
        orderBy: { startsAt: "desc" },
        take: RECENT_SHOWN * 2,
        select: TOURNAMENT_CARD,
      }),
    ]);
    return { rows, past };
  });
  const now = new Date();
  return {
    tournaments: rows.map((t) => cardOf(t, now)).filter((t) => t.phase !== "finished"),
    recent: past
      .map((t) => cardOf(t, now))
      .filter((t) => t.phase === "finished")
      .slice(0, RECENT_SHOWN),
  };
}

/** The "Recently finished" section of /tournaments: how far back, and how many. */
const RECENT_DAYS = 60;
const RECENT_SHOWN = 12;

/**
 * A tournament's public page. The problem set is not on it — only how many
 * — until step 3's contest room opens it at the start. The invite code is
 * never sent; `needsInviteCode` says whether one is asked for.
 */
export async function tournamentPage(slug: string, viewer: { userId: string; isAdmin?: boolean } | null) {
  const t = await prisma.tournament.findUnique({
    where: { slug },
    select: {
      ...TOURNAMENT_CARD,
      orgId: true,
      description: true,
      allowedDomains: true,
      inviteCode: true,
      requiresApproval: true,
      _count: { select: { problems: true, entries: { where: { status: { in: ["pending", "approved"] } } } } },
    },
  });
  if (!t) throw new BattlesError(404, "No such tournament.");
  // The reader's role and their entry both hang off the row alone, so they
  // travel together; an entry read for a tournament the reader may not see
  // is dropped with the 404 below, unsent.
  const [role, entry] = viewer
    ? await Promise.all([
        prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId: t.orgId, userId: viewer.userId } }, select: { role: true } }).then((m) => m?.role ?? null),
        prisma.tournamentEntry.findUnique({
          where: { tournamentId_userId: { tournamentId: t.id, userId: viewer.userId } },
          select: { status: true, team: { select: { name: true } } },
        }),
      ])
    : [null, null];
  const canManage = role !== null && MANAGER_ROLES.includes(role);
  if (!canManage && (isHiddenStatus(t.status) || !t.org.verifiedAt)) throw new BattlesError(404, "No such tournament.");
  const { orgId: _orgId, inviteCode, _count, allowedDomains, ...rest } = t;
  return {
    tournament: {
      ...cardOf({ ...rest, _count: { entries: _count.entries } }, new Date()),
      description: t.description,
      requiresApproval: t.requiresApproval,
      allowedDomains: Array.isArray(allowedDomains) ? (allowedDomains as string[]) : [],
      needsInviteCode: inviteCode !== null,
      problemCount: _count.problems,
      checkInOpensAt: t.format === "knockout" ? new Date(t.startsAt.getTime() - CHECK_IN_MINUTES * 60_000) : null,
    },
    // The page's head — title, description, whether it is indexed, the
    // facts its Event node is built from — the same answer the Worker
    // writes into the HTML (services/battles-seo). Null for a draft or an
    // unverified organizer's tournament, which only its organizers see.
    seo: seoOf(tournamentSeo({ ...t, entries: _count.entries, problems: _count.problems })),
    viewer: viewer
      ? {
          canManage,
          // "Send reminder" in the masthead: its organizers and CodeKairo's admins, before the start (services/tournament-reminders).
          canRemind: offersReminder(t, canManage, viewer.isAdmin === true, new Date()),
          entry: entry ? { status: entry.status, team: entry.team?.name ?? null } : null,
          knockout: t.format === "knockout" && entry ? await knockoutViewer(t.id, viewer.userId) : null,
        }
      : null,
  };
}

// ── Entries ────────────────────────────────────────────────────────────

/**
 * Register for a knockout. The rules are checked first, in words (battles-
 * rules `registrationDecision`); the insert then re-checks the ones another
 * request could change in the meantime — still published, still open,
 * still room — in its own WHERE, as lib/seat-claim does for duel seats, so
 * two players racing for the last place cannot both get it.
 */
export async function register(viewer: { userId: string; email: string }, tournamentId: string, inviteCode: unknown) {
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId }, include: { org: { select: { verifiedAt: true } } } });
  if (!t || isHiddenStatus(t.status) || !t.org.verifiedAt) throw new BattlesError(404, "No such tournament.");

  const existing = await prisma.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: t.id, userId: viewer.userId } }, select: { status: true } });
  if (existing) throw new BattlesError(409, existing.status === "rejected" ? "The organizer declined your registration." : "You are already registered.");

  const takenPlaces = await prisma.tournamentEntry.count({ where: { tournamentId: t.id, status: { in: ["pending", "approved"] } } });
  const allowedDomains = Array.isArray(t.allowedDomains) ? (t.allowedDomains as string[]) : [];
  const decision = registrationDecision(
    { ...t, allowedDomains },
    { email: viewer.email, inviteCode: typeof inviteCode === "string" ? inviteCode : null, takenPlaces },
    new Date(),
  );
  if (!decision.ok) throw new BattlesError(decision.status, decision.reason);

  const status = decision.status;
  const inserted = await withLockRetry("tournamentRegister", async () => {
    try {
      return await prisma.$executeRaw`
        INSERT INTO TournamentEntry (id, tournamentId, userId, status, createdAt, decidedAt)
        SELECT ${newId()}, ${t.id}, ${viewer.userId}, ${status}, NOW(3), ${status === "approved" ? new Date() : null}
        WHERE (SELECT status FROM Tournament WHERE id = ${t.id}) = 'published'
          AND (SELECT registrationClosesAt FROM Tournament WHERE id = ${t.id}) > NOW(3)
          AND (${t.capacity} IS NULL OR
               (SELECT COUNT(*) FROM TournamentEntry WHERE tournamentId = ${t.id} AND status IN ('pending', 'approved')) < ${t.capacity})`;
    } catch (err) {
      if (isDuplicateKey(err)) throw new BattlesError(409, "You are already registered.");
      throw err;
    }
  });
  if (inserted === 0) throw new BattlesError(409, "Registration just closed, or the last place was taken.");
  forgetEntries(t.id, [viewer.userId]);
  return { status };
}

/** Leave a knockout before it starts. A team member is removed by the organizer instead. */
export async function withdraw(userId: string, tournamentId: string) {
  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
    select: { id: true, status: true, teamId: true, tournament: { select: { startsAt: true } } },
  });
  if (!entry || entry.status === "rejected") throw new BattlesError(404, "You are not registered.");
  if (entry.teamId) throw new BattlesError(409, "Your team was entered by the organizer; ask them to change it.");
  if (entry.tournament.startsAt <= new Date()) throw new BattlesError(409, "The tournament has started.");
  await prisma.tournamentEntry.delete({ where: { id: entry.id } });
  forgetEntries(tournamentId, [userId]);
  return { ok: true };
}

/** Approve or decline a pending registration (or change a decision before the start). */
export async function decideEntry(userId: string, entryId: string, status: unknown) {
  if (status !== "approved" && status !== "rejected") throw new BattlesError(400, "status must be approved or rejected.");
  const entry = await prisma.tournamentEntry.findUnique({ where: { id: entryId }, select: { id: true, tournamentId: true, teamId: true, userId: true } });
  if (!entry) throw new BattlesError(404, "No such registration.");
  const t = await managedTournament(userId, entry.tournamentId);
  if (entry.teamId) throw new BattlesError(409, "Team members are managed through the team list.");
  if (t.startsAt <= new Date()) throw new BattlesError(409, "The tournament has started.");
  await prisma.tournamentEntry.update({ where: { id: entry.id }, data: { status, decidedAt: new Date() } });
  // The entrant's dashboard, not the organizer's: it is their entry that appeared or went.
  forgetEntries(entry.tournamentId, [entry.userId]);
  return { ok: true };
}

/**
 * Add ICPC teams from the organizer's pasted list (battles-rules
 * `parseTeamList`). Members are CodeKairo accounts named by email or
 * username; the whole upload is refused, with every problem listed, unless
 * all of it can be saved — a half-imported list is harder to fix than a
 * rejected one.
 */
export async function uploadTeams(userId: string, tournamentId: string, list: unknown) {
  const t = await managedTournament(userId, tournamentId);
  if (t.format !== "icpc") throw new BattlesError(409, "Teams are for ICPC-style contests.");
  if (t.status === "cancelled" || t.startsAt <= new Date()) throw new BattlesError(409, "Teams are fixed once the contest starts.");
  if (typeof list !== "string") throw new BattlesError(400, "Paste the team list as text.");

  const parsed = parseTeamList(list, t.teamSize);
  if ("errors" in parsed) throw new BattlesError(400, parsed.errors.join("\n"));

  const idents = parsed.teams.flatMap((team) => team.members.map((m) => m.toLowerCase()));
  const emails = idents.filter((m) => m.includes("@"));
  const usernames = idents.filter((m) => !m.includes("@"));
  const [users, existingTeams, org] = await Promise.all([
    prisma.user.findMany({ where: { OR: [{ email: { in: emails } }, { username: { in: usernames } }] }, select: { id: true, email: true, username: true } }),
    prisma.tournamentTeam.findMany({ where: { tournamentId: t.id }, select: { name: true } }),
    emails.length > 0 ? prisma.battleOrg.findUnique({ where: { id: t.orgId }, select: { verifiedAt: true } }) : Promise.resolve(null),
  ]);
  // A handle is public; an address is not. Anyone may create an org and a
  // draft contest, and a list of addresses pasted here used to answer, line
  // by line, which ones have an account ("no CodeKairo account for …") and
  // — once uploaded — whose account each is, down to the name, while
  // entering those people in a contest they never chose. The organizer view
  // shows only an entrant's email domain for the same reason (manageView).
  // Addresses are for organizations the platform has verified; everyone
  // else lists usernames, which tell them nothing a profile does not.
  if (emails.length > 0 && !org?.verifiedAt) {
    throw new BattlesError(403, "Adding people by email address needs a verified organization. List their CodeKairo usernames instead, or add addresses once the organization is verified.");
  }
  const byIdent = new Map<string, string>();
  for (const u of users) {
    if (u.email) byIdent.set(u.email.toLowerCase(), u.id);
    if (u.username) byIdent.set(u.username.toLowerCase(), u.id);
  }
  const entered = new Set(
    (await prisma.tournamentEntry.findMany({ where: { tournamentId: t.id, userId: { in: [...byIdent.values()] } }, select: { userId: true } })).map((e) => e.userId),
  );
  const takenNames = new Set(existingTeams.map((x) => x.name.toLowerCase()));

  const errors: string[] = [];
  const seenUsers = new Map<string, number>();
  for (const team of parsed.teams) {
    if (takenNames.has(team.name.toLowerCase())) errors.push(`Line ${team.line}: a team called "${team.name}" is already entered.`);
    for (const m of team.members) {
      const id = byIdent.get(m.toLowerCase());
      if (!id) errors.push(`Line ${team.line}: no CodeKairo account for ${m}.`);
      else if (entered.has(id)) errors.push(`Line ${team.line}: ${m} is already entered in this contest.`);
      else if (seenUsers.has(id) && seenUsers.get(id) !== team.line) errors.push(`Line ${team.line}: ${m} is the same account as someone on line ${seenUsers.get(id)}.`);
      else if (id) seenUsers.set(id, team.line);
    }
  }
  if (errors.length) throw new BattlesError(400, errors.join("\n"));

  const decidedAt = new Date();
  await prisma.$transaction(
    parsed.teams.map((team) =>
      prisma.tournamentTeam.create({
        data: {
          tournamentId: t.id,
          name: team.name,
          entries: { create: team.members.map((m) => ({ tournamentId: t.id, userId: byIdent.get(m.toLowerCase())!, status: "approved", decidedAt })) },
        },
      }),
    ),
  );
  forgetEntries(t.id, [...seenUsers.keys()]);
  return manageView(userId, t.id);
}

export async function deleteTeam(userId: string, teamId: string) {
  // The members are read with the team: their entries go with it, and so does the tournament from their dashboards.
  const team = await prisma.tournamentTeam.findUnique({ where: { id: teamId }, select: { id: true, tournamentId: true, entries: { select: { userId: true } } } });
  if (!team) throw new BattlesError(404, "No such team.");
  const t = await managedTournament(userId, team.tournamentId);
  if (t.startsAt <= new Date()) throw new BattlesError(409, "Teams are fixed once the contest starts.");
  // The team's entries go with it (onDelete: Cascade).
  await prisma.tournamentTeam.delete({ where: { id: team.id } });
  forgetEntries(t.id, team.entries.map((e) => e.userId));
  return manageView(userId, t.id);
}

/**
 * The tournaments the caller is entered in, newest first — the public ones:
 * one waiting for approval, or whose organization is being verified again,
 * drops out of the list until it is back (its row would show the unchecked
 * title and name), and the registration is kept for when it is.
 */
export async function myEntries(userId: string) {
  const rows = await prisma.tournamentEntry.findMany({
    where: { userId, tournament: { status: { in: ["published", "cancelled"] }, org: { verifiedAt: { not: null } } } },
    orderBy: { tournament: { startsAt: "desc" } },
    take: 100,
    select: { status: true, team: { select: { name: true } }, tournament: { select: TOURNAMENT_CARD } },
  });
  const now = new Date();
  return { entries: rows.map((r) => ({ status: r.status, team: r.team?.name ?? null, tournament: cardOf(r.tournament, now) })) };
}

// ── Site admin ─────────────────────────────────────────────────────────

/**
 * Orgs for the admin to check: unverified first (oldest waiting longest), then
 * recently verified. One that was verified before carries `changes` — each
 * field that differs from what was verified, with its old value — so a
 * re-verification is read as a diff. `version` is what the admin read; the
 * verify call sends it back so a later edit is not verified unseen.
 */
export async function orgsForReview() {
  const select = { ...ORG_PUBLIC, createdAt: true, updatedAt: true, verifiedSnapshot: true, _count: { select: { tournaments: true } } } as const;
  const [pending, verified] = await Promise.all([
    prisma.battleOrg.findMany({ where: { verifiedAt: null }, orderBy: { createdAt: "asc" }, take: 200, select }),
    prisma.battleOrg.findMany({ where: { verifiedAt: { not: null } }, orderBy: { verifiedAt: "desc" }, take: 50, select }),
  ]);
  const creators = await prisma.battleOrgMember.findMany({
    where: { orgId: { in: [...pending, ...verified].map((o) => o.id) }, role: "owner" },
    select: { orgId: true, user: { select: { username: true, email: true } } },
  });
  const ownerOf = new Map(creators.map((c) => [c.orgId, c.user]));
  const shape = ({ _count, updatedAt, verifiedSnapshot, ...o }: (typeof pending)[number]) => {
    const was = o.verifiedAt ? null : snapshotOf<OrgSnapshot>(verifiedSnapshot);
    return {
      ...o,
      tournaments: _count.tournaments,
      owner: ownerOf.get(o.id) ?? null,
      version: updatedAt.toISOString(),
      reverify: was !== null,
      changes: was ? describeOrg(was, orgSnapshot(o)).filter((f) => f.before !== null) : [],
    };
  };
  return { pending: pending.map(shape), verified: verified.map(shape) };
}

/**
 * Verify or revoke. Verifying records the details as verified — what the
 * next edit is compared with — and, when the admin sends the `version` they
 * read, refuses if the organizer has changed the org since.
 */
export async function setOrgVerified(orgId: string, verified: unknown, version?: unknown) {
  if (typeof verified !== "boolean") throw new BattlesError(400, "verified must be true or false.");
  const org = await prisma.battleOrg.findUnique({
    where: { id: orgId },
    select: { slug: true, name: true, kind: true, website: true, city: true, about: true, updatedAt: true, tournaments: { select: { id: true, slug: true } } },
  });
  if (!org) throw new BattlesError(404, "No such organization.");
  if (verified && typeof version === "string" && version !== org.updatedAt.toISOString()) {
    throw new BattlesError(409, "The organizer changed these details just now. Reload the queue to read the latest before verifying.");
  }
  await prisma.battleOrg.update({
    where: { id: orgId },
    data: verified ? { verifiedAt: new Date(), verifiedSnapshot: orgSnapshot(org) as unknown as Prisma.InputJsonValue } : { verifiedAt: null },
  });
  forgetTournaments(org.tournaments, org.slug);
  return { ok: true };
}

/**
 * Published tournaments whose organizer changed them, oldest request first,
 * each with every setting and — beside the ones that changed — what players
 * saw before. Hidden until approved.
 */
export async function tournamentsForReview() {
  const rows = await prisma.tournament.findMany({
    where: { status: "review" },
    orderBy: { reviewRequestedAt: "asc" },
    take: 200,
    include: {
      org: { select: { slug: true, name: true, verifiedAt: true } },
      _count: { select: { problems: true, entries: { where: { status: { in: ["pending", "approved"] } } } } },
    },
  });
  return {
    tournaments: rows.map((t) => {
      const was = snapshotOf<TournamentSnapshot>(t.approvedSnapshot);
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        format: t.format,
        startsAt: t.startsAt,
        reviewRequestedAt: t.reviewRequestedAt,
        version: t.updatedAt.toISOString(),
        org: { slug: t.org.slug, name: t.org.name, verified: t.org.verifiedAt !== null },
        entries: t._count.entries,
        problems: t._count.problems,
        fields: describeTournament(was, tournamentSnapshot(fieldsOf(t as TournamentFields & { allowedDomains: unknown }))),
        hasSnapshot: was !== null,
        blocker: approveBlocker(t, new Date()),
      };
    }),
  };
}

/** Approve an edited tournament: public again, and this version is what the next edit is compared with. */
export async function approveTournament(tournamentId: string, version?: unknown) {
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!t) throw new BattlesError(404, "No such tournament.");
  const blocker = approveBlocker(t, new Date());
  if (blocker) throw new BattlesError(409, blocker);
  // The version the admin read: an edit after it is not approved unseen.
  if (typeof version === "string" && version !== t.updatedAt.toISOString()) {
    throw new BattlesError(409, "The organizer changed it again just now. Reload the queue to read the latest before approving.");
  }
  const { count } = await prisma.tournament.updateMany({
    where: { id: t.id, status: "review", updatedAt: t.updatedAt },
    data: { status: "published", reviewRequestedAt: null, approvedSnapshot: tournamentSnapshot(fieldsOf(t as TournamentFields & { allowedDomains: unknown })) as unknown as Prisma.InputJsonValue },
  });
  if (count === 0) throw new BattlesError(409, "The organizer changed it again just now. Reload the queue to read the latest before approving.");
  forgetTournaments([t]);
  return { ok: true };
}

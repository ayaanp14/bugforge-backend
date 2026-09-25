/**
 * CodeKairo Battles (battles.codekairo.com): organizations, their
 * tournaments, and who is entered. The pure rules — eligibility, phases,
 * validation, the team list — are in battles-rules.ts; this file loads rows,
 * applies them and writes.
 *
 * Access: an org's owner and admins manage everything under it; anyone else
 * sees a tournament only once it is published by a verified org. A draft,
 * or anything of an unverified org, answers 404 to outsiders — the same
 * answer as a slug that does not exist, so neither is confirmed.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { newId } from "../lib/db-ids.js";
import { isDuplicateKey, withLockRetry } from "../lib/seat-claim.js";
import { uniqueSlug } from "../lib/slug.js";
import {
  LIMITS,
  ORG_KINDS,
  parseTeamList,
  publishBlocker,
  readTournamentFields,
  registrationDecision,
  tournamentPhase,
  type OrgKind,
  type TournamentFields,
} from "./battles-rules.js";

import { BattlesError } from "./battles-error.js";
import { knockoutViewer } from "./knockout.js";
import { CHECK_IN_MINUTES } from "./knockout-rules.js";
import { orgSeo, seoOf, tournamentSeo } from "./battles-seo.js";

export { BattlesError };

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

export async function updateOrg(userId: string, orgId: string, body: Body) {
  await requireOrgManager(userId, orgId);
  const current = await prisma.battleOrg.findUniqueOrThrow({ where: { id: orgId }, select: { name: true, kind: true, verifiedAt: true } });
  const fields = readOrgFields(body, current);
  // A verified name is what the admin checked; renaming it would carry the
  // badge onto a name nobody looked at.
  if (current.verifiedAt && fields.name !== current.name) {
    throw new BattlesError(409, "A verified organization's name cannot be changed. Contact CodeKairo support.");
  }
  return prisma.battleOrg.update({ where: { id: orgId }, data: fields, select: ORG_PUBLIC });
}

/** An org's public page: its details and its published tournaments (drafts too, for its managers). */
export async function orgPage(slug: string, viewerId: string | null) {
  const org = await prisma.battleOrg.findUnique({ where: { slug }, select: ORG_PUBLIC });
  if (!org) throw new BattlesError(404, "No such organization.");
  const role = viewerId
    ? ((await prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId: org.id, userId: viewerId } }, select: { role: true } }))?.role ?? null)
    : null;
  const manages = role !== null && MANAGER_ROLES.includes(role);
  if (!org.verifiedAt && !manages) throw new BattlesError(404, "No such organization.");
  const tournaments = await prisma.tournament.findMany({
    where: { orgId: org.id, ...(manages ? {} : { status: "published" }) },
    orderBy: { startsAt: "desc" },
    take: 100,
    select: TOURNAMENT_CARD,
  });
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
      org: { select: { ...ORG_PUBLIC, tournaments: { orderBy: { createdAt: "desc" }, take: 50, select: TOURNAMENT_CARD } } },
    },
  });
  const now = new Date();
  return {
    orgs: memberships.map(({ role, org: { tournaments, ...org } }) => ({ ...org, role, tournaments: tournaments.map((t) => cardOf(t, now)) })),
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

export async function updateTournament(userId: string, tournamentId: string, body: Body) {
  const t = await managedTournament(userId, tournamentId);
  if (t.status === "cancelled") throw new BattlesError(409, "A cancelled tournament cannot be edited.");
  if (t.status === "published" && t.startsAt <= new Date()) throw new BattlesError(409, "The tournament has started; its settings are fixed.");
  const read = readTournamentFields(body, fieldsOf(t as TournamentFields & { allowedDomains: unknown }), { formatLocked: t.status === "published" });
  if ("error" in read) throw new BattlesError(400, read.error);
  await prisma.tournament.update({ where: { id: t.id }, data: read.fields });
  return manageView(userId, t.id);
}

/** Replace the problem set, in order. Catalogue problems only; drafts and published-not-started only. */
export async function setProblems(userId: string, tournamentId: string, problemIds: unknown) {
  const t = await managedTournament(userId, tournamentId);
  if (t.status === "cancelled" || (t.status === "published" && t.startsAt <= new Date())) {
    throw new BattlesError(409, "The problem set is fixed once the tournament starts.");
  }
  if (!Array.isArray(problemIds) || !problemIds.every((p) => typeof p === "string")) throw new BattlesError(400, "problemIds must be a list.");
  const ids = [...new Set(problemIds as string[])];
  if (ids.length > LIMITS.problemsMax) throw new BattlesError(400, `At most ${LIMITS.problemsMax} problems.`);
  if (t.status === "published" && ids.length === 0) throw new BattlesError(400, "A published tournament needs at least one problem.");
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
  // Guarded on "draft": two clicks publish once.
  await prisma.tournament.updateMany({ where: { id: t.id, status: "draft" }, data: { status: "published", publishedAt: new Date() } });
  return manageView(userId, t.id);
}

export async function cancelTournament(userId: string, tournamentId: string) {
  const t = await managedTournament(userId, tournamentId);
  if (t.status === "cancelled") return manageView(userId, t.id);
  if (tournamentPhase(t, new Date()) === "finished") throw new BattlesError(409, "A finished tournament cannot be cancelled.");
  await prisma.tournament.update({ where: { id: t.id }, data: { status: "cancelled" } });
  return manageView(userId, t.id);
}

/** Everything an organizer sees: settings, invite code, problems, entries and teams. */
export async function manageView(userId: string, tournamentId: string) {
  const t = await managedTournament(userId, tournamentId);
  const [org, problems, entries, teams] = await Promise.all([
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
      phase: tournamentPhase(t, new Date()),
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

/** The public list: published tournaments of verified orgs that have not finished. */
export async function listTournaments() {
  const now = new Date();
  const rows = await prisma.tournament.findMany({
    where: { status: "published", org: { verifiedAt: { not: null } }, startsAt: { gte: new Date(now.getTime() - 2 * 24 * 3600_000) } },
    orderBy: { startsAt: "asc" },
    take: 60,
    select: TOURNAMENT_CARD,
  });
  return { tournaments: rows.map((t) => cardOf(t, now)).filter((t) => t.phase !== "finished") };
}

/**
 * A tournament's public page. The problem set is not on it — only how many
 * — until step 3's contest room opens it at the start. The invite code is
 * never sent; `needsInviteCode` says whether one is asked for.
 */
export async function tournamentPage(slug: string, viewer: { userId: string } | null) {
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
  const role = viewer
    ? ((await prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId: t.orgId, userId: viewer.userId } }, select: { role: true } }))?.role ?? null)
    : null;
  const canManage = role !== null && MANAGER_ROLES.includes(role);
  if (!canManage && (t.status === "draft" || !t.org.verifiedAt)) throw new BattlesError(404, "No such tournament.");

  const entry = viewer
    ? await prisma.tournamentEntry.findUnique({
        where: { tournamentId_userId: { tournamentId: t.id, userId: viewer.userId } },
        select: { status: true, team: { select: { name: true } } },
      })
    : null;
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
  if (!t || t.status === "draft" || !t.org.verifiedAt) throw new BattlesError(404, "No such tournament.");

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
  return { ok: true };
}

/** Approve or decline a pending registration (or change a decision before the start). */
export async function decideEntry(userId: string, entryId: string, status: unknown) {
  if (status !== "approved" && status !== "rejected") throw new BattlesError(400, "status must be approved or rejected.");
  const entry = await prisma.tournamentEntry.findUnique({ where: { id: entryId }, select: { id: true, tournamentId: true, teamId: true } });
  if (!entry) throw new BattlesError(404, "No such registration.");
  const t = await managedTournament(userId, entry.tournamentId);
  if (entry.teamId) throw new BattlesError(409, "Team members are managed through the team list.");
  if (t.startsAt <= new Date()) throw new BattlesError(409, "The tournament has started.");
  await prisma.tournamentEntry.update({ where: { id: entry.id }, data: { status, decidedAt: new Date() } });
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
  const [users, existingTeams] = await Promise.all([
    prisma.user.findMany({ where: { OR: [{ email: { in: emails } }, { username: { in: usernames } }] }, select: { id: true, email: true, username: true } }),
    prisma.tournamentTeam.findMany({ where: { tournamentId: t.id }, select: { name: true } }),
  ]);
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
  return manageView(userId, t.id);
}

export async function deleteTeam(userId: string, teamId: string) {
  const team = await prisma.tournamentTeam.findUnique({ where: { id: teamId }, select: { id: true, tournamentId: true } });
  if (!team) throw new BattlesError(404, "No such team.");
  const t = await managedTournament(userId, team.tournamentId);
  if (t.startsAt <= new Date()) throw new BattlesError(409, "Teams are fixed once the contest starts.");
  // The team's entries go with it (onDelete: Cascade).
  await prisma.tournamentTeam.delete({ where: { id: team.id } });
  return manageView(userId, t.id);
}

/** The tournaments the caller is entered in, newest first. */
export async function myEntries(userId: string) {
  const rows = await prisma.tournamentEntry.findMany({
    where: { userId },
    orderBy: { tournament: { startsAt: "desc" } },
    take: 100,
    select: { status: true, team: { select: { name: true } }, tournament: { select: TOURNAMENT_CARD } },
  });
  const now = new Date();
  return { entries: rows.map((r) => ({ status: r.status, team: r.team?.name ?? null, tournament: cardOf(r.tournament, now) })) };
}

// ── Site admin ─────────────────────────────────────────────────────────

/** Orgs for the admin to check: unverified first (oldest waiting longest), then recently verified. */
export async function orgsForReview() {
  const select = { ...ORG_PUBLIC, createdAt: true, _count: { select: { tournaments: true } } } as const;
  const [pending, verified] = await Promise.all([
    prisma.battleOrg.findMany({ where: { verifiedAt: null }, orderBy: { createdAt: "asc" }, take: 200, select }),
    prisma.battleOrg.findMany({ where: { verifiedAt: { not: null } }, orderBy: { verifiedAt: "desc" }, take: 50, select }),
  ]);
  const creators = await prisma.battleOrgMember.findMany({
    where: { orgId: { in: [...pending, ...verified].map((o) => o.id) }, role: "owner" },
    select: { orgId: true, user: { select: { username: true, email: true } } },
  });
  const ownerOf = new Map(creators.map((c) => [c.orgId, c.user]));
  const shape = ({ _count, ...o }: (typeof pending)[number]) => ({ ...o, tournaments: _count.tournaments, owner: ownerOf.get(o.id) ?? null });
  return { pending: pending.map(shape), verified: verified.map(shape) };
}

export async function setOrgVerified(orgId: string, verified: unknown) {
  if (typeof verified !== "boolean") throw new BattlesError(400, "verified must be true or false.");
  const { count } = await prisma.battleOrg.updateMany({ where: { id: orgId }, data: { verifiedAt: verified ? new Date() : null } });
  if (count === 0) throw new BattlesError(404, "No such organization.");
  return { ok: true };
}

/**
 * The tournament site's rules that need no database — who may register,
 * which phase a tournament is in, what a valid tournament looks like, and
 * how an organizer's team list is read. services/battles.ts loads the rows
 * and applies these; battles-rules.test.ts pins them.
 */

export const ORG_KINDS = ["college", "club", "company", "community"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export const TOURNAMENT_FORMATS = ["knockout", "icpc"] as const;
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

export type EntryStatus = "pending" | "approved" | "rejected";

/** Bounds an organizer can set. A problem set of one is a knockout match's minimum. */
export const LIMITS = {
  titleMax: 140,
  descriptionMax: 8000,
  problemsMax: 15,
  domainsMax: 20,
  inviteCodeMin: 4,
  inviteCodeMax: 24,
  capacityMax: 5000,
  durationMin: 10,
  durationMax: 12 * 60,
  teamsPerUpload: 500,
  teamNameMax: 80,
} as const;

const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/**
 * Email domains as the organizer typed them — "@IITB.ac.in", "iitb.ac.in ",
 * one per line or comma — lower-cased, de-duplicated, without the "@".
 * Returns the offending entry when one is not a domain.
 */
export function normalizeDomains(raw: readonly string[]): { domains: string[] } | { invalid: string } {
  const out = new Set<string>();
  for (const entry of raw) {
    const d = entry.trim().toLowerCase().replace(/^@/, "");
    if (!d) continue;
    if (!DOMAIN.test(d)) return { invalid: entry.trim() };
    out.add(d);
  }
  return { domains: [...out] };
}

/**
 * Whether an address is on one of the domains; subdomains count
 * (students.iitb.ac.in is iitb.ac.in), look-alikes do not
 * (notiitb.ac.in, iitb.ac.in.evil.com). No domains means anyone.
 */
export function emailDomainAllowed(email: string | null | undefined, domains: readonly string[]): boolean {
  if (domains.length === 0) return true;
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const host = email.slice(at + 1).trim().toLowerCase();
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * Statuses players never see: a draft, and a published tournament whose edit
 * is waiting for the site admin (`review`). Every check that hides a draft
 * from outsiders hides both — a public tournament an organizer has just
 * changed shows nothing until a person has looked at the change.
 */
export function isHiddenStatus(status: string): boolean {
  return status === "draft" || status === "review";
}

export type TournamentPhase = "draft" | "review" | "cancelled" | "registration" | "registration_closed" | "live" | "finished";

interface PhaseInput {
  status: string;
  format: string;
  registrationClosesAt: Date;
  startsAt: Date;
  durationMinutes: number;
  /** Knockout: set when the final was decided. */
  finishedAt?: Date | null;
}

/**
 * Where a tournament stands at `now`. Derived, never stored, so it cannot
 * drift from the clock. An ICPC contest ends at start + duration; a
 * knockout's length depends on its bracket, so it stays live until its
 * final is decided (`finishedAt`, services/knockout.ts).
 */
export function tournamentPhase(t: PhaseInput, now: Date): TournamentPhase {
  if (t.status === "draft") return "draft";
  if (t.status === "review") return "review";
  if (t.status === "cancelled") return "cancelled";
  if (now < t.registrationClosesAt) return "registration";
  if (now < t.startsAt) return "registration_closed";
  if (t.format === "icpc" && now.getTime() >= t.startsAt.getTime() + t.durationMinutes * 60_000) return "finished";
  if (t.format === "knockout" && t.finishedAt) return "finished";
  return "live";
}

interface RegistrationInput extends PhaseInput {
  allowedDomains: readonly string[];
  inviteCode: string | null;
  requiresApproval: boolean;
  capacity: number | null;
}

export type RegistrationDecision = { ok: true; status: "pending" | "approved" } | { ok: false; status: number; reason: string };

/**
 * May this account register, and does it wait for the organizer? Checked in
 * the order a player would want to hear about it: whether it is open at all,
 * then who may enter, then whether there is room.
 */
export function registrationDecision(
  t: RegistrationInput,
  who: { email: string | null; inviteCode: string | null | undefined; takenPlaces: number },
  now: Date,
): RegistrationDecision {
  if (t.format === "icpc") return { ok: false, status: 409, reason: "Teams for this contest are entered by the organizer." };
  const phase = tournamentPhase(t, now);
  if (phase !== "registration") {
    return { ok: false, status: 409, reason: phase === "cancelled" ? "This tournament was cancelled." : "Registration is closed." };
  }
  if (!emailDomainAllowed(who.email, t.allowedDomains)) {
    return { ok: false, status: 403, reason: `Registration is limited to ${t.allowedDomains.map((d) => `@${d}`).join(", ")} email addresses.` };
  }
  if (t.inviteCode && (who.inviteCode ?? "").trim().toUpperCase() !== t.inviteCode.toUpperCase()) {
    return { ok: false, status: 403, reason: who.inviteCode ? "That invite code is not right." : "This tournament needs an invite code." };
  }
  if (t.capacity !== null && who.takenPlaces >= t.capacity) return { ok: false, status: 409, reason: "This tournament is full." };
  return { ok: true, status: t.requiresApproval ? "pending" : "approved" };
}

export interface TournamentFields {
  title: string;
  description: string | null;
  format: TournamentFormat;
  teamSize: number;
  capacity: number | null;
  registrationClosesAt: Date;
  startsAt: Date;
  durationMinutes: number;
  allowedDomains: string[];
  inviteCode: string | null;
  requiresApproval: boolean;
  /** ICPC: minutes before the end when the public board freezes; 0 = never. Always 0 for a knockout. */
  freezeMinutes: number;
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

/** A date from a request (ISO string or epoch ms) or from the stored row on an edit. */
function readDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A tournament's settings from a request body, checked whole. `current` is
 * the stored row on an edit (a missing field keeps its value); `formatLocked`
 * once published, since players entered under that format and team size.
 * Returns the first problem in words the organizer can act on.
 */
export function readTournamentFields(
  body: Record<string, unknown>,
  current: TournamentFields | null,
  opts: { formatLocked: boolean },
): { fields: TournamentFields } | { error: string } {
  const pick = <K extends keyof TournamentFields>(key: K): unknown => (key in body ? body[key] : current?.[key]);

  const title = typeof pick("title") === "string" ? (pick("title") as string).trim() : "";
  if (title.length < 3 || title.length > LIMITS.titleMax) return { error: `The title must be 3–${LIMITS.titleMax} characters.` };

  const rawDescription = pick("description");
  const description = typeof rawDescription === "string" && rawDescription.trim() ? rawDescription.trim() : null;
  if (description && description.length > LIMITS.descriptionMax) return { error: `The description is limited to ${LIMITS.descriptionMax} characters.` };

  const format = pick("format");
  if (!TOURNAMENT_FORMATS.includes(format as TournamentFormat)) return { error: "Choose a format: knockout or ICPC-style." };
  if (opts.formatLocked && current && (format !== current.format || pick("teamSize") !== current.teamSize)) {
    return { error: "The format and team size cannot change once the tournament is published." };
  }

  const teamSize = format === "knockout" ? 1 : pick("teamSize");
  if (!isInt(teamSize) || teamSize < 1 || teamSize > 3) return { error: "An ICPC-style team has 1 to 3 members." };

  const rawCapacity = pick("capacity");
  const capacity = rawCapacity === null || rawCapacity === undefined || rawCapacity === "" ? null : rawCapacity;
  if (capacity !== null && (!isInt(capacity) || capacity < 2 || capacity > LIMITS.capacityMax)) {
    return { error: `Capacity must be between 2 and ${LIMITS.capacityMax}, or empty for no limit.` };
  }

  const startsAt = readDate(pick("startsAt"));
  const registrationClosesAt = readDate(pick("registrationClosesAt"));
  if (!startsAt) return { error: "Set a start date and time." };
  if (!registrationClosesAt) return { error: "Set when registration closes." };
  if (registrationClosesAt > startsAt) return { error: "Registration must close before the tournament starts." };

  const durationMinutes = pick("durationMinutes");
  if (!isInt(durationMinutes) || durationMinutes < LIMITS.durationMin || durationMinutes > LIMITS.durationMax) {
    return { error: `The duration must be ${LIMITS.durationMin}–${LIMITS.durationMax} minutes.` };
  }

  const rawDomains = pick("allowedDomains");
  if (!Array.isArray(rawDomains) || !rawDomains.every((d) => typeof d === "string")) return { error: "Email domains must be a list." };
  const domains = normalizeDomains(rawDomains as string[]);
  if ("invalid" in domains) return { error: `"${domains.invalid}" is not an email domain (like college.edu).` };
  if (domains.domains.length > LIMITS.domainsMax) return { error: `At most ${LIMITS.domainsMax} email domains.` };

  const rawCode = pick("inviteCode");
  const inviteCode = typeof rawCode === "string" && rawCode.trim() ? rawCode.trim().toUpperCase() : null;
  if (inviteCode && !new RegExp(`^[A-Z0-9-]{${LIMITS.inviteCodeMin},${LIMITS.inviteCodeMax}}$`).test(inviteCode)) {
    return { error: `An invite code is ${LIMITS.inviteCodeMin}–${LIMITS.inviteCodeMax} letters, digits or hyphens.` };
  }

  const rawFreeze = pick("freezeMinutes") ?? 0;
  const freezeMinutes = format === "icpc" ? rawFreeze : 0;
  if (!isInt(freezeMinutes) || freezeMinutes < 0 || freezeMinutes >= durationMinutes) {
    return { error: "The scoreboard freeze must be shorter than the contest (0 for no freeze)." };
  }

  return {
    fields: {
      title,
      description,
      format: format as TournamentFormat,
      teamSize,
      capacity: capacity as number | null,
      registrationClosesAt,
      startsAt,
      durationMinutes,
      allowedDomains: domains.domains,
      inviteCode,
      requiresApproval: pick("requiresApproval") === true,
      freezeMinutes,
    },
  };
}

/** What stands between a draft and publishing it, or null when nothing does. */
export function publishBlocker(t: { status: string; startsAt: Date; registrationClosesAt: Date }, problemCount: number, orgVerified: boolean, now: Date): string | null {
  if (t.status !== "draft") return "Only a draft can be published.";
  if (!orgVerified) return "Your organization is awaiting verification. Tournaments can be published once CodeKairo has verified it.";
  if (problemCount === 0) return "Add at least one problem first.";
  if (t.registrationClosesAt <= now) return "Registration would already be closed. Move the dates forward first.";
  return null;
}

/** What stands between an edited tournament and the admin approving it, or null. */
export function approveBlocker(t: { status: string; startsAt: Date }, now: Date): string | null {
  if (t.status !== "review") return "Only a tournament waiting for approval can be approved.";
  if (t.startsAt <= now) return "Its start time passed while it waited. The organizer has to move the dates first.";
  return null;
}

/**
 * Why a tournament cannot be deleted, or null when it can. Only one that never
 * ran: once it has started, or anyone has competed in it, its results are on
 * players' profiles (trophy marks, the Tournaments record), and cancelling is
 * the way to call it off. A cancelled tournament that never ran may go.
 */
export function deleteBlocker(t: { status: string; startsAt: Date }, activity: { attempts: number; drawn: boolean }, now: Date): string | null {
  if (activity.attempts > 0 || activity.drawn) return "Players have already competed in this tournament, so it can only be cancelled.";
  if (t.status === "published" && t.startsAt <= now) return "This tournament has started, so it can only be cancelled.";
  return null;
}

// ── What changed since the admin last looked ─────────────────────────────

/** A tournament's settings as stored JSON (`Tournament.approvedSnapshot`): dates as ISO strings. */
export type TournamentSnapshot = Omit<TournamentFields, "registrationClosesAt" | "startsAt"> & { registrationClosesAt: string; startsAt: string };

export function tournamentSnapshot(f: TournamentFields): TournamentSnapshot {
  return { ...f, registrationClosesAt: f.registrationClosesAt.toISOString(), startsAt: f.startsAt.toISOString() };
}

/** An organization's details as stored JSON (`BattleOrg.verifiedSnapshot`). */
export interface OrgSnapshot {
  name: string;
  kind: string;
  website: string | null;
  city: string | null;
  about: string | null;
}

export const orgSnapshot = (o: OrgSnapshot): OrgSnapshot => ({ name: o.name, kind: o.kind, website: o.website ?? null, city: o.city ?? null, about: o.about ?? null });

/** One field as the admin reads it: its value now, and — when it changed — what it was. */
export interface FieldView {
  field: string;
  label: string;
  value: string;
  /** What it was when last approved or verified; null when unchanged or nothing is on record. */
  before: string | null;
}

type FieldSpec<T> = ReadonlyArray<readonly [key: keyof T & string, label: string, show: (v: unknown) => string]>;

const orNone = (empty: string) => (v: unknown) => (v === null || v === undefined || v === "" ? empty : String(v));

/** The product calendar is Indian time; the admin reads dates the way the organizer's players will. */
const IST = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
const istTime = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? `${IST.format(new Date(v))} IST` : "—");

const TOURNAMENT_FIELDS: FieldSpec<TournamentSnapshot> = [
  ["title", "Title", orNone("—")],
  ["description", "Description", orNone("None")],
  ["format", "Format", (v) => (v === "icpc" ? "ICPC-style contest" : v === "knockout" ? "1v1 knockout" : orNone("—")(v))],
  ["teamSize", "Team size", orNone("—")],
  ["capacity", "Places", orNone("No limit")],
  ["registrationClosesAt", "Registration closes", istTime],
  ["startsAt", "Starts", istTime],
  ["durationMinutes", "Length", (v) => `${String(v)} min`],
  ["allowedDomains", "Email domains", (v) => (Array.isArray(v) && v.length ? v.map((d) => `@${String(d)}`).join(", ") : "Anyone")],
  ["inviteCode", "Invite code", orNone("None")],
  ["requiresApproval", "Organizer approves entrants", (v) => (v ? "Yes" : "No")],
  ["freezeMinutes", "Scoreboard freeze", (v) => (v ? `${String(v)} min before the end` : "None")],
];

const ORG_KIND_LABEL: Record<string, string> = { college: "College or university", club: "Student club or chapter", company: "Company", community: "Community" };

const ORG_FIELDS: FieldSpec<OrgSnapshot> = [
  ["name", "Name", orNone("—")],
  ["kind", "Kind", (v) => ORG_KIND_LABEL[String(v)] ?? orNone("—")(v)],
  ["website", "Website", orNone("None")],
  ["city", "City", orNone("None")],
  ["about", "About", orNone("None")],
];

/**
 * Every field, with what it was beside the ones that changed. Compared on the
 * stored values, not the words shown, so a change the display rounds away (a
 * second, a trailing space the reader trims anyway) still counts.
 */
function describe<T extends object>(spec: FieldSpec<T>, before: T | null, after: T): FieldView[] {
  return spec.map(([key, label, show]) => {
    const now = (after as Record<string, unknown>)[key];
    const was = before ? (before as Record<string, unknown>)[key] : undefined;
    const changed = before !== null && JSON.stringify(was ?? null) !== JSON.stringify(now ?? null);
    return { field: key, label, value: show(now), before: changed ? show(was) : null };
  });
}

export const describeTournament = (before: TournamentSnapshot | null, after: TournamentSnapshot) => describe(TOURNAMENT_FIELDS, before, after);
export const describeOrg = (before: OrgSnapshot | null, after: OrgSnapshot) => describe(ORG_FIELDS, before, after);

/** Whether an edit changed anything a player would see — the trigger for a new review. */
export const tournamentChanged = (before: TournamentSnapshot, after: TournamentSnapshot) => describeTournament(before, after).some((f) => f.before !== null);
export const orgChanged = (before: OrgSnapshot, after: OrgSnapshot) => describeOrg(before, after).some((f) => f.before !== null);

export interface TeamRow {
  line: number;
  name: string;
  members: string[];
}

/**
 * The organizer's team list: one team per line, the name first and then
 * each member's CodeKairo email or username, separated by commas —
 *
 *     Byte Me, asha@iitb.ac.in, rohan_k, meera@iitb.ac.in
 *
 * A pasted spreadsheet (tabs) reads the same, and a header row that starts
 * "team" is skipped. Every problem is reported with its line number, and
 * nothing is saved unless the whole list is clean.
 */
export function parseTeamList(text: string, teamSize: number): { teams: TeamRow[] } | { errors: string[] } {
  const teams: TeamRow[] = [];
  const errors: string[] = [];
  const names = new Set<string>();
  const people = new Map<string, number>();

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    const cells = raw.split(/[,\t]/).map((c) => c.trim()).filter(Boolean);
    if (cells.length === 0) return;
    if (i === 0 && /^team/i.test(cells[0]) && cells.length > 1 && /^(member|email|user)/i.test(cells[1])) return;
    const [name, ...members] = cells;
    if (name.length > LIMITS.teamNameMax) errors.push(`Line ${line}: the team name is longer than ${LIMITS.teamNameMax} characters.`);
    if (names.has(name.toLowerCase())) errors.push(`Line ${line}: there is already a team called "${name}".`);
    names.add(name.toLowerCase());
    if (members.length === 0) errors.push(`Line ${line}: "${name}" has no members.`);
    if (members.length > teamSize) errors.push(`Line ${line}: "${name}" has ${members.length} members; teams here have at most ${teamSize}.`);
    for (const m of members) {
      const key = m.toLowerCase();
      const seen = people.get(key);
      if (seen !== undefined) errors.push(`Line ${line}: ${m} is already in the team on line ${seen}.`);
      else people.set(key, line);
    }
    teams.push({ line, name, members });
  });

  if (teams.length === 0 && errors.length === 0) errors.push("The list is empty.");
  if (teams.length > LIMITS.teamsPerUpload) errors.push(`At most ${LIMITS.teamsPerUpload} teams in one upload.`);
  return errors.length ? { errors } : { teams };
}

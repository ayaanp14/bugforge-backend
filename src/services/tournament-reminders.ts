/**
 * Tournament reminders (CodeKairo Battles): the mail every approved entrant
 * gets 24 hours and 1 hour before their tournament starts, and the one an
 * organizer — or a CodeKairo admin — sends by pressing "Send reminder".
 * When each may go is tournament-reminder-rules.ts; the words are
 * tournament-reminder-mail.ts; this file loads, claims and sends.
 *
 * The `TournamentReminder` row is the claim and the log. The scheduled ones
 * are claimed per tournament and start time (`day@<ms>` / `hour@<ms>`, a
 * unique key), so two instances ticking together — a deploy overlaps the old
 * process with the new — send once, and a tournament whose start moved is
 * reminded for the new time. That is why the job keeps no JobRun row for a
 * pass that sent nothing (lib/scheduler `idle`): it runs on every tick and
 * its own claims are the lock. A manual one is claimed by a conditional
 * insert that re-checks the cooldown and the cap in its WHERE, the way
 * services/battles.ts `register` claims the last place, so a double click or
 * two organizers at once send one mail, not two.
 *
 * Each entrant also gets the bell (the main site's notifications, linking to
 * the tournament on Battles), typed by the reminder row: an entrant is
 * mailed only when their notification was newly written, so a reminder
 * that is somehow delivered twice reaches nobody twice.
 *
 * Mail goes through lib/email (Brevo first, the hosted flow second, nothing
 * locally). Brevo's free plan is 300 a day, so a large field can run past
 * it; the row records how many the provider took, and the dialog shows it.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { newId } from "../lib/db-ids.js";
import { emailEnabled, sendEmail } from "../lib/email.js";
import { FONT_FACES } from "../lib/mail-design.js";
import { isDuplicateKey, withLockRetry } from "../lib/seat-claim.js";
import type { Job } from "../lib/scheduler.js";
import { BattlesError } from "./battles-error.js";
import { tournamentPhase } from "./battles-rules.js";
import { createNotificationsOnce } from "./notifications.js";
import { reminderMail, reminderNotice, type ReminderPerson, type ReminderTournament } from "./tournament-reminder-mail.js";
import {
  AUTO_KINDS,
  MANUAL_MAX,
  REMINDER_FLOOR_MS,
  REMINDER_GAP_MS,
  REMINDER_LEAD_MS,
  autoReminder,
  claimFor,
  dueReminder,
  manualBlocker,
  nextManualAt,
  scheduledAt,
  scheduledState,
  type AutoKind,
  type ReminderKind,
  type ScheduledState,
} from "./tournament-reminder-rules.js";

const MANAGER_ROLES = ["owner", "admin"];
/** Concurrent sends; each is one HTTP call to the provider. */
const MAIL_CONCURRENCY = 4;
/** A manual reminder still "sending" after this long was cut short (a restart); it is shown as it stands. */
const SENDING_FOR_MS = 15 * 60_000;

const REMINDER_TOURNAMENT = {
  id: true,
  slug: true,
  title: true,
  format: true,
  status: true,
  orgId: true,
  teamSize: true,
  capacity: true,
  registrationClosesAt: true,
  startsAt: true,
  durationMinutes: true,
  freezeMinutes: true,
  finishedAt: true,
  org: { select: { name: true, verifiedAt: true } },
  _count: { select: { problems: true, teams: true, entries: { where: { status: { in: ["pending", "approved"] } } } } },
} satisfies Prisma.TournamentSelect;

type ReminderRow = Prisma.TournamentGetPayload<{ select: typeof REMINDER_TOURNAMENT }>;

function mailTournament(t: ReminderRow): ReminderTournament {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    format: t.format === "icpc" ? "icpc" : "knockout",
    orgName: t.org.name,
    startsAt: t.startsAt,
    durationMinutes: t.durationMinutes,
    teamSize: t.teamSize,
    problemCount: t._count.problems,
    entrants: t._count.entries,
    teams: t._count.teams,
    capacity: t.capacity,
    freezeMinutes: t.freezeMinutes,
  };
}

/** Who a reminder goes to: approved entrants — not a registration still waiting on the organizer, nor a declined one. */
async function entrantsOf(tournamentId: string) {
  const rows = await prisma.tournamentEntry.findMany({
    where: { tournamentId, status: "approved" },
    select: { userId: true, checkedInAt: true, team: { select: { name: true } }, user: { select: { email: true, name: true } } },
  });
  return rows.map((r) => ({
    userId: r.userId,
    person: { email: r.user.email ?? "", name: r.user.name, team: r.team?.name ?? null, checkedIn: r.checkedInAt !== null } satisfies ReminderPerson,
  }));
}

/** Run `fn` over `items`, `limit` at a time; resolves to how many returned true. */
async function countTrue<T>(items: readonly T[], limit: number, fn: (item: T) => Promise<boolean>): Promise<number> {
  let next = 0;
  let yes = 0;
  const worker = async () => {
    while (next < items.length) {
      if (await fn(items[next++]!)) yes++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return yes;
}

/** Ring every entrant's bell and mail them; records the outcome on the reminder row. */
async function deliver(reminderId: string, t: ReminderTournament, kind: ReminderKind, now: Date): Promise<{ recipients: number; mailed: number }> {
  const entrants = await entrantsOf(t.id);
  const fresh = new Set(
    await createNotificationsOnce(
      `battles_reminder:${reminderId}`,
      entrants.map((r) => ({ userId: r.userId, ...reminderNotice(t, r.person, now) })),
    ),
  );
  const targets = entrants.filter((r) => fresh.has(r.userId) && r.person.email);
  const mailed = await countTrue(targets, MAIL_CONCURRENCY, (r) => {
    const mail = reminderMail(t, r.person, kind, now);
    return sendEmail({ to: r.person.email, subject: mail.subject, text: mail.text, html: mail.html, kind: "tournament_reminder" });
  });
  await prisma.tournamentReminder.update({ where: { id: reminderId }, data: { recipients: entrants.length, mailed, finishedAt: new Date() } });
  return { recipients: entrants.length, mailed };
}

/* ── the scheduled ones ───────────────────────────────────────────── */

/** The tick's five-minute slot, as the job's period ("2026-10-02T13:25"). */
const slotOf = (now: Date) => new Date(Math.floor(now.getTime() / 300_000) * 300_000).toISOString().slice(0, 16);

export const tournamentRemindersJob: Job = {
  name: "tournament_reminders",
  description: "Battles: mails each published tournament's approved entrants 24 hours and 1 hour before the start (and rings their bell). Checks every tick; only a pass that sent something is logged.",
  periodOf: slotOf,
  idle: (result) => result["sent"] === 0,
  async run(now) {
    // Everything that could be due: inside the day mail's lead, outside the hour mail's floor.
    const rows = await prisma.tournament.findMany({
      where: {
        status: "published",
        org: { verifiedAt: { not: null } },
        startsAt: { gt: new Date(now.getTime() + REMINDER_FLOOR_MS.hour), lte: new Date(now.getTime() + REMINDER_LEAD_MS.day) },
      },
      select: REMINDER_TOURNAMENT,
      orderBy: { startsAt: "asc" },
      take: 500,
    });
    const open = rows.filter((t) => dueReminder(t.startsAt, now) !== null);
    if (open.length === 0) return { sent: 0 };
    // One read for what each has had — the claims taken and the last send —
    // rather than an insert that fails on the key for every tournament on
    // every tick of a 21-hour window; and one for who is approved. A
    // tournament nobody is approved for yet is not claimed: its day mail
    // waits in its window for the first entrant rather than going to no one.
    const ids = open.map((t) => t.id);
    const [past, approved] = await Promise.all([
      prisma.tournamentReminder.findMany({
        where: { tournamentId: { in: ids } },
        orderBy: { createdAt: "desc" },
        select: { tournamentId: true, claim: true, createdAt: true },
      }),
      prisma.tournamentEntry.groupBy({ by: ["tournamentId"], where: { tournamentId: { in: ids }, status: "approved" }, _count: { _all: true } }),
    ]);
    const history = (id: string) => past.filter((r) => r.tournamentId === id);
    const entered = new Set(approved.filter((a) => a._count._all > 0).map((a) => a.tournamentId));

    let sent = 0;
    let mailed = 0;
    const tournaments: string[] = [];
    for (const t of open) {
      if (!entered.has(t.id)) continue;
      const mine = history(t.id);
      const kind = autoReminder(t.startsAt, mine.map((r) => r.claim), mine[0]?.createdAt ?? null, now);
      if (!kind) continue;
      const claim = claimFor(kind, t.startsAt);
      const created = await prisma.tournamentReminder
        .create({ data: { tournamentId: t.id, claim, kind }, select: { id: true } })
        .catch((err: unknown) => (isDuplicateKey(err) ? null : Promise.reject(err)));
      if (!created) continue; // another instance claimed it between the read and the insert
      const outcome = await deliver(created.id, mailTournament(t), kind, now);
      sent++;
      mailed += outcome.mailed;
      tournaments.push(`${t.slug} (${kind}: ${outcome.mailed}/${outcome.recipients})`);
    }
    return { sent, mailed, tournaments };
  },
};

/* ── the button ───────────────────────────────────────────────────── */

/** The tournament, if the caller organizes it or is a CodeKairo admin; a 404 otherwise, as for every organizer route. */
async function remindable(viewer: { userId: string; isAdmin: boolean }, tournamentId: string): Promise<ReminderRow> {
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: REMINDER_TOURNAMENT });
  if (!t) throw new BattlesError(404, "No such tournament.");
  if (!viewer.isAdmin) {
    const member = await prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId: t.orgId, userId: viewer.userId } }, select: { role: true } });
    if (!member || !MANAGER_ROLES.includes(member.role)) throw new BattlesError(404, "No such tournament.");
  }
  return t;
}

/** What the manual rule needs to know, in one round trip. */
async function standing(t: ReminderRow) {
  const [approved, pending, sent] = await Promise.all([
    prisma.tournamentEntry.count({ where: { tournamentId: t.id, status: "approved" } }),
    prisma.tournamentEntry.count({ where: { tournamentId: t.id, status: "pending" } }),
    prisma.tournamentReminder.findMany({
      where: { tournamentId: t.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, claim: true, kind: true, sentById: true, recipients: true, mailed: true, createdAt: true, finishedAt: true },
    }),
  ]);
  return { approved, pending, sent };
}

/**
 * Whether a viewer of the tournament page is offered the button: an
 * organizer or a CodeKairo admin, on a public tournament that has not
 * started. The dialog then says whether it can go right now.
 */
export function offersReminder(t: { status: string; format: string; registrationClosesAt: Date; startsAt: Date; durationMinutes: number; finishedAt: Date | null }, canManage: boolean, isAdmin: boolean, now: Date): boolean {
  if (!canManage && !isAdmin) return false;
  const phase = tournamentPhase(t, now);
  return t.status === "published" && (phase === "registration" || phase === "registration_closed");
}

export interface ReminderStatus {
  /** Approved entrants: who a reminder goes to. */
  recipients: number;
  /** Registrations still waiting on the organizer, who are not reminded. */
  pending: number;
  /** False with no mail provider configured: the bell still rings. */
  emailEnabled: boolean;
  scheduled: Array<{ kind: AutoKind; at: string; state: ScheduledState; mailed: number | null; recipients: number | null }>;
  history: Array<{ id: string; kind: ReminderKind; at: string; recipients: number; mailed: number; sending: boolean; by: string | null }>;
  manualLeft: number;
  nextManualAt: string | null;
  /** Why "Send now" is refused at the moment, or null. */
  blocker: string | null;
  /** The mail as a player would get it, addressed to the viewer. */
  preview: { subject: string; html: string };
}

async function statusOf(t: ReminderRow, viewer: { userId: string }, now: Date): Promise<ReminderStatus> {
  const { approved, pending, sent } = await standing(t);
  const claims = sent.map((r) => r.claim);
  const manual = sent.filter((r) => r.kind === "manual");
  const byIds = [...new Set(manual.map((r) => r.sentById).filter((id): id is string => !!id))];
  const [senders, me, team] = await Promise.all([
    byIds.length ? prisma.user.findMany({ where: { id: { in: byIds } }, select: { id: true, username: true, name: true } }) : Promise.resolve([]),
    prisma.user.findUnique({ where: { id: viewer.userId }, select: { email: true, name: true } }),
    t.format === "icpc" ? prisma.tournamentTeam.findFirst({ where: { tournamentId: t.id }, orderBy: { createdAt: "asc" }, select: { name: true } }) : Promise.resolve(null),
  ]);
  const senderName = new Map(senders.map((u) => [u.id, u.username ? `@${u.username}` : (u.name ?? null)]));
  const phase = tournamentPhase(t, now);
  const preview = reminderMail(
    mailTournament(t),
    { email: me?.email ?? "you@example.com", name: me?.name ?? null, team: team?.name ?? "Your team", checkedIn: false },
    "manual",
    now,
  );
  return {
    recipients: approved,
    pending,
    emailEnabled: emailEnabled(),
    scheduled: AUTO_KINDS.map((kind) => {
      const row = sent.find((r) => r.claim === claimFor(kind, t.startsAt));
      return {
        kind,
        at: (row?.createdAt ?? scheduledAt(kind, t.startsAt)).toISOString(),
        state: scheduledState(kind, t.startsAt, claims, now),
        mailed: row ? row.mailed : null,
        recipients: row ? row.recipients : null,
      };
    }),
    history: sent.map((r) => ({
      id: r.id,
      kind: r.kind as ReminderKind,
      at: r.createdAt.toISOString(),
      recipients: r.recipients,
      mailed: r.mailed,
      sending: r.finishedAt === null && now.getTime() - r.createdAt.getTime() < SENDING_FOR_MS,
      by: r.sentById ? (senderName.get(r.sentById) ?? null) : null,
    })),
    manualLeft: Math.max(0, MANUAL_MAX - manual.length),
    nextManualAt: nextManualAt(sent[0]?.createdAt ?? null)?.toISOString() ?? null,
    blocker: manualBlocker(
      { status: t.status, phase, startsAt: t.startsAt, recipients: approved, lastSentAt: sent[0]?.createdAt ?? null, manualCount: manual.length, claims },
      now,
    ),
    // Without the web fonts: the preview is drawn inside a Battles page, whose
    // CSP (font-src 'self') and the fonts' own CORS refuse codekairo.com's
    // files — a console error apiece — and the system stack is what Gmail
    // shows anyway.
    preview: { subject: preview.subject, html: preview.html.replace(FONT_FACES, "") },
  };
}

/** GET …/reminders — the dialog: who gets it, what went, what is coming, and the mail itself. */
export async function reminderStatus(viewer: { userId: string; isAdmin: boolean }, tournamentId: string): Promise<ReminderStatus> {
  const t = await remindable(viewer, tournamentId);
  return statusOf(t, viewer, new Date());
}

/**
 * POST …/reminders — send one now. Answers once the reminder is claimed;
 * the mails go out behind the answer (a field of hundreds takes a while),
 * and the row says when they are done.
 */
export async function sendReminderNow(viewer: { userId: string; isAdmin: boolean }, tournamentId: string): Promise<ReminderStatus> {
  const t = await remindable(viewer, tournamentId);
  const now = new Date();
  const { approved, sent } = await standing(t);
  const blocker = manualBlocker(
    {
      status: t.status,
      phase: tournamentPhase(t, now),
      startsAt: t.startsAt,
      recipients: approved,
      lastSentAt: sent[0]?.createdAt ?? null,
      manualCount: sent.filter((r) => r.kind === "manual").length,
      claims: sent.map((r) => r.claim),
    },
    now,
  );
  if (blocker) throw new BattlesError(409, blocker);

  // The gap and the cap again, inside the insert: the check above read
  // before another click (or another organizer) could have claimed it.
  const id = newId();
  const inserted = await withLockRetry("tournamentReminder", () => prisma.$executeRaw`
    INSERT INTO TournamentReminder (id, tournamentId, claim, kind, sentById, recipients, mailed, createdAt)
    SELECT ${id}, ${t.id}, ${`manual@${now.getTime()}`}, 'manual', ${viewer.userId}, ${approved}, 0, ${now}
    WHERE NOT EXISTS (SELECT 1 FROM TournamentReminder WHERE tournamentId = ${t.id} AND createdAt > ${new Date(now.getTime() - REMINDER_GAP_MS)})
      AND (SELECT COUNT(*) FROM TournamentReminder WHERE tournamentId = ${t.id} AND kind = 'manual') < ${MANUAL_MAX}`);
  if (inserted === 0) throw new BattlesError(409, "A reminder for this tournament was just sent.");

  void deliver(id, mailTournament(t), "manual", now).catch((err) => {
    console.error(`[battles] reminder ${id} for ${t.slug} failed:`, (err as Error)?.message ?? err);
  });
  return statusOf(t, viewer, now);
}

/**
 * When a tournament's reminder mails go, without a database:
 * services/tournament-reminders.ts loads the rows and sends,
 * tournament-reminder-rules.test.ts pins these.
 *
 *  - Two go by themselves: one 24 hours before the start, one an hour
 *    before — which for a knockout is the moment check-in opens
 *    (knockout-rules CHECK_IN_MINUTES), so that mail is the "check in now".
 *    The scheduler ticks every five minutes, so each is due inside a window
 *    rather than at an instant; a window that has closed is skipped, never
 *    caught up — "starts in 24 hours" an hour before the start is wrong.
 *  - So a tournament published (or approved) less than three hours before
 *    its start gets only the hour mail: the day mail's window closed before
 *    it was public, and two mails that close together are one too many.
 *  - An organizer or a CodeKairo admin can send one by hand at any time
 *    before the start, with a brake: never in the hour before a scheduled
 *    one that has not gone, and at most MANUAL_MAX per tournament.
 *  - No two reminders of one tournament go within an hour of each other
 *    (REMINDER_GAP_MS) — a manual one is refused, a scheduled one waits
 *    inside its window. A player's inbox should hear about one tournament a
 *    few times, not on every click. The Battles privacy policy promises this.
 */
import { CHECK_IN_MINUTES } from "./knockout-rules.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export type AutoKind = "day" | "hour";
export type ReminderKind = AutoKind | "manual";
export const AUTO_KINDS: readonly AutoKind[] = ["day", "hour"];

/** How long before the start each scheduled reminder is due. */
export const REMINDER_LEAD_MS: Record<AutoKind, number> = { day: 24 * HOUR, hour: CHECK_IN_MINUTES * MINUTE };
/** Closer to the start than this, the reminder is no longer sent: its words would be wrong. */
export const REMINDER_FLOOR_MS: Record<AutoKind, number> = { day: 3 * HOUR, hour: 10 * MINUTE };

/** Between any two reminders of one tournament. */
export const REMINDER_GAP_MS = HOUR;
/** A manual reminder is refused this close before a scheduled one that has not gone yet — which keeps the gap from that side too. */
export const SCHEDULED_SOON_MS = REMINDER_GAP_MS;
/** Manual reminders one tournament may have. */
export const MANUAL_MAX = 5;

/**
 * The scheduled reminder due at `now`, or null. The two windows never
 * overlap (the day mail's closes three hours out, the hour mail's opens one).
 */
export function dueReminder(startsAt: Date, now: Date): AutoKind | null {
  const left = startsAt.getTime() - now.getTime();
  for (const kind of AUTO_KINDS) {
    if (left <= REMINDER_LEAD_MS[kind] && left > REMINDER_FLOOR_MS[kind]) return kind;
  }
  return null;
}

/**
 * What the scheduler sends now for one tournament, or null: a reminder whose
 * window is open, whose claim is not taken, and that keeps the gap from the
 * last one. Waiting for the gap only moves it later inside its window (a
 * start moved by an approved edit can open a new day mail minutes after the
 * old one went).
 */
export function autoReminder(startsAt: Date, claims: readonly string[], lastSentAt: Date | null, now: Date): AutoKind | null {
  const kind = dueReminder(startsAt, now);
  if (!kind || claims.includes(claimFor(kind, startsAt))) return null;
  if (lastSentAt && now.getTime() - lastSentAt.getTime() < REMINDER_GAP_MS) return null;
  return kind;
}

/**
 * The claim a scheduled reminder is recorded under — unique per tournament,
 * and keyed by the start time, so a tournament whose start moves (an edit
 * the admin approved) is reminded again for the new time.
 */
export const claimFor = (kind: AutoKind, startsAt: Date): string => `${kind}@${startsAt.getTime()}`;

/** When a scheduled reminder is due for this start. */
export const scheduledAt = (kind: AutoKind, startsAt: Date): Date => new Date(startsAt.getTime() - REMINDER_LEAD_MS[kind]);

/**
 * Where a scheduled reminder stands: `sent` (its claim is taken), `due` (its
 * window is open and the next tick takes it), `scheduled` (still to come) or
 * `skipped` (its window closed without it — published too late, or the
 * tournament was hidden for review through it).
 */
export type ScheduledState = "sent" | "due" | "scheduled" | "skipped";

export function scheduledState(kind: AutoKind, startsAt: Date, claims: readonly string[], now: Date): ScheduledState {
  if (claims.includes(claimFor(kind, startsAt))) return "sent";
  const left = startsAt.getTime() - now.getTime();
  if (left <= REMINDER_FLOOR_MS[kind]) return "skipped";
  return left <= REMINDER_LEAD_MS[kind] ? "due" : "scheduled";
}

export interface ManualInput {
  status: string;
  phase: string;
  startsAt: Date;
  /** Approved entrants — who the mail goes to. */
  recipients: number;
  /** The newest reminder of any kind, if one went. */
  lastSentAt: Date | null;
  manualCount: number;
  /** The claims already taken, to tell a scheduled reminder that went from one still to come. */
  claims: readonly string[];
}

/** The instant a manual reminder may next be sent, counting the gap alone. */
export const nextManualAt = (lastSentAt: Date | null): Date | null => (lastSentAt ? new Date(lastSentAt.getTime() + REMINDER_GAP_MS) : null);

const minutes = (ms: number) => {
  const m = Math.max(1, Math.ceil(ms / MINUTE));
  return `${m} minute${m === 1 ? "" : "s"}`;
};

const LABEL: Record<AutoKind, string> = { day: "24-hour", hour: "1-hour" };

/** Why a manual reminder cannot go now, in words for the organizer, or null when it can. */
export function manualBlocker(t: ManualInput, now: Date): string | null {
  if (t.status === "cancelled") return "This tournament was cancelled.";
  if (t.status !== "published") return "Only a published tournament has players to remind.";
  if (t.phase === "live" || t.phase === "finished" || t.startsAt <= now) return "The tournament has started — reminders are for before the start.";
  if (t.recipients === 0) return "Nobody is entered yet, so there is no one to remind.";
  if (t.manualCount >= MANUAL_MAX) return `This tournament has had ${MANUAL_MAX} reminders sent by hand, the most it can have. The scheduled ones still go.`;
  const next = nextManualAt(t.lastSentAt);
  if (next && next > now) {
    return `A reminder went out ${minutes(now.getTime() - t.lastSentAt!.getTime())} ago. Players get at most one an hour — you can send another in ${minutes(next.getTime() - now.getTime())}.`;
  }
  for (const kind of [...AUTO_KINDS].reverse()) {
    const state = scheduledState(kind, t.startsAt, t.claims, now);
    if (state === "due") return `The ${LABEL[kind]} reminder is going out by itself in the next few minutes.`;
    const until = scheduledAt(kind, t.startsAt).getTime() - now.getTime();
    if (state === "scheduled" && until <= SCHEDULED_SOON_MS) return `The ${LABEL[kind]} reminder goes out by itself in ${minutes(until)} — no need to send one now.`;
  }
  return null;
}

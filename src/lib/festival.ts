import { dayKey } from "./clock.js";

/**
 * Diwali 2026, "Light seven diyas" (the owner's ask, 2026-11-04): 5 to 11
 * November (moved from 4 to 10 on the owner's word, 2026-11-05), one diya for each day, lit by an accepted coding or SQL submission
 * on that day in the product's calendar. A missed day stays dark; there is no
 * catching up.
 *
 * Which days are lit is derived from the submissions and never stored. What
 * is stored is what the lights earned, as two `Honour` rows, because a frame
 * must reach every author payload and those already carry the kinds
 * (HONOUR_SELECT), and because the badge outlives the campaign:
 *
 *   1 diya  → the frame, worn until FESTIVAL_LAST_DAY (the client's lib/festival.ts checks the date)
 *   3 diyas → the Diwali card, drawn in the browser, so nothing to store
 *   7 diyas → the badge `festival-7` for good (lib/badges.ts)
 *
 * Neither kind is in lib/honours.ts HONOURS on purpose: an honour there plays
 * a celebration, wears the star and appears in the admin's grant list. Bug
 * hunts do not light a diya because a hunt's PASS can be forged.
 *
 * Everything is keyed on the date, so the campaign switches itself off and
 * nothing needs a deploy to end it. Mirrored by the SPA's lib/festival.ts.
 */

export const FESTIVAL_DAYS = ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11"] as const;
/** Diyas the badge takes: every day's. */
export const FESTIVAL_GOAL = FESTIVAL_DAYS.length;
/** The day after the last diya: the home still shows the result, and the frame is still worn. */
export const FESTIVAL_LAST_DAY = "2026-11-12";

export const FESTIVAL_FRAME_KIND = "diwali_2026_diya";
export const FESTIVAL_BADGE_KIND = "diwali_2026";

/** The window of submissions that can light a diya, as instants (IST midnights). */
export const FESTIVAL_WINDOW = {
  from: new Date("2026-11-05T00:00:00+05:30"),
  until: new Date("2026-11-12T00:00:00+05:30"),
};

export interface FestivalSlice {
  /** The days lit, in calendar order. */
  lit: string[];
}

/** Whether the home shows the strip at all: the seven days and the day after. */
export function festivalShowing(now: Date): boolean {
  const today = dayKey(now);
  return today >= FESTIVAL_DAYS[0] && today <= FESTIVAL_LAST_DAY;
}

/** Whether a solve at this instant can light a diya. */
export function festivalLighting(now: Date): boolean {
  return (FESTIVAL_DAYS as readonly string[]).includes(dayKey(now));
}

/** The festival days these accepted submissions fall on: each once, in order. */
export function litDays(instants: readonly Date[]): string[] {
  const days = new Set(instants.map((at) => dayKey(at)));
  return FESTIVAL_DAYS.filter((day) => days.has(day));
}

/** The Honour kinds this many lit days has earned. */
export function festivalKinds(lit: number): string[] {
  if (lit >= FESTIVAL_GOAL) return [FESTIVAL_FRAME_KIND, FESTIVAL_BADGE_KIND];
  return lit >= 1 ? [FESTIVAL_FRAME_KIND] : [];
}

/**
 * The announcement's window: the first day, 08:00–21:00 in the product zone. Wide
 * because the campaign started the day it shipped, on the owner's word, and a
 * job whose window has passed is skipped rather than caught up (lib/scheduler).
 */
export function festivalAnnouncePeriod(now: Date, hour: number): string | null {
  return dayKey(now) === FESTIVAL_DAYS[0] && hour >= 8 && hour < 21 ? "diwali-2026" : null;
}

export const FESTIVAL_ANNOUNCEMENT = {
  type: "diwali_2026_start",
  title: "Happy Diwali! Light seven diyas",
  body: "Solve any problem to light a diya, one a day until 11 November. Light all seven for a limited-edition badge.",
  href: "/",
};

/* ── the festival's later notices (the owner's ask, 2026-11-07) ──────────── */

/** Diwali itself, 8 November: the day the greeting says "Happy Diwali" and the kata is the festival problem. */
export const DIWALI_DAY = "2026-11-08";
/** The days the "keep going" notice goes out: the badge needs every diya, so only these two are still in reach of it. */
export const LAST_CHANCE_DAYS = ["2026-11-10", "2026-11-11"] as const;
/** Diwali's kata (services/daily-contest.ts PINNED_DAYS), which every Diwali-day notice that asks for a solve links to. */
export const DIWALI_PROBLEM = { slug: "brightest-string-of-diyas", title: "Brightest String of Diyas" };

export interface FestivalNotice {
  /** The notification type: one a day, so createNotificationsOnce sends each once and push (lib/push.ts PUSHED) knows it. */
  type: string;
  title: string;
  body: string;
  href: string;
}

/**
 * The notice job's period. Diwali's runs from 08:00 to 21:00 IST, as wide as
 * the announcement and for the same reason: a window that passed before a
 * deploy is skipped, never caught up. The last-chance ones run 17:00–22:00, late
 * enough that a member who solves in the day is not asked to, early enough
 * to solve before midnight.
 */
export function festivalNoticePeriod(now: Date, hour: number): string | null {
  const today = dayKey(now);
  if (today === DIWALI_DAY && hour >= 8 && hour < 21) return `diwali-2026-day`;
  if ((LAST_CHANCE_DAYS as readonly string[]).includes(today) && hour >= 17 && hour < 22) return `diwali-2026-last:${today}`;
  return null;
}

/** Whether every festival day before `today` is lit: the only accounts the badge is still open to. */
export function onCourseForBadge(lit: readonly string[], today: string): boolean {
  const before = FESTIVAL_DAYS.filter((day) => day < today);
  return before.every((day) => lit.includes(day));
}

/**
 * What one account is told today, or null when it is told nothing. Worded by
 * what its own lights show, and never promising what is out of reach: a
 * missed day stays dark, so the badge is named only to an account that has
 * lit every day so far.
 *
 *   Diwali: everyone — the first diya (0 lit), the count (1–2), the card (3,
 *           which on 8 Nov means every day so far), or "already lit".
 *   10/11 Nov: only an account on course for the badge with today still dark.
 */
export function festivalNoticeFor(lit: readonly string[], today: string): FestivalNotice | null {
  const count = lit.length;
  const litToday = lit.includes(today);
  const problemHref = `/problems/${DIWALI_PROBLEM.slug}`;
  if (today === DIWALI_DAY) {
    const type = "diwali_2026_day";
    if (litToday) {
      return { type, title: "Happy Diwali! Today's diya is lit", body: `You've lit ${count} of ${FESTIVAL_GOAL}. Thank you for spending part of Diwali with us.`, href: "/" };
    }
    if (count === 0) {
      return {
        type,
        title: "Happy Diwali! Light your first diya",
        body: `One accepted solve today lights a diya and puts a diya frame on your avatar. Today's problem, ${DIWALI_PROBLEM.title}, is an easy one.`,
        href: problemHref,
      };
    }
    if (onCourseForBadge(lit, today)) {
      return {
        type,
        title: "Happy Diwali! Your Diwali card is ready",
        body: `You've lit ${count} of ${FESTIVAL_GOAL}, and your card is open on the home page. One solve today keeps you on course for the badge.`,
        href: "/",
      };
    }
    return {
      type,
      title: `Happy Diwali! You've lit ${count} of ${FESTIVAL_GOAL}`,
      body: `Light today's diya with one solve. Today's problem, ${DIWALI_PROBLEM.title}, is an easy one.`,
      href: problemHref,
    };
  }
  if ((LAST_CHANCE_DAYS as readonly string[]).includes(today)) {
    if (litToday || !onCourseForBadge(lit, today)) return null;
    const type = `diwali_2026_last_${today}`;
    const left = FESTIVAL_DAYS.filter((day) => day >= today).length;
    return left > 1
      ? {
          type,
          title: `${left} diyas left for the Diwali badge`,
          body: `You've lit every diya so far, ${count} of ${FESTIVAL_GOAL}. Solve one problem today and one tomorrow to earn the badge.`,
          href: "/challenges",
        }
      : {
          type,
          title: "Last diya: the badge is one solve away",
          body: `You've lit ${count} of ${FESTIVAL_GOAL}. One accepted solve before midnight lights the seventh and earns the Diwali badge.`,
          href: "/challenges",
        };
  }
  return null;
}
